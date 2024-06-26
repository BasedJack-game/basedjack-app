import { MongoClient, Db, MongoClientOptions } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGODB_URI || "";

let client: MongoClient | null = null;
let db: Db | null = null;

async function createMongoClient(
  retries = 5,
  delay = 2000
): Promise<MongoClient> {
  if (client) {
    return client;
  }
  const options: MongoClientOptions = {
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    retryWrites: true,
    w: "majority",
  };
  client = new MongoClient(uri, options);

  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      console.log("MongoClient connected successfully.");
      return client;
    } catch (error) {
      console.error(`Error connecting MongoClient (attempt ${i + 1}):`, error);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
  return client;
}

async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }
  try {
    client = await createMongoClient();
    db = client.db("blackjack_game");
    console.log("Connected to database:", "blackjack_game");
    return db;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

async function closeMongoClient() {
  if (client) {
    try {
      await client.close();
      console.log("MongoClient disconnected.");
    } catch (error) {
      console.error("Error closing MongoClient:", error);
    }
    client = null;
    db = null;
  }
}

async function getCollection(collectionName: string) {
  const database = await connectToDatabase();
  return database.collection(collectionName);
}

export async function findOneDocument(collectionName: string, query: object) {
  try {
    const collection = await getCollection(collectionName);
    return await collection.findOne(query);
  } finally {
    await closeMongoClient();
  }
}

export async function insertOneDocument(
  collectionName: string,
  document: object
) {
  try {
    const collection = await getCollection(collectionName);
    return await collection.insertOne(document);
  } finally {
    await closeMongoClient();
  }
}

export async function findDocuments(collectionName: string, query: object) {
  try {
    const collection = await getCollection(collectionName);
    return await collection.find(query).toArray();
  } finally {
    await closeMongoClient();
  }
}

export async function updateOneDocument(
  collectionName: string,
  filter: object,
  update: object
) {
  try {
    const collection = await getCollection(collectionName);
    return await collection.updateOne(filter, update);
  } finally {
    await closeMongoClient();
  }
}

// utils/mongodb.ts

// ... (keep your existing code)

enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

export async function getTopPlayers(limit: number = 3) {
  let collection;
  try {
    collection = await getCollection("gamedata");
    return await collection.aggregate([
      {
        $match: {
          result: GameResult.PlayerWins
        }
      },
      {
        $group: {
          _id: "$address",
          gamesWon: { $sum: 1 }
        }
      },
      {
        $sort: { gamesWon: -1 }
      },
      {
        $limit: limit
      }
    ]).toArray();
  } finally {
    await closeMongoClient();
  }
}

export async function getUserStats(address: string) {
  let collection;
  try {
    collection = await getCollection("gamedata");

    const pipeline = [
      {
        $facet: {
          userStats: [
            { $match: { address: address } },
            { $sort: { _id: 1 } },
            {
              $group: {
                _id: null,
                totalGames: { $sum: 1 },
                gamesWon: { $sum: { $cond: [{ $eq: ["$result", 1] }, 1, 0] } },
                gameResults: { $push: "$result" }
              }
            },
            {
              $project: {
                _id: 0,
                totalGames: 1,
                gamesWon: 1,
                winRatio: { $divide: ["$gamesWon", "$totalGames"] },
                gameResults: 1
              }
            }
          ],
          rankInfo: [
            { $group: { _id: "$address", gamesWon: { $sum: { $cond: [{ $eq: ["$result", 1] }, 1, 0] } } } },
            { $sort: { gamesWon: -1 } },
            {
              $group: {
                _id: null,
                addresses: { $push: "$_id" },
                gamesWon: { $push: "$gamesWon" }
              }
            },
            {
              $project: {
                rank: { $indexOfArray: ["$addresses", address] },
                totalPlayers: { $size: "$addresses" }
              }
            }
          ]
        }
      },
      {
        $project: {
          stats: {
            $let: {
              vars: {
                userStats: { $arrayElemAt: ["$userStats", 0] },
                maxStreak: {
                  $reduce: {
                    input: { $arrayElemAt: ["$userStats.gameResults", 0] },
                    initialValue: { currentStreak: 0, maxStreak: 0 },
                    in: {
                      currentStreak: {
                        $cond: [
                          { $eq: ["$$this", 1] },
                          { $add: ["$$value.currentStreak", 1] },
                          0
                        ]
                      },
                      maxStreak: {
                        $max: [
                          "$$value.maxStreak",
                          { $cond: [{ $eq: ["$$this", 1] }, { $add: ["$$value.currentStreak", 1] }, "$$value.maxStreak"] }
                        ]
                      }
                    }
                  }
                }
              },
              in: {
                totalGames: "$$userStats.totalGames",
                gamesWon: "$$userStats.gamesWon",
                winRatio: "$$userStats.winRatio",
                maxStreak: "$$maxStreak.maxStreak"
              }
            }
          },
          rank: { $add: [{ $arrayElemAt: ["$rankInfo.rank", 0] }, 1] },
          totalPlayers: { $arrayElemAt: ["$rankInfo.totalPlayers", 0] }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    return result[0];
  } finally {
    await closeMongoClient();
  }
}
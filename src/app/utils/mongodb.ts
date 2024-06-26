import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI || "";

let client: MongoClient | null = null;

async function connectToDatabase(): Promise<Db> {
  if (client) {
    return client.db("blackjack_game");
  }

  client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("MongoClient connected.");
    return client.db("blackjack_game");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function getCollection(collectionName: string): Promise<Collection> {
  const database = await connectToDatabase();
  return database.collection(collectionName);
}

export async function findOneDocument(collectionName: string, query: object) {
  let collection;
  try {
    collection = await getCollection(collectionName);
    return await collection.findOne(query);
  } finally {
    await closeConnection();
  }
}

export async function insertOneDocument(
  collectionName: string,
  document: object
) {
  let collection;
  try {
    collection = await getCollection(collectionName);
    return await collection.insertOne(document);
  } finally {
    await closeConnection();
  }
}

export async function findDocuments(collectionName: string, query: object) {
  let collection;
  try {
    collection = await getCollection(collectionName);
    return await collection.find(query).toArray();
  } finally {
    await closeConnection();
  }
}

export async function updateOneDocument(
  collectionName: string,
  filter: object,
  update: object
) {
  let collection;
  try {
    collection = await getCollection(collectionName);
    return await collection.updateOne(filter, update);
  } finally {
    await closeConnection();
  }
}

async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    console.log("MongoClient connection closed.");
  }
}

// utils/mongodb.ts

// ... (keep your existing code)

export async function getTopPlayers(limit: number = 3) {
  let collection;
  try {
    collection = await getCollection("gamedata");
    return await collection.aggregate([
      {
        $match: {
          isFinished: true,
          isBusted: false,
          $expr: { $gt: ["$playerScore", "$dealerScore"] }
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
    await closeConnection();
  }
}

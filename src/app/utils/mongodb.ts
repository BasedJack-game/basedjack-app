import { MongoClient, Db, MongoClientOptions } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGODB_URI || "";

let client: MongoClient | null = null;
let db: Db | null = null;

async function createMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }
  const options: MongoClientOptions = {
    // You can set a higher socket timeout here if needed
    socketTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  };
  client = new MongoClient(uri, options);
  await client.connect();
  return client;
}

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }
  try {
    client = await createMongoClient();
    db = client.db("blackjack_game");
    console.log("MongoClient connected.");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export async function getCollection(collectionName: string) {
  const database = await connectToDatabase();
  return database.collection(collectionName);
}

export async function findOneDocument(collectionName: string, query: object) {
  const collection = await getCollection(collectionName);
  return collection.findOne(query);
}

export async function insertOneDocument(
  collectionName: string,
  document: object
) {
  const collection = await getCollection(collectionName);
  return collection.insertOne(document);
}

export async function findDocuments(collectionName: string, query: object) {
  const collection = await getCollection(collectionName);
  return collection.find(query).toArray();
}

export async function updateOneDocument(
  collectionName: string,
  filter: object,
  update: object
) {
  const collection = await getCollection(collectionName);
  return collection.updateOne(filter, update);
}

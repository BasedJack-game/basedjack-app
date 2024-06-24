// src/utils/dbUtils.ts

import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri);
    console.log("MongoClient initialized.");
    await client.connect();
    console.log("MongoClient connected.");
  }

  db = client.db("blackjack_game");
  return db;
}

export async function getCollection(collectionName: string) {
  const database = await connectToDatabase();
  return database.collection(collectionName);
}

export async function findOneDocument(collectionName: string, query: object) {
  const collection = await getCollection(collectionName);
  return collection.findOne(query);
}

export async function insertOneDocument(collectionName: string, document: object) {
  const collection = await getCollection(collectionName);
  return collection.insertOne(document);
}


export async function findDocuments(collectionName: string, query: object) {
  const collection = await getCollection(collectionName);
  return collection.find(query).toArray();
}

export async function updateOneDocument(collectionName: string, filter: object, update: object) {
  const collection = await getCollection(collectionName);
  return collection.updateOne(filter, update);
}

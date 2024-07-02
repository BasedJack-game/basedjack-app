import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// MongoDB client setup
const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Connect to MongoDB
    await client.connect();

    // Access the database and collection
    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

    // Define your query pipeline
    const pipeline = [
      {
        $group: {
          _id: "$address", // Group by address
        },
      },
      {
        $group: {
          _id: null,
          total_count: { $sum: 1 }, // Count distinct addresses
          addresses: { $push: "$_id" }, // Collect unique addresses into an array
        },
      },
    ];

    // Execute the aggregation pipeline
    const result = await collection.aggregate(pipeline).toArray();

    // Handle the result
    if (result.length > 0) {
      // Documents grouped by address found, handle response
      return NextResponse.json(result);
    } else {
      // No documents found, handle response accordingly
      return NextResponse.json({ message: "No documents found." });
    }
  } catch (error) {
    console.error("Error querying MongoDB:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // Close MongoDB connection
    await client.close();
  }
}

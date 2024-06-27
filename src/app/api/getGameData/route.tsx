import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

export async function GET() {
  try {
    let limit: number = 3;
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
    await client.connect();

    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

    // database query to get top 3 players
    const result = await collection
      .aggregate([
        {
          $match: {
            result: GameResult.PlayerWins,
          },
        },
        {
          $group: {
            _id: "$address",
            gamesWon: { $sum: 1 },
          },
        },
        {
          $sort: { gamesWon: -1 },
        },
        {
          $limit: limit,
        },
      ])
      .toArray();

    const topPlayers = result.map((player) => player._id);

    const params = encodeURIComponent(JSON.stringify(topPlayers));
    const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/generateGameDataImage/?params=${params}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch the image");
    }

    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=image.png",
      },
    });
  } catch (error) {
    console.error("Error fetching top players:", error);
    return NextResponse.json(
      { error: "Unable to fetch top players" },
      { status: 500 }
    );
  }
}

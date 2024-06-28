import { NextRequest, NextResponse } from "next/server";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

let client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
async function getResponse(request: NextRequest): Promise<NextResponse> {
  //   const requestBody = (await request.json()) as FrameRequest;
  //   const { isValid, message } = await getFrameMessage(requestBody);
  //   console.log(message);

  try {
    await client.connect();

    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

    // const address = message?.raw.action.interactor.custody_address;
    const address = "0x16b30ec3d1a87015b4be58b736ed021f3b0e3922";
    console.log("custody address", address);

    if (!address) {
      return NextResponse.json(
        { message: "address is required" },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          address: address,
          createdAt: { $gte: startOfDay },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $group: {
          _id: null,
          gamesWon: { $sum: { $cond: [{ $eq: ["$result", 1] }, 1, 0] } },
          results: { $push: "$result" },
        },
      },
      {
        $project: {
          _id: 0,
          gamesWon: 1,
          maxStreak: {
            $reduce: {
              input: "$results",
              initialValue: { currentStreak: 0, maxStreak: 0 },
              in: {
                currentStreak: {
                  $cond: [
                    { $eq: ["$$this", 1] },
                    { $add: ["$$value.currentStreak", 1] },
                    0,
                  ],
                },
                maxStreak: {
                  $max: [
                    "$$value.maxStreak",
                    {
                      $cond: [
                        { $eq: ["$$this", 1] },
                        { $add: ["$$value.currentStreak", 1] },
                        "$$value.maxStreak",
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          gamesWon: 1,
          maxStreak: "$maxStreak.maxStreak",
        },
      },
    ];
    console.log("first");
    const result = await collection.aggregate(pipeline).toArray();
    console.log(result[0]);
    return NextResponse.json({ data: result[0] }, { status: 200 });
  } catch (error) {
    console.error("Error processing game:", error);
    return NextResponse.json(
      { message: "Error processing game" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

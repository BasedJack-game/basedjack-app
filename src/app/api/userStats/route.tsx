import { NextRequest, NextResponse } from "next/server";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

let client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
async function getResponse(request: NextRequest): Promise<NextResponse> {
  const requestBody = (await request.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(requestBody);
  console.log(message);

  try {
    await client.connect();

    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

    const address = message?.raw.action.interactor.custody_address;
    console.log("custody address", address);

    if (!address) {
      return NextResponse.json(
        { message: "address is required" },
        { status: 400 }
      );
    }

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
                gameResults: { $push: "$result" },
              },
            },
            {
              $project: {
                _id: 0,
                totalGames: 1,
                gamesWon: 1,
                winRatio: { $divide: ["$gamesWon", "$totalGames"] },
                gameResults: 1,
              },
            },
          ],
          rankInfo: [
            {
              $group: {
                _id: "$address",
                gamesWon: { $sum: { $cond: [{ $eq: ["$result", 1] }, 1, 0] } },
              },
            },
            { $sort: { gamesWon: -1 } },
            {
              $group: {
                _id: null,
                addresses: { $push: "$_id" },
                gamesWon: { $push: "$gamesWon" },
              },
            },
            {
              $project: {
                rank: { $indexOfArray: ["$addresses", address] },
                totalPlayers: { $size: "$addresses" },
              },
            },
          ],
        },
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
              in: {
                totalGames: "$$userStats.totalGames",
                gamesWon: "$$userStats.gamesWon",
                winRatio: "$$userStats.winRatio",
                maxStreak: "$$maxStreak.maxStreak",
              },
            },
          },
          rank: { $add: [{ $arrayElemAt: ["$rankInfo.rank", 0] }, 1] },
          totalPlayers: { $arrayElemAt: ["$rankInfo.totalPlayers", 0] },
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    // return result[0];
    result[0].address = address;
    console.log(result);
    const userStatsImageURL = `${
      process.env.NEXT_PUBLIC_URL
    }/api/userStatsImage?stats=${encodeURIComponent(
      JSON.stringify(result[0])
    )}`;

    console.log(userStatsImageURL);

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Play ▶️",
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
          },
          {
            label: `Cast Game`,
            action: "link",
            target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://basedjack-next.vercel.app/`,
          },
        ],
        image: userStatsImageURL,
      })
    );
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

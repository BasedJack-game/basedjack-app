import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

// Function to create the image URL with JSON parameters
function createImageUrl(
  playerHand: number[],
  visibleDealerCard: number,
  playerScore: number,
  dealerScore: number,
  result: GameResult,
  today_game: number,
  today_streak: number
): string {
  const params = {
    p: playerHand, // playerCards
    d: [visibleDealerCard], // dealerCards (only the visible card)
    ps: playerScore, // playerScore
    ds: dealerScore, // dealerScore
    r: result, // result
    tg: today_game, // today_game
    ts: today_streak, // today_streak
  };

  const jsonParams = JSON.stringify(params);
  const base64Params = Buffer.from(jsonParams).toString("base64");

  return `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?params=${base64Params}`;
}

enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");

async function getResponse(request: NextRequest): Promise<NextResponse> {
  console.log("hit called");
  const requestBody = (await request.json()) as FrameRequest;
  try {
    const { isValid, message } = await getFrameMessage(requestBody);
    console.log(message);

    await client.connect(); // Ensure the client is connected

    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

    const address = message?.raw.action.interactor.custody_address;

    if (!address) {
      return NextResponse.json(
        { message: "address is required" },
        { status: 400 }
      );
    }

    const unfinishedGame = await collection.findOne({
      address,
      result: GameResult.Ongoing,
    });

    if (!unfinishedGame) {
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: "Play ▶️",
              target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
            },
          ],
          image: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
        })
      );
    }

    return await handleHit(address, unfinishedGame, collection);
  } catch (error) {
    console.error("Error processing hit action:", error);
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Play again ▶️",
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
          },
        ],
        image: `${process.env.NEXT_PUBLIC_URL}/api/getGameData`,
      })
    );
  } finally {
    await client.close();
  }
}

async function getTodayGameData(address: string) {
  try {
    await client.connect();

    const db = client.db("blackjack_game");
    const collection = db.collection("gamedata");

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
    return result[0];
  } catch (error) {
    console.error("Error processing game:", error);
    return NextResponse.json(
      { message: "Error processing game" },
      { status: 500 }
    );
  }
}

const handleHit = async (address: string, game: any, collection: any) => {
  let deck = shuffleDeck();
  const usedCards = [...game.playerCards, ...game.dealerCards];
  deck = deck.filter((card) => !usedCards.includes(card));

  game.playerCards.push(deck.pop());

  const playerValue = evaluateHand(game.playerCards);

  let result: GameResult = GameResult.Ongoing;
  let today_game = 0;
  let today_streak = 0;
  console.log(playerValue);
  if (playerValue > 21) {
    result = GameResult.DealerWins;
    const today_data = await getTodayGameData(address);
    console.log("today's data ...............", today_data);
    const todayGameData = today_data as {
      gamesWon: number;
      maxStreak: number;
    };
    today_game = todayGameData.gamesWon;
    today_streak = todayGameData.maxStreak;
  }

  const updatedGame = {
    playerCards: game.playerCards,
    playerScore: playerValue,
    result: result,
  };

  await collection.updateOne({ _id: game._id }, { $set: updatedGame });

  const visibleDealerCard = game.dealerCards[0]; // Only use the first dealer card
  const visibleDealerScore = evaluateHand([visibleDealerCard]); // Evaluate score for visible card only

  const imageUrl = createImageUrl(
    updatedGame.playerCards,
    visibleDealerCard,
    playerValue,
    visibleDealerScore,
    result,
    today_game,
    today_streak
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons:
        result !== GameResult.Ongoing
          ? [
              {
                label: `Play again🔁`,
                action: "post",
                target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
              },
              {
                label: `Stats📊`,
                action: "post",
                target: `${process.env.NEXT_PUBLIC_URL}/api/userStats`,
              },
              {
                label: `Cast Game`,
                action: "link",
                target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://basedjack-next.vercel.app/`,
              },
              {
                label: `Share Result`,
                action: "link",
                target: `https://warpcast.com/~/compose?text=I+just+played+BasedJack!+Check+out+my+result+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=${encodeURIComponent(
                  `${
                    process.env.NEXT_PUBLIC_URL
                  }/shareCurrentGame?imageUrl=${encodeURIComponent(imageUrl)}`
                )}`,
              },
            ]
          : [
              {
                label: `Hit`,
                action: "post",
                target: `${process.env.NEXT_PUBLIC_URL}/api/hit`,
              },
              {
                label: `Stand`,
                action: "post",
                target: `${process.env.NEXT_PUBLIC_URL}/api/stand`,
              },
            ],
      image: imageUrl,
    })
  );
};

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

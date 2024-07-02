import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

function createImageUrl(
  playerHand: number[],
  dealerHand: number[],
  playerScore: number,
  dealerScore: number,
  result: GameResult,
  today_game: number,
  today_streak: number
): string {
  const params = {
    p: playerHand, // playerCards
    d: dealerHand, // dealerCards
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
  const requestBody = (await request.json()) as FrameRequest;
  try {
    const { isValid, message } = await getFrameMessage(requestBody);
    console.log(message);

    await client.connect();

    const db = client.db("blackjack_game");
    const gameCollection = db.collection("gamedata");

    const address = message?.raw.action.interactor.custody_address;
    console.log("custody address", address);

    if (!address) {
      return NextResponse.json(
        { message: "address is required" },
        { status: 400 }
      );
    }

    const unfinishedGame = await gameCollection.findOne({
      address,
      result: GameResult.Ongoing,
    });

    if (!unfinishedGame) {
      return NextResponse.json(
        { message: "No unfinished game found" },
        { status: 404 }
      );
    }

    return await finishGame(address, unfinishedGame, gameCollection);
  } catch (error) {
    console.error("Error processing game:", error);
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Play ▶️",
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

const finishGame = async (address: string, game: any, gameCollection: any) => {
  let deck = shuffleDeck();
  const usedCards = [...game.playerCards, ...game.dealerCards];
  deck = deck.filter((card) => !usedCards.includes(card));

  const playerScore = evaluateHand(game.playerCards);

  // Dealer plays
  while (
    evaluateHand(game.dealerCards) < 17 ||
    (evaluateHand(game.dealerCards) === 17 && isSoft17(game.dealerCards))
  ) {
    const newCard = deck.pop();
    if (newCard !== undefined) {
      game.dealerCards.push(newCard);
    }
  }

  const dealerScore = evaluateHand(game.dealerCards);

  // Determine the result
  let result: GameResult;
  if (dealerScore > 21) {
    result = GameResult.PlayerWins;
  } else if (dealerScore === playerScore) {
    result = GameResult.Tie;
  } else if (dealerScore > playerScore) {
    result = GameResult.DealerWins;
  } else {
    result = GameResult.PlayerWins;
  }

  const updatedGame = {
    dealerCards: game.dealerCards,
    playerScore,
    dealerScore,
    result,
  };

  await gameCollection.updateOne(
    { address: game.address, result: GameResult.Ongoing },
    { $set: updatedGame }
  );
  let today_game = 0;
  let today_streak = 0;
  const today_data = await getTodayGameData(address);
  console.log("today's data ...............", today_data);
  const todayGameData = today_data as {
    gamesWon: number;
    maxStreak: number;
  };
  today_game = todayGameData.gamesWon;
  today_streak = todayGameData.maxStreak;

  const imageUrl = createImageUrl(
    game.playerCards,
    game.dealerCards,
    playerScore,
    dealerScore,
    result,
    today_game,
    today_streak
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: `Play🔁`,
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
          label: `Result📩`,
          action: "link",
          target: `https://warpcast.com/~/compose?text=I+just+played+BasedJack!+Check+out+my+result+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=${encodeURIComponent(
            `${
              process.env.NEXT_PUBLIC_URL
            }/shareCurrentGame?imageUrl=${encodeURIComponent(imageUrl)}`
          )}`,
        },
      ],
      image: imageUrl,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
    })
  );
};

// Helper function to check for soft 17
function isSoft17(hand: number[]): boolean {
  const score = evaluateHand(hand);
  const hasAce = hand.some((card) => card === 1); // Assuming Ace is represented by 1
  return score === 17 && hasAce;
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

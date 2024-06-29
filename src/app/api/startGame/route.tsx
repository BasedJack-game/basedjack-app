import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

// Define the GameResult enum
enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

// Function to create the image URL with JSON parameters
function createImageUrl(
  playerHand: number[],
  dealerHand: number[],
  playerScore: number,
  dealerScore: number,
  result: GameResult
): string {
  const params = {
    playerCards: playerHand,
    dealerCards: dealerHand,
    playerScore,
    dealerScore,
    result,
  };

  const jsonParams = encodeURIComponent(JSON.stringify(params));
  return `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?params=${jsonParams}`;
}

const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");

async function getResponse(request: NextRequest): Promise<NextResponse> {
  const requestBody = (await request.json()) as FrameRequest;
  try {
    const { isValid, message } = await getFrameMessage(requestBody);
    console.log(message);

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

    const unfinishedGame = await collection.findOne({
      address,
      result: GameResult.Ongoing,
    });

    console.log("the mongo obj", unfinishedGame);

    if (unfinishedGame) {
      return await continueExistingGame(unfinishedGame);
    }

    return await startNewGame(address, collection);
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
            target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://blackjack-next.vercel.app/`,
          },
        ],
        image: `${process.env.NEXT_PUBLIC_URL}/api/getGameData`,
      })
    );
  } finally {
    await client.close();
  }
}

const startNewGame = async (address: string, collection: any) => {
  console.log("starting new game");
  const deck = shuffleDeck();
  const playerCards: number[] = [];
  const dealerCards: number[] = [];

  for (let i = 0; i < 2; i++) {
    const playerCard = deck.pop();
    const dealerCard = deck.pop();
    if (playerCard !== undefined) playerCards.push(playerCard);
    if (dealerCard !== undefined) dealerCards.push(dealerCard);
  }

  if (playerCards.length !== 2 || dealerCards.length !== 2) {
    throw new Error("Not enough cards in the deck");
  }

  const playerScore = evaluateHand(playerCards);
  const dealerScore = evaluateHand([dealerCards[0]]); // Only evaluate the first card for the dealer

  const newGame = {
    address,
    playerCards,
    dealerCards,
    playerScore,
    dealerScore,
    result: GameResult.Ongoing,
    createdAt: new Date(), // Add createdAt field
  };

  await collection.insertOne(newGame);

  return createGameResponse(
    playerCards,
    dealerCards,
    playerScore,
    dealerScore,
    GameResult.Ongoing
  );
};

const continueExistingGame = async (game: any) => {
  console.log("continuing the game:::");
  return createGameResponse(
    game.playerCards,
    game.dealerCards,
    game.playerScore,
    game.dealerScore,
    game.result
  );
};

const createGameResponse = (
  playerCards: number[],
  dealerCards: number[],
  playerScore: number,
  dealerScore: number,
  result: GameResult
) => {
  const imageUrl = createImageUrl(
    playerCards,
    [dealerCards[0]], // Only show the first dealer card
    playerScore,
    dealerScore,
    result
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
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

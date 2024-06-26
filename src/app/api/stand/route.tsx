import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

function createImageUrl(
  playerHand: number[],
  dealerHand: number[],
  playerScore: number,
  dealerScore: number
): string {
  const params = {
    playerCards: playerHand,
    dealerCards: dealerHand,
    playerScore,
    dealerScore,
  };

  const jsonParams = encodeURIComponent(JSON.stringify(params));
  return `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?params=${jsonParams}`;
}

const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");

async function getResponse(request: NextRequest): Promise<NextResponse> {
  const requestBody = (await request.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(requestBody);
  console.log(message);

  try {
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
      isFinished: false,
    });

    if (!unfinishedGame) {
      return NextResponse.json(
        { message: "No unfinished game found" },
        { status: 404 }
      );
    }

    return await finishGame(unfinishedGame, gameCollection);
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

const finishGame = async (game: any, gameCollection: any) => {
  let deck = shuffleDeck();
  const usedCards = [...game.playerCards, ...game.dealerCards];
  deck = deck.filter((card) => !usedCards.includes(card));

  const playerScore = evaluateHand(game.playerCards);

  // Dealer hits until 17 or higher
  while (evaluateHand(game.dealerCards) < 17) {
    const newCard = deck.pop();
    if (newCard !== undefined) game.dealerCards.push(newCard);
  }

  const dealerScore = evaluateHand(game.dealerCards);
  console.log("dealer score", dealerScore);
  console.log("player score", playerScore);

  let result;
  if (dealerScore > 21) {
    result = "Player Wins! Dealer Busted";
  } else if (dealerScore > playerScore) {
    result = "Dealer Wins";
  } else if (dealerScore < playerScore) {
    result = "Player Wins";
  } else {
    result = "It's a Tie";
  }

  const updatedGame = {
    dealerCards: game.dealerCards,
    playerScore,
    dealerScore,
    isFinished: true,
    result,
  };

  await gameCollection.updateOne(
    { address: game.address, isFinished: false },
    { $set: updatedGame }
  );

  const imageUrl = createImageUrl(
    game.playerCards,
    game.dealerCards,
    playerScore,
    dealerScore
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: `Play Again`,
          action: "post",
          target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
        },
      ],
      image: imageUrl,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
    })
  );
};

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

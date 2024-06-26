import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

// Function to create the image URL with JSON parameters
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
  console.log("hit called");
  const requestBody = (await request.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(requestBody);
  console.log(message);

  try {
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
      isFinished: false,
    });

    if (!unfinishedGame) {
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: "Game Over",
              target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
            },
          ],

          image: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
        })
      );
    }

    return await handleHit(address, unfinishedGame, collection);
  } catch (error) {
    console.error("Error processing hit action:", error);
    return NextResponse.json(
      { message: "Error processing hit action" },
      { status: 500 }
    );
  } finally {
    await client.close(); // Ensure the client is closed
  }
}

const handleHit = async (address: string, game: any, collection: any) => {
  let deck = shuffleDeck();
  const usedCards = [...game.playerCards, ...game.dealerCards];
  deck = deck.filter((card) => !usedCards.includes(card));

  game.playerCards.push(deck.pop());

  const playerValue = evaluateHand(game.playerCards);

  let gameFinished = false;
  let isBusted = false;

  console.log(playerValue);
  if (playerValue > 21) {
    gameFinished = true;
    isBusted = true;
  }

  const updatedGame = {
    playerCards: game.playerCards,
    playerScore: playerValue,
    isFinished: gameFinished,
    isBusted: isBusted,
  };
  const update = await collection.updateOne(
    { _id: game._id },
    { $set: updatedGame }
  );

  const imageUrl = createImageUrl(
    updatedGame.playerCards,
    game.dealerCards,
    playerValue,
    game.dealerScore
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: gameFinished
        ? [{ label: "Game Over" }]
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

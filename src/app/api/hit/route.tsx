import { NextRequest, NextResponse } from "next/server";
import { findOneDocument, updateOneDocument } from "@/app/utils/mongodb";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
// import { ObjectId } from "mongodb";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";

// Function to create the image URL with JSON parameters
function createImageUrl(playerHand: number[], dealerHand: number[]): string {
  const params = {
    playerCards: playerHand,
    dealerCards: dealerHand,
  };

  const jsonParams = encodeURIComponent(JSON.stringify(params));
  return `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?params=${jsonParams}`;
}

async function getResponse(request: NextRequest): Promise<NextResponse> {
  const requestBody = (await request.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(requestBody);
  console.log(message);

  try {
    const address = message?.raw.action.interactor.custody_address;

    if (!address) {
      return NextResponse.json(
        { message: "address is required" },
        { status: 400 }
      );
    }

    const unfinishedGame = await findOneDocument("gamedata", {
      address,
      isFinished: false,
    });

    if (!unfinishedGame) {
      // redirect to new game
      return NextResponse.json(
        { message: "No unfinished game found" },
        { status: 404 }
      );
    }

    return await handleHit(address, unfinishedGame);
  } catch (error) {
    console.error("Error processing hit action:", error);
    return NextResponse.json(
      { message: "Error processing hit action" },
      { status: 500 }
    );
  }
}

const handleHit = async (address: string, game: any) => {
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

  await updateOneDocument("gamedata", { _id: game._id }, { $set: updatedGame });

  const imageUrl = createImageUrl(updatedGame.playerCards, game.dealerCards);

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
              target: `${process.env.NEXT_PUBLIC_URL}/api/hit`,
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

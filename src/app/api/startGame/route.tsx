import { NextRequest, NextResponse } from "next/server";
import {
  findOneDocument,
  insertOneDocument,
  updateOneDocument,
} from "@/app/utils/mongodb";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { GameState } from "@/app/types/store";
import { ObjectId } from "mongodb";
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
  console.log("okay");
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
    return await handleGame(address);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

const handleGame = async (address: string) => {
  const unfinishedGame = await findOneDocument("gamedata", {
    address,
    isFinished: false,
  });

  if (unfinishedGame) {
    const imageUrl = createImageUrl(
      unfinishedGame.playerCards,
      unfinishedGame.dealerCards
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
            target: `${process.env.NEXT_PUBLIC_URL}/api/hit`,
          },
        ],
        image: imageUrl,
      })
    );
  } else {
    const gameState = startNewGame();
    const gameDocument = createGameDocument(gameState, address);
    const gameResult = await insertOneDocument("gamedata", gameDocument);

    if (!gameResult.insertedId) {
      throw new Error("Failed to insert game document");
    }

    const imageUrl = createImageUrl(
      gameDocument.playerCards,
      gameDocument.dealerCards
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
  }
};

const startNewGame = (): GameState => {
  const deck = shuffleDeck();
  const playerHand = [];
  const dealerHand = [];

  if (deck.length >= 4) {
    playerHand.push(deck.pop()!, deck.pop()!);
    dealerHand.push(deck.pop()!, deck.pop()!);
  }

  return {
    playerHand,
    dealerHand,
  };
};

const createGameDocument = (gameState: GameState, address: string) => {
  return {
    address,
    playerCards: gameState.playerHand,
    dealerCards: gameState.dealerHand,
    playerScore: evaluateHand(gameState.playerHand),
    dealerScore: evaluateHand(gameState.dealerHand),
    isFinished: false,
    isBusted: false,
    createdAt: new Date(),
  };
};

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

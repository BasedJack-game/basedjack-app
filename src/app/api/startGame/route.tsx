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

    const existingUser = await findOneDocument("usersdata", {
      address: address,
    });

    if (!existingUser) {
      return await handleNewUser(address, message);
    } else {
      return await handleExistingUser(address, existingUser, message);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

const handleNewUser = async (address: string, message: any) => {
  const gameState = startNewGame();
  const gameDocument = createGameDocument(gameState, address);
  const gameResult = await insertOneDocument("gamedata", gameDocument);

  const userDocument = {
    address,
    games: [gameResult.insertedId],
  };
  const userResult = await insertOneDocument("usersdata", userDocument);

  const imageUrl = createImageUrl(
    gameDocument.playerCards,
    gameDocument.dealerCards
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: `${message?.raw.action.interactor.custody_address}`,
        },
      ],
      image: imageUrl,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
    })
  );
};

const handleExistingUser = async (
  address: string,
  existingUser: any,
  message: any
) => {
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
            label: `${message?.raw.action.interactor.custody_address}`,
          },
        ],
        image: imageUrl,
        postUrl: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
      })
    );
  } else {
    const gameState = startNewGame();
    const gameDocument = createGameDocument(gameState, address);
    const gameResult = await insertOneDocument("gamedata", gameDocument);

    await updateOneDocument(
      "usersdata",
      { _id: new ObjectId(existingUser._id) },
      { $push: { games: gameResult.insertedId } }
    );

    const imageUrl = createImageUrl(
      gameDocument.playerCards,
      gameDocument.dealerCards
    );

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: `${message?.raw.action.interactor.custody_address}`,
          },
        ],
        image: imageUrl,
        postUrl: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
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

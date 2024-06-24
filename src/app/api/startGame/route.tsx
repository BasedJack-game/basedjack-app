import { NextRequest, NextResponse } from "next/server";
import {
  findOneDocument,
  insertOneDocument,
  updateOneDocument,
} from "@/app/utils/mongodb";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { GameState } from "@/app/types/store";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    const { address } = body;

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { message: "address and address are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findOneDocument("usersdata", {
      address: address,
    });

    if (!existingUser) {
      return await handleNewUser(address);
    } else {
      return await handleExistingUser(address, existingUser);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

const handleNewUser = async (address: string) => {
  // create a new game
  const gameState = startNewGame();
  const gameDocument = createGameDocument(gameState, address);
  const gameResult = await insertOneDocument("gamedata", gameDocument);

  // update usersdata
  const userDocument = {
    address,
    games: [gameResult.insertedId],
  };
  const userResult = await insertOneDocument("usersdata", userDocument);

  return NextResponse.json(
    {
      message: "User and game created successfully",
      userId: userResult.insertedId,
      gameId: gameResult.insertedId,
      gameState: gameDocument,
    },
    { status: 201 }
  );
};

const handleExistingUser = async (address: string, existingUser: any) => {
  // check for unfinished game
  const unfinishedGame = await findOneDocument("gamedata", {
    address,
    isFinished: false,
  });

  if (unfinishedGame) {
    return NextResponse.json(
      {
        message: "Unfinished game found",
        userId: existingUser._id,
        gameId: unfinishedGame._id,
        gameState: unfinishedGame,
      },
      { status: 200 }
    );
  } else {
    // create a new game
    const gameState = startNewGame();
    const gameDocument = createGameDocument(gameState, address);
    const gameResult = await insertOneDocument("gamedata", gameDocument);
    console.log("Inserted new game document:", gameResult);

    // update usersdata
    await updateOneDocument(
      "usersdata",
      { _id: new ObjectId(existingUser._id) },
      { $push: { games: gameResult.insertedId } }
    );

    return NextResponse.json(
      {
        message: "New game created for existing user",
        userId: existingUser._id,
        gameId: gameResult.insertedId,
        gameState: gameDocument,
      },
      { status: 200 }
    );
  }
};

const startNewGame = (): GameState => {
  const deck = shuffleDeck();
  const playerHand = [];
  const dealerHand = [];

  if (deck.length >= 4) {
    playerHand.push(deck.pop()!, deck.pop()!); // Deal two cards to player
    dealerHand.push(deck.pop()!, deck.pop()!); // Deal two cards to dealer
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

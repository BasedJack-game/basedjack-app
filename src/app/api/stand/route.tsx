import { NextRequest, NextResponse } from "next/server";
import { evaluateHand, shuffleDeck } from "@/app/utils/utils";
import { findOneDocument, updateOneDocument } from "@/app/utils/mongodb";
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

    // check for unfinished game
    const unfinishedGame = await findOneDocument("gamedata", {
      address,
      isFinished: false,
    });

    if (!unfinishedGame) {
      return NextResponse.json(
        { message: "No unfinished game found" },
        { status: 404 }
      );
    }

    let deck = shuffleDeck();
    const usedCards = [
      ...unfinishedGame.playerCards,
      ...unfinishedGame.dealerCards,
    ];
    deck = deck.filter((card) => !usedCards.includes(card));

    while (evaluateHand(unfinishedGame.dealerCards) < 17) {
      unfinishedGame.dealerCards.push(deck.pop());
    }

    // Evaluate the final hands
    const playerValue = evaluateHand(unfinishedGame.playerCards);
    const dealerValue = evaluateHand(unfinishedGame.dealerCards);

    // Update the game document
    const updatedGame = {
      dealerCards: unfinishedGame.dealerCards,
      playerScore: playerValue,
      dealerScore: dealerValue,
      isFinished: true,
      isBusted: !(
        playerValue <= 21 &&
        (playerValue > dealerValue || dealerValue > 21)
      ),
    };

    await updateOneDocument(
      "gamedata",
      { _id: new ObjectId(unfinishedGame._id) },
      { $set: updatedGame }
    );

    const user = await findOneDocument("usersdata", { address });
    if (user) {
      const updates = {
        totalGames: (user.totalGames || 0) + 1,
        totalWins: user.totalWins || 0,
      };

      playerValue <= 21 && (playerValue > dealerValue || dealerValue > 21)
        ? (updates.totalWins += 1)
        : updates.totalWins;

      await updateOneDocument(
        "usersdata",
        { _id: new ObjectId(user._id) },
        { $set: updates }
      );
    }

    return NextResponse.json(
      {
        message: "Game Finished",
        gameState: updatedGame,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
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

    if (unfinishedGame) {
      let deck = shuffleDeck();
      const usedCards = [
        ...unfinishedGame.playerCards,
        ...unfinishedGame.dealerCards,
      ];
      deck = deck.filter((card) => !usedCards.includes(card));

      unfinishedGame.playerCards.push(deck.pop());

      // Evaluate the final hands
      const playerValue = evaluateHand(unfinishedGame.playerCards);

      if (playerValue > 21) {
        // Update the game document
        const updatedGame = {
          playerCards: unfinishedGame.playerCards,
          playerScore: playerValue,
          isFinished: true,
          isBusted: true,
        };

        await updateOneDocument(
          "gamedata",
          { _id: new ObjectId(unfinishedGame._id) },
          { $set: updatedGame }
        );

        // get user data
        const user = await findOneDocument("usersdata", { address });

        if (user) {
          const updates = {
            totalGames: (user.totalGames || 0) + 1,
          };

          // update user data
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
      } else {
        // update game data
        const updatedGame = {
          playerCards: unfinishedGame.playerCards,
          playerScore: playerValue,
        };

        await updateOneDocument(
          "gamedata",
          { _id: new ObjectId(unfinishedGame._id) },
          { $set: updatedGame }
        );
        return NextResponse.json(
          {
            message: "Game Finished",
            gameState: updatedGame,
          },
          { status: 200 }
        );
      }
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

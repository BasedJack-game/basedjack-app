import { NextRequest, NextResponse } from "next/server";
import { findOneDocument, updateOneDocument } from "@/app/utils/mongodb";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
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

  await updateOneDocument(
    "gamedata",
    { _id: new ObjectId(game._id) },
    { $set: updatedGame }
  );

  if (gameFinished) {
    await updateUserStats(address);
  }

  const imageUrl = createImageUrl(updatedGame.playerCards, game.dealerCards);

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: gameFinished
        ? [{ label: "Game Over" }]
        : [{ label: "Hit" }, { label: "Stand" }],
      image: imageUrl,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/api/game`,
    })
  );
};

const updateUserStats = async (address: string) => {
  const user = await findOneDocument("usersdata", { address });

  if (user) {
    const updates = {
      totalGames: (user.totalGames || 0) + 1,
    };

    await updateOneDocument(
      "usersdata",
      { _id: new ObjectId(user._id) },
      { $set: updates }
    );
  }
};

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

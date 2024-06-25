import { NextRequest, NextResponse } from "next/server";
import { insertOneDocument, findOneDocument } from "@/app/utils/mongodb";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";

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

    if (unfinishedGame) {
      return await continueExistingGame(unfinishedGame);
    }

    return await startNewGame(address);
  } catch (error) {
    console.error("Error processing game:", error);
    return NextResponse.json(
      { message: "Error processing game" },
      { status: 500 }
    );
  }
}

const startNewGame = async (address: string) => {
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
    isFinished: false,
    isBusted: false,
  };

  await insertOneDocument("gamedata", newGame);

  return createGameResponse(playerCards, dealerCards, playerScore, dealerScore);
};

const continueExistingGame = async (game: any) => {
  return createGameResponse(
    game.playerCards,
    game.dealerCards,
    game.playerScore,
    game.dealerScore
  );
};

const createGameResponse = (
  playerCards: number[],
  dealerCards: number[],
  playerScore: number,
  dealerScore: number
) => {
  const imageUrl = createImageUrl(
    playerCards,
    [dealerCards[0]], // Only show the first dealer card
    playerScore,
    dealerScore
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

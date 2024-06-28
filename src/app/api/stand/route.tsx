import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

function createImageUrl(
  playerHand: number[],
  dealerHand: number[],
  playerScore: number,
  dealerScore: number,
  result: GameResult
): string {
  const params = {
    playerCards: playerHand,
    dealerCards: dealerHand,
    playerScore,
    dealerScore,
    result,
  };

  const jsonParams = encodeURIComponent(JSON.stringify(params));
  return `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?params=${jsonParams}`;
}

enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");

async function getResponse(request: NextRequest): Promise<NextResponse> {
  const requestBody = (await request.json()) as FrameRequest;
  try {
    const { isValid, message } = await getFrameMessage(requestBody);
    console.log(message);

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
      result: GameResult.Ongoing,
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
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Start game🃏",
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
          },
          {
            label: `Your stats📊`,
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/userStats`,
          },
          {
            label: `Share Game`,
            action: "link",
            target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://blackjack-next.vercel.app/`,
          },
        ],
        image: `${process.env.NEXT_PUBLIC_URL}/api/getGameData`,
      })
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

  // Dealer plays
  while (
    evaluateHand(game.dealerCards) < 17 ||
    (evaluateHand(game.dealerCards) === 17 && isSoft17(game.dealerCards))
  ) {
    const newCard = deck.pop();
    if (newCard !== undefined) {
      game.dealerCards.push(newCard);
    }
  }

  const dealerScore = evaluateHand(game.dealerCards);

  // Determine the result
  let result: GameResult;
  if (dealerScore > 21) {
    result = GameResult.PlayerWins;
  } else if (dealerScore === playerScore) {
    result = GameResult.Tie;
  } else if (dealerScore > playerScore) {
    result = GameResult.DealerWins;
  } else {
    result = GameResult.PlayerWins;
  }

  const updatedGame = {
    dealerCards: game.dealerCards,
    playerScore,
    dealerScore,
    result,
  };

  await gameCollection.updateOne(
    { address: game.address, result: GameResult.Ongoing },
    { $set: updatedGame }
  );

  const imageUrl = createImageUrl(
    game.playerCards,
    game.dealerCards,
    playerScore,
    dealerScore,
    result
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: `Play Again🔁`,
          action: "post",
          target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
        },
        {
          label: `Your stats📊`,
          action: "post",
          target: `${process.env.NEXT_PUBLIC_URL}/api/userStats`,
        },
        {
          label: `Share Game`,
          action: "link",
          target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://blackjack-next.vercel.app/`,
        },
      ],
      image: imageUrl,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
    })
  );
};

// Helper function to check for soft 17
function isSoft17(hand: number[]): boolean {
  const score = evaluateHand(hand);
  const hasAce = hand.some((card) => card === 1); // Assuming Ace is represented by 1
  return score === 17 && hasAce;
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";

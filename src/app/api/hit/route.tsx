import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck, evaluateHand } from "@/app/utils/utils";
import { FrameRequest, getFrameMessage } from "@coinbase/onchainkit/frame";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { MongoClient } from "mongodb";

// Function to create the image URL with JSON parameters
function createImageUrl(
  playerHand: number[],
  visibleDealerCard: number,
  playerScore: number,
  dealerScore: number,
  result: GameResult
): string {
  const params = {
    playerCards: playerHand,
    dealerCards: [visibleDealerCard], // Only pass the visible dealer card
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
      result: GameResult.Ongoing,
    });

    if (!unfinishedGame) {
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: "Start Game",
              target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
            },
          ],
          image: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
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

  let result: GameResult = GameResult.Ongoing;

  console.log(playerValue);
  if (playerValue > 21) {
    result = GameResult.DealerWins;
  }

  const updatedGame = {
    playerCards: game.playerCards,
    playerScore: playerValue,
    result: result,
  };

  await collection.updateOne({ _id: game._id }, { $set: updatedGame });

  const visibleDealerCard = game.dealerCards[0]; // Only use the first dealer card
  const visibleDealerScore = evaluateHand([visibleDealerCard]); // Evaluate score for visible card only

  const imageUrl = createImageUrl(
    updatedGame.playerCards,
    visibleDealerCard,
    playerValue,
    visibleDealerScore,
    result
  );

  return new NextResponse(
    getFrameHtmlResponse({
      buttons:
        result !== GameResult.Ongoing
          ? [
              {
                label: `Play again🔁`,
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
            ]
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

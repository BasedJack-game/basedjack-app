import { NextRequest, NextResponse } from "next/server";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";

export async function POST(request: NextRequest) {
  try {
    // const baseUrl = process.env.NEXT_PUBLIC_URL;
    // const backgroundImage = `${baseUrl}/background.jpg`;

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Play ▶️",
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
          },
          {
            label: `Stats📊`,
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/userStats`,
          },
          {
            label: `Cast Game`,
            action: "link",
            target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://blackjack-next.vercel.app/`,
          },
        ],
        image: `${process.env.NEXT_PUBLIC_URL}/rules.png`,
      })
    );
  } catch (error: any) {
    console.error("Error generating frame response:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Error generating frame response",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const dynamic = "force-dynamic";

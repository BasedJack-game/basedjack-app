import { NextRequest, NextResponse } from "next/server";
import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";

export async function POST(req: NextRequest): Promise<Response> {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");

  if (!imageUrl) {
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: "Back to Game",
            action: "post",
            target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
          },
        ],
        image: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
      })
    );
  }

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: "Play ▶️",
          action: "post",
          target: `${process.env.NEXT_PUBLIC_URL}/api/startGame}`,
        },
      ],
      image: imageUrl,
    })
  );
}

export const dynamic = "force-dynamic";

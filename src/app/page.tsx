import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const name = "Blackjack";

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "Start game",
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
    post_url: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
  });

  return {
    title: name,
    description: "Classic Blackjack game on Farcaster",
    openGraph: {
      title: name,
      description: "Classic Blackjack game on Farcaster",
      images: [`${process.env.NEXT_PUBLIC_URL}/public.jpg`],
    },
    other: {
      ...frameMetadata,
      "fc:frame:image:aspect_ratio": "1.91:1",
    },
  };
}

function page() {
  return (
    <div>
      Paste this link on your warpcast and Cast it to play the classic
      BlackJack!
    </div>
  );
}

export default page;

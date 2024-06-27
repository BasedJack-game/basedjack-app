import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const name = "Blackjack";

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "Start game",
        action: "post",
        target: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
      },
      {
        label: `Share Game`,
        action: "link",
        target: `https://warpcast.com/~/compose?text=%F0%9F%8E%89%F0%9F%94%A5+Check+out+this+Nounish+BasedJack+game%2C+a+classic+blackjack+game+on+Farcaster+Frames!+Developed+during+the+On+Chain+Summer+Hackathon+by+Base.+%23based+%23nounish+%23blackjack+%23basedJack+%F0%9F%83%8F%E2%9C%A8&embeds%5B%5D=https://blackjack-next.vercel.app/`,
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
    // post_url: `${process.env.NEXT_PUBLIC_URL}/api/startGame`,
  });

  return {
    title: name,
    description: "Classic Blackjack game on Farcaster",
    openGraph: {
      title: name,
      description: "Classic Blackjack game on Farcaster",
      images: [`${process.env.NEXT_PUBLIC_URL}/download.jpg`],
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

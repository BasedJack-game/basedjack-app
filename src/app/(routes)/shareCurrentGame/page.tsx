import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata } from "next";

type Props = {
  searchParams: { imageUrl: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const name = "Blackjack Result";
  const imageUrl =
    searchParams.imageUrl || `${process.env.NEXT_PUBLIC_URL}/api/getGameData`;

  const frameMetadata = getFrameMetadata({
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
    image: imageUrl,
  });

  return {
    title: name,
    description: "Check out my Blackjack game result!",
    openGraph: {
      title: name,
      description: "Check out my Blackjack game result!",
      images: [imageUrl],
    },
    other: {
      ...frameMetadata,
      "fc:frame:image:aspect_ratio": "1.91:1",
    },
  };
}

function Page({ searchParams }: Props) {
  return (
    <div>
      Paste this link on your warpcast and Cast it to share your Blackjack
      result!
    </div>
  );
}

export default Page;

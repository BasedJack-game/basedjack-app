import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata, ResolvingMetadata } from "next";
import {
  FrameRequest,
  getFrameMessage,
  getFrameHtmlResponse,
} from "@coinbase/onchainkit/frame";

export async function generateMetadata({
  params,
}: {
  params: { addressOrENSName: string };
}): Promise<Metadata> {
  const name = "Blackjack";

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "Start game",
        // action: "post",
        // target: `${process.env.NEXT_PUBLIC_URL}/startGameFrame`,
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
    post_url: `${process.env.NEXT_PUBLIC_URL}/api/start`,
  });

  return {
    title: name,
    description: "Check if you're eligible for a free mint",
    openGraph: {
      title: name,
      description: "Check if you're eligible for a free mint",
      images: [`${process.env.NEXT_PUBLIC_URL}/public.jpg`],
    },
    other: {
      ...frameMetadata,
      "fc:frame:image:aspect_ratio": "1.91:1",
    },
  };
}

function page() {
  return <div>this is Home page</div>;
}

export default page;

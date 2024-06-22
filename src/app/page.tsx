import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { addressOrENSName: string };
}): Promise<Metadata> {
  const name = "Playground";

  const frameMetadata = getFrameMetadata({
    buttons: [
      // {
      //   label: "Check eligibility",
      // },
      {
        label: "Start game",
        action: "post",
        target: `https://app.chora.club/arbitrum/0xf4b0556b9b6f53e00a1fdd2b0478ce841991d8fa?active=info`,
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/public.jpg`,
    post_url: `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?username=0xdab`,
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

import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { addressOrENSName: string };
}): Promise<Metadata> {
  const name = "Playground";

  const address = params.addressOrENSName;

  const frameMetadata = getFrameMetadata({
    buttons: [
      // {
      //   label: "Check eligibility",
      // },
      {
        label: "play",
        // action: "post_url",
        target: `${process.env.NEXT_PUBLIC_URL}/leaderboard`,
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/public2.jpg`,
    post_url: `${process.env.NEXT_PUBLIC_URL}/leaderboard`,
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
  return <div>this is leaderboard page</div>;
}

export default page;

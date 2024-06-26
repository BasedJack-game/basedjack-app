import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { addressOrENSName: string };
}): Promise<Metadata> {
  const name = "DEMO TITLE";

  const address = params.addressOrENSName;

  const frameMetadata = getFrameMetadata({
    buttons: [
      // {
      //   label: "Check eligibility",
      // },
      {
        label: "Delegate",
        action: "post_redirect",
        target: `${process.env.NEXT_PUBLIC_URL}/playground`,
      },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?username=0xdab`,
    post_url: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
  });

  return {
    title: name,
    description: "Check if you're eligible for a free mint",
    openGraph: {
      title: name,
      description: "Check if you're eligible for a free mint",
      images: [`${process.env.NEXT_PUBLIC_URL}/download.jpg`],
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

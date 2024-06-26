import React from "react";
import { getFrameMetadata } from "@coinbase/onchainkit/core";
import { Metadata, ResolvingMetadata } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
        label: "Hit",
        // action: "post_url",
        target: `${process.env.NEXT_PUBLIC_URL}/leaderboard`,
      },
      {
        label: "stand 🤚",
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
      images: [`${process.env.NEXT_PUBLIC_URL}/download.jpg`],
    },
    other: {
      ...frameMetadata,
      "fc:frame:image:aspect_ratio": "1.91:1",
    },
  };
}

function page({ params }: { params: { username: string } }) {
  console.log("the param", params.username);
  return (
    <div>
      {params.username == "undefined" ? (
        <ConnectButton />
      ) : (
        <div>My address: {params.username}</div>
      )}
    </div>
  );
}

export default page;

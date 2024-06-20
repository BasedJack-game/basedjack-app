import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Page({ params }: { params: { address: string } }) {
  return (
    <div>
      {params.address === "undefined" ? (
        <ConnectButton />
      ) : (
        <div>My Post: {params.address}</div>
      )}
    </div>
  );
}

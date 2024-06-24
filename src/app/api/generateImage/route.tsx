import { NextRequest } from "next/server";
import { createCanvas } from "canvas";

const suits = ["♠", "♥", "♦", "♣"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

interface Card {
  value: string;
  suit: string;
}

function mapNumberToCard(num: number): Card {
  if (num < 1 || num > 52) throw new Error("Invalid card number");
  const suitIndex = Math.floor((num - 1) / 13);
  const valueIndex = (num - 1) % 13;
  return {
    value: values[valueIndex],
    suit: suits[suitIndex],
  };
}

function cardValueToNumber(value: string): number {
  if (value === "A") return 11;
  if (["J", "Q", "K"].includes(value)) return 10;
  return parseInt(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchParams.get("params");

    if (!params) {
      return new Response(JSON.stringify({ message: "Params are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { playerCards, dealerCards } = JSON.parse(
      decodeURIComponent(params)
    ) as { playerCards: number[]; dealerCards: number[] };

    const playerHand: Card[] = playerCards.map(mapNumberToCard);
    const dealerHand: Card[] = dealerCards.map(mapNumberToCard);

    const playerSum = playerHand.reduce(
      (sum: number, card: Card) => sum + cardValueToNumber(card.value),
      0
    );
    const dealerSum = dealerHand.reduce(
      (sum: number, card: Card) => sum + cardValueToNumber(card.value),
      0
    );

    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext("2d");

    // Set background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1200, 630);

    // Set text properties
    ctx.font = "32px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    // Draw player's hand
    ctx.fillText(
      `Player: ${playerHand
        .map((card: Card) => `${card.value}${card.suit}`)
        .join(", ")} - Total: ${playerSum}`,
      600,
      280
    );

    // Draw dealer's hand
    ctx.fillText(
      `Dealer: ${dealerHand
        .map((card: Card) => `${card.value}${card.suit}`)
        .join(", ")} - Total: ${dealerSum}`,
      600,
      350
    );

    const buffer = canvas.toBuffer("image/png");

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(JSON.stringify({ message: "Error generating image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = {
  runtime: "edge",
};

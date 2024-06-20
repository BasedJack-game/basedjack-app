import { NextRequest, NextResponse } from "next/server";
import { shuffleDeck } from "../../../utils"; // Adjust the path based on your project structure

import { GameState, Card } from "../../../types/start";

console.log("first");
let gameState: GameState = {} as GameState;

export function GET() {
  gameState = {
    playerHand: [],
    dealerHand: [],
    bet: 0,
    state: "ongoing",
    deck: shuffleDeck(),
  };
  gameState.playerHand.push(dealCard(gameState.deck));
  gameState.playerHand.push(dealCard(gameState.deck));
  gameState.dealerHand.push(dealCard(gameState.deck));
  gameState.dealerHand.push(dealCard(gameState.deck));
  return NextResponse.json(gameState, { status: 200 });
}

const dealCard = (deck: Card[]): Card => {
  return deck.pop() as Card;
};

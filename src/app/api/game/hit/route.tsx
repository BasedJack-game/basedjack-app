import { NextResponse } from "next/server";
import { GameState, Card } from "../../../types/start";

let gameState: GameState = {} as GameState;

export const GET = () => {
  gameState.playerHand.push(dealCard(gameState.deck));
  if (evaluateHand(gameState.playerHand) > 21) {
    gameState.state = "player_busted";
  }
  return NextResponse.json(gameState, { status: 200 });
};

const dealCard = (deck: Card[]): Card => {
  return deck.pop() as Card;
};

const evaluateHand = (hand: Card[]): number => {
  let value = 0;
  let aces = 0;

  for (let card of hand) {
    if (card.value === "A") {
      aces += 1;
      value += 11;
    } else if (["K", "Q", "J"].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
};

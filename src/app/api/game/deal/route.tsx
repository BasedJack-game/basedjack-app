import { NextResponse } from "next/server";
import { GameState, Card } from "../../../types/start";

let gameState: GameState = {} as GameState;

export const GET = () => {
  return NextResponse.json(gameState, { status: 200 });
};

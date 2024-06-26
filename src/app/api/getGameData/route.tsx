import { NextResponse } from "next/server";
import { getTopPlayers } from "@/app/utils/mongodb";

export async function GET(): Promise<Response> {
  try {
    const topPlayers = await getTopPlayers();
    return NextResponse.json({ message: topPlayers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching top players:", error);
    return NextResponse.json(
      { error: "Unable to fetch top players" },
      { status: 500 }
    );
  }
}

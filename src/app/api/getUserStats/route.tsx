import { NextResponse } from "next/server";
import { getUserStats } from "@/app/utils/mongodb";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const userStats = await getUserStats(address);
    return NextResponse.json({ data: userStats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Unable to fetch user stats" },
      { status: 500 }
    );
  }
}

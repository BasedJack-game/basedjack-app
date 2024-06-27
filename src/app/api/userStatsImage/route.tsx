import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const encodedStats = searchParams.get("stats");

    if (!encodedStats) {
      return NextResponse.json(
        { error: "Stats are required" },
        { status: 400 }
      );
    }

    const userStats = JSON.parse(decodeURIComponent(encodedStats));
    console.log("Decoded user stats:", userStats);

    const width = 1980;
    const height = 1048;

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            backgroundImage: `url(${process.env.NEXT_PUBLIC_URL}/playground.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              padding: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "72px",
                fontWeight: "bold",
                marginBottom: "40px",
                color: "white",
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
              }}
            >
              User Stats
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex" }}>
                Total Games: {userStats.stats.totalGames}
              </div>
              <div style={{ display: "flex" }}>
                Games Won: {userStats.stats.gamesWon}
              </div>
              <div style={{ display: "flex" }}>
                Win Ratio: {(userStats.stats.winRatio * 100).toFixed(2)}%
              </div>
              <div style={{ display: "flex" }}>
                Max Streak: {userStats.stats.maxStreak}
              </div>
              <div style={{ display: "flex" }}>
                Rank: {userStats.rank} / {userStats.totalPlayers}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: width,
        height: height,
      }
    );

    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error generating user stats image:", error);
    return NextResponse.json(
      {
        message: "Error generating user stats image",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const runtime = "edge";

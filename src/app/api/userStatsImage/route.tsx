/* eslint-disable @next/next/no-img-element */
import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const background = `${baseUrl}/stats_bg.png`;

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
            position: "relative",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={background} alt="Background Image" />
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              display: "flex",
            }}
          >
            <div style={{ display: "flex" }}>
              <h1
                style={{
                  color: "white",
                  fontFamily: "Fletfex",
                  position: "absolute",
                  top: 295,
                  left: 472,
                  fontSize: "3rem",
                  fontWeight: "900", // Maximum boldness
                  textShadow: "0px 0px 8px rgba(252,255,85,0.5)", // Glow effect
                }}
              >
                #{userStats.rank}
              </h1>
              <h1
                style={{
                  color: "#FCFF55",
                  fontFamily: "Fletfex",
                  position: "absolute",
                  top: 315,
                  left: 850,
                  letterSpacing: "1px",
                  fontSize: "3rem",
                  fontWeight: "900", // Maximum boldness
                  textShadow: "0px 0px 8px rgba(252,255,85,0.5)", // Glow effect
                }}
              >
                {userStats.address.substring(0, 5)}...
                {userStats.address.substring(userStats.address.length - 4)}
              </h1>
            </div>
            <div
              style={{
                display: "flex",
                width: "60%",
                alignItems: "center",
                margin: "0 auto",
                justifyContent: "space-around",
                position: "relative",
              }}
            >
              <h1
                style={{
                  color: "#FCFF55",
                  fontFamily: "Fletfex, Arial, sans-serif",
                  position: "relative",
                  top: 190,
                  left: 25,
                  fontSize: "3rem", // Increased from 2.3rem
                  letterSpacing: "1px",
                  minWidth: "11%",
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                  fontWeight: "900", // Maximum boldness
                  textShadow: "0px 0px 8px rgba(252,255,85,0.5)", // Glow effect
                }}
              >
                {userStats.stats.totalGames}
              </h1>
              <h1
                style={{
                  color: "#FCFF55",
                  fontFamily: "Fletfex",
                  fontSize: "3rem",
                  letterSpacing: "1px",
                  position: "relative",
                  top: 190,
                  left: 50,
                  minWidth: "11%",
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                  fontWeight: "900", // Maximum boldness
                  textShadow: "0px 0px 8px rgba(252,255,85,0.5)", // Glow effect
                }}
              >
                {(userStats.stats.winRatio * 100).toFixed(1)}%
              </h1>
              <h1
                style={{
                  color: "#FCFF55",
                  fontFamily: "Fletfex",
                  fontSize: "3rem",
                  letterSpacing: "1px",
                  position: "relative",
                  top: 190,
                  left: 55,
                  minWidth: "11%",
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                  //   fontWeight: "bold",
                  fontWeight: "900", // Maximum boldness
                  textShadow: "0px 0px 8px rgba(252,255,85,0.5)", // Glow effect
                }}
              >
                {userStats.stats.maxStreak}
              </h1>
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

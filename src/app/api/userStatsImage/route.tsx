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
        // <div
        //   style={{
        //     display: "flex",
        //     flexDirection: "column",
        //     alignItems: "center",
        //     justifyContent: "center",
        //     height: "100%",
        //     width: "100%",
        //     backgroundImage: `url(${process.env.NEXT_PUBLIC_URL}/stats_bg.png)`,
        //     backgroundSize: "cover",
        //     backgroundPosition: "center",
        //     position: "relative",
        //   }}
        // >
        //   <div
        //     style={{
        //       position: "absolute",
        //       top: 0,
        //       left: 0,
        //       width: "100%",
        //       height: "100%",
        //       backgroundColor: "rgba(0, 0, 0, 0.6)",
        //     }}
        //   ></div>
        //   <div
        //     style={{
        //       display: "flex",
        //       flexDirection: "column",
        //       alignItems: "center",
        //       justifyContent: "center",
        //       zIndex: 1,
        //       padding: "40px",
        //     }}
        //   >
        //     <div
        //       style={{
        //         display: "flex",
        //         flexDirection: "column",
        //         alignItems: "center",
        //         justifyContent: "center",
        //         fontSize: "72px",
        //         fontWeight: "bold",
        //         marginBottom: "40px",
        //         color: "white",
        //         textAlign: "center",
        //         textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
        //       }}
        //     >
        //       User Stats
        //     </div>
        //     <div
        //       style={{
        //         display: "flex",
        //         flexDirection: "column",
        //         alignItems: "center",
        //         justifyContent: "center",
        //         fontSize: "48px",
        //         fontWeight: "bold",
        //         color: "white",
        //         textAlign: "center",
        //         textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
        //         gap: "20px",
        //       }}
        //     >
        //       <div style={{ display: "flex" }}>
        //         Total Games: {userStats.stats.totalGames}
        //       </div>
        //       <div style={{ display: "flex" }}>
        //         Games Won: {userStats.stats.gamesWon}
        //       </div>
        //       <div style={{ display: "flex" }}>
        //         Win Ratio: {(userStats.stats.winRatio * 100).toFixed(2)}%
        //       </div>
        //       <div style={{ display: "flex" }}>
        //         Max Streak: {userStats.stats.maxStreak}
        //       </div>
        //       <div style={{ display: "flex" }}>
        //         Rank: {userStats.rank} / {userStats.totalPlayers}
        //       </div>
        //     </div>
        //   </div>
        // </div>
        <div
          style={{
            position: "relative",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={background} // Replace with your image path in the public directory
            alt="Background Image"
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
            }}
          >
            <h1
              style={{
                color: "white",
                fontFamily: "Fletfex",
                marginTop: "335px",
                marginLeft: "450px",
                fontSize: "46px",
                fontWeight: "bold",
              }}
            >
              #{userStats.rank}
            </h1>
            <h1
              style={{
                color: "white",
                fontFamily: "Fletfex",
                marginTop: "335px",
                marginLeft: "400px",
                fontSize: "46px",
                fontWeight: "bold",
              }}
            >
              {userStats.address.substring(0, 5)}...
              {userStats.address.substring(userStats.address.length - 4)}
            </h1>

            <h1
              style={{
                color: "white",
                fontFamily: "Fletfex",
                marginTop: "690px",
                marginLeft: "-580px",
                fontWeight: "bold",
              }}
            >
              {userStats.stats.totalGames}
            </h1>
            <h1
              style={{
                color: "white",
                fontFamily: "Fletfex",
                marginTop: "690px",
                marginLeft: "360px",
                fontWeight: "bold",
              }}
            >
              {(userStats.stats.winRatio * 100).toFixed(2)}%
            </h1>
            <h1
              style={{
                color: "white",
                fontFamily: "Fletfex",
                marginTop: "690px",
                marginLeft: "330px",
                fontWeight: "bold",
              }}
            >
              {userStats.stats.maxStreak}
            </h1>
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

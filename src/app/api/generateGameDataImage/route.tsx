import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const background = `${baseUrl}/front_background.png`;

    // get parameters from the api url
    const { searchParams } = new URL(request.url);
    const encodedParams = searchParams.get("params");

    if (!encodedParams) {
      return new Response(JSON.stringify({ message: "Params are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const paramsData = JSON.parse(decodeURIComponent(encodedParams));

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
                marginTop: "380px",
                marginLeft: "180px",
              }}
            >
              {formatPlayerAddress(paramsData[1])}
            </h1>
            <h1
              style={{
                color: "white",
                fontFamily: "Arial, sans-serif",
                marginTop: "320px",
                marginLeft: "150px",
              }}
            >
              {formatPlayerAddress(paramsData[0])}
            </h1>
            <h1
              style={{
                color: "white",
                fontFamily: "Arial, sans-serif",
                marginTop: "400px",
                marginLeft: "130px",
              }}
            >
              {formatPlayerAddress(paramsData[2])}
            </h1>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    return new Response(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({
        message: "Error generating image",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
function formatPlayerAddress(player: string): string {
  return `${player.substring(0, 5)}...${player.substring(player.length - 4)}`;
}

export const runtime = "edge";

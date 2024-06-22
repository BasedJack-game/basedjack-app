import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { findOneDocument } from "@/app/utils/mongodb";
import {
  FrameRequest,
  FrameValidationData,
  getFrameMessage,
} from "@coinbase/onchainkit/frame";

const size = {
  width: 1200,
  height: 630,
};

export async function GET(request: NextRequest) {
  // Extract username from the request URL
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400 }
    );
  }

  // Fetch the document with the provided username
  const document = await findOneDocument("users", { username: username });
  console.log("Fetched document:", document);

  if (!document) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  console.log(`${username} score is ${document.score}`);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 50, fontWeight: 700 }}>{username}</div>
        <div style={{ fontSize: 48 }}>{document.score}</div>
      </div>
    ),
    size
  );
}

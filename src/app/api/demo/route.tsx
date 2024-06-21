// src/app/api/hello/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findOneDocument } from "@/app/utils/mongodb";

// GET request handler
export async function GET(request: NextRequest) {
  console.log("Received a GET request");

  try {
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

    return NextResponse.json({
      data: document,
    });
  } catch (error) {
    console.error("Error fetching data from database:", error);
    return NextResponse.json(
      { message: "Error fetching data" },
      { status: 500 }
    );
  }
}

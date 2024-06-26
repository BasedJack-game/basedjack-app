import { getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { NextRequest, NextResponse } from "next/server";
import {
  FrameRequest,
  FrameValidationData,
  getFrameMessage,
} from "@coinbase/onchainkit/frame";
import { findOneDocument } from "@/app/utils/mongodb";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const requestBody = (await req.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(requestBody);
  console.log(message);
  // Fetch the document with the provided username
  const document = await findOneDocument("users", {
    address: message?.raw.action.interactor.custody_address,
  });
  console.log("Fetched document:", document);

  if (!document) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  console.log(`${document.username} score is ${document.score}`);

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: `${message?.raw.action.interactor.custody_address}`,
        },
      ],
      image: `${process.env.NEXT_PUBLIC_URL}/api/generateImage/?username=${document.username}`,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/download.jpg`,
    })
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

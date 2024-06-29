/* eslint-disable @next/next/no-img-element */
import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";

const suits = ["spades", "hearts", "diamonds", "clubs"];
const values = [
  "a",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "j",
  "q",
  "k",
];

interface Card {
  value: string;
  suit: string;
}

function mapNumberToCard(num: number): Card {
  if (num < 1 || num > 52) throw new Error("Invalid card number");
  const suitIndex = Math.floor((num - 1) / 13);
  const valueIndex = (num - 1) % 13;
  console.log("cards", { value: values[valueIndex], suit: suits[suitIndex] });
  return { value: values[valueIndex], suit: suits[suitIndex] };
}

function getCardImageUrl(card: Card): string {
  return `${process.env.NEXT_PUBLIC_URL}/Cards/${card.value}_of_${card.suit}.png`;
}
function getBackImageUrl(): string {
  return `${process.env.NEXT_PUBLIC_URL}/Back.png`;
}

enum GameResult {
  Ongoing = 0,
  PlayerWins = 1,
  DealerWins = 2,
  Tie = 3,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchParams.get("params");

    // fonts
    const adrich = await fetch(
      new URL("/public/fonts/Aldrich-Regular.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const E1 = await fetch(
      new URL("/public/fonts/E1234.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const pixMid = await fetch(
      new URL("/public/fonts/PixelifySans-Medium.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    console.log(params);
    if (!params) {
      return new Response(JSON.stringify({ message: "Params are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      playerCards,
      dealerCards,
      playerScore,
      dealerScore,
      result,
      today_game,
      today_streak,
    } = JSON.parse(decodeURIComponent(params)) as {
      playerCards: number[];
      dealerCards: number[];
      playerScore: number;
      dealerScore: number;
      result: GameResult;
      today_game: number;
      today_streak: number;
    };
    console.log("today_game----------------------", today_game);
    console.log("today_streak--------------------", today_streak);
    const playerHand: Card[] = playerCards.map(mapNumberToCard);
    const dealerHand: Card[] = dealerCards.map(mapNumberToCard);
    const imgUrl = `${process.env.NEXT_PUBLIC_URL}/playground.png`;
    const stats = `${process.env.NEXT_PUBLIC_URL}/result.png`;

    const playerImages = playerHand.map((card) => getCardImageUrl(card));
    const dealerImages = dealerHand.map((card) => getCardImageUrl(card));

    let resultText = "";
    if (result === GameResult.PlayerWins) {
      resultText = "You win!";
    } else if (result === GameResult.DealerWins) {
      resultText = "Dealer wins!";
    } else if (result === GameResult.Tie) {
      resultText = "It's a tie!";
    }
    console.log("dealerImages", dealerImages);
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <img
            src={imgUrl}
            style={{
              position: "absolute",
              zIndex: -1,
            }}
            alt="background"
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              top: -118,
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              {dealerCards.map((cardNumber, index) => (
                <img
                  key={index}
                  src={
                    result === GameResult.Ongoing && index > 0
                      ? getBackImageUrl()
                      : getCardImageUrl(mapNumberToCard(cardNumber))
                  }
                  width={110}
                  height={160}
                  alt={`Dealer card ${index + 1}`}
                />
              ))}
              {result === GameResult.Ongoing && dealerCards.length === 1 && (
                <img
                  src={getBackImageUrl()}
                  width={110}
                  height={160}
                  alt="Dealer hidden card"
                />
              )}
            </div>
            <div
              style={{
                position: "relative",
                width: "200px",
                height: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  alignItems: "center",
                  textAlign: "center",
                  top: 43,
                  left: -4,
                }}
              >
                <div
                  style={{
                    fontSize: "1.7rem",
                    fontWeight: 700, // Bold

                    fontFamily: "Aldrich",
                    color: "white",
                    padding: "5px 10px",
                  }}
                >
                  Dealer
                </div>
                <div
                  style={{
                    backgroundColor: "black",
                    textAlign: "center",
                    color: "#FCFF55",
                    padding: "5px 20px",
                    fontSize: "1.4rem",
                    border: "none",
                    fontFamily: "E1",
                    display: "flex",
                    justifyContent: "center",
                    minWidth: "80px",
                    margin: "0 auto",
                    borderRadius: "8px",
                    letterSpacing: "1px",
                  }}
                >
                  {dealerScore.toString()}
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              top: 18,
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              {playerImages.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  width={110}
                  height={160}
                  alt={`Player card ${index + 1}`}
                />
              ))}
            </div>
            <div
              style={{
                position: "relative",
                width: "200px",
                height: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  alignItems: "center",
                  textAlign: "center",
                  top: 38,
                  left: -4,
                }}
              >
                <div
                  style={{
                    fontSize: "1.7rem",
                    fontFamily: "Aldrich",
                    color: "#461B66",
                    padding: "5px 10px",
                  }}
                >
                  Player
                </div>
                <div
                  style={{
                    background: "black",
                    color: "#FCFF55",
                    padding: "5px 20px",
                    fontSize: "1.4rem",
                    // border: "1px solid red",
                    fontFamily: "E1",
                    minWidth: "80px",
                    letterSpacing: "1px",
                    display: "flex",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                >
                  {playerScore.toString()}
                </div>
              </div>
            </div>
          </div>
          {resultText && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: -1,
              }}
            >
              <div
                style={{
                  fontSize: "5rem",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  fontFamily: "pixMid",
                  color: resultText.includes("win") ? "#FF0000" : "#F8DF2D",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {resultText}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "absolute",
                  height: "70vh",
                  right: "0",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "300px",
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "20px auto",
                  }}
                >
                  <img src={stats} alt="player" />
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.7rem",
                        textAlign: "left",
                        color: "white",
                        fontFamily: "Aldrich",
                        fontWeight: 700,
                        padding: "5px",
                      }}
                    >
                      {`Today's Winnings: ${today_game.toString()}`}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "300px",
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "20px auto",
                  }}
                >
                  <img src={stats} alt="player" />
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.7rem",
                        fontWeight: 700,
                        fontFamily: "Aldrich",
                        color: "white",
                        padding: "5px",
                      }}
                    >
                      {`Today's 
                        Streak: ${today_streak.toString()}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Aldrich",
            data: adrich,
            style: "normal",
          },
          {
            name: "E1",
            data: E1,
            style: "normal",
          },
          {
            name: "pixMid",
            data: pixMid,
            style: "normal",
          },
        ],
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

export const runtime = "edge";

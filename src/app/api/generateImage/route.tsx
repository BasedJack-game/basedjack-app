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
    const dealer = `${process.env.NEXT_PUBLIC_URL}/dealer.png`;
    const player = `${process.env.NEXT_PUBLIC_URL}/player.png`;
    const stats = `${process.env.NEXT_PUBLIC_URL}/stats.png`;

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
            backgroundColor: "#121212",
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
              marginBottom: "40px",
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
                  width={80}
                  height={120}
                  alt={`Dealer card ${index + 1}`}
                />
              ))}
              {result === GameResult.Ongoing && dealerCards.length === 1 && (
                <img
                  src={getBackImageUrl()}
                  width={80}
                  height={120}
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
                margin: "20px auto",
              }}
            >
              <img src={dealer} alt="dealer" />
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    backgroundColor: "#EB00FF",
                    fontFamily: "Space Mono",
                    color: "white",
                    padding: "5px",
                  }}
                >
                  Dealer
                </div>
                <div
                  style={{
                    backgroundColor: "black",
                    fontFamily: "Space Mono",
                    color: "#FCFF55",
                    padding: "10px 35px",
                    fontSize: "1.2rem",
                    border: "none",
                    borderRadius: "10px",
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
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              {playerImages.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  width={80}
                  height={120}
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
                margin: "20px auto",
              }}
            >
              <img src={player} alt="player" />
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    backgroundColor: "#CFFF18",
                    fontFamily: "Space Mono",
                    color: "#461B66",
                    padding: "5px",
                  }}
                >
                  Player
                </div>
                <div
                  style={{
                    backgroundColor: "black",
                    fontFamily: "Space Mono",
                    color: "#FCFF55",
                    padding: "10px 35px",
                    fontSize: "1.2rem",
                    border: "none",
                    borderRadius: "10px",
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
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: -1,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  color: resultText.includes("win") ? "red" : "#FF0000",
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
                    width: "200px",
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
                        fontSize: "1.5rem",

                        fontFamily: "Space Mono",
                        color: "white",
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
                    width: "200px",
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
                        fontSize: "1.5rem",
                        fontWeight: "500",
                        fontFamily: "Space Mono",
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

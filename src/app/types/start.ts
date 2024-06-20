export interface GameState {
    playerHand: Card[];
    dealerHand: Card[];
    bet: number;
    state: string;
    deck: Card[];
}

export interface Card {
    suit: string;
    value: string;
}
// Shuffle deck
export const shuffleDeck = () => {
    let deck = Array.from({ length: 52 }, (_, i) => i + 1); // Creates an array [1, 2, ..., 52]

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
};


// Evaluate hand function
export const evaluateHand = (hand: any) => {
    let value = 0;
    let aces = 0;

    for (let cardNumber of hand) {
        let cardValue = (cardNumber - 1) % 13 + 1;

        if (cardValue === 1) { // Ace
            aces += 1;
            value += 11;
        } else if (cardValue >= 11) { // J, Q, K
            value += 10;
        } else {
            value += cardValue; // 2 to 10
        }
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
};


// Preset challenge deck the host (or any player) can pull from.
export const CHALLENGE_DECK = [
  "Sing the chorus of your favorite song",
  "Do your best impression of another player",
  "Dance for 20 seconds with no music",
  "Tell a story using only sound effects",
  "Speak in an accent for the next 60 seconds",
  "Do 10 push-ups while singing Happy Birthday",
  "Recite the alphabet backwards",
  "Pretend to be a news anchor reporting from the party",
  "Beatbox for 15 seconds",
  "Do a runway walk across the room",
  "Make up a rap about the host",
  "Tell your most embarrassing story",
  "Do your best animal impression — others guess",
  "Sing a song using only 'meow'",
  "Compliment everyone in the room in 30 seconds",
  "Reenact a movie scene of your choice",
  "Do a 10-second stand-up bit",
  "Whisper a secret to the camera (loud enough to hear)",
  "Pose like a statue for 30 seconds",
  "Make the funniest face you can",
];

export function pickRandomChallenge() {
  return CHALLENGE_DECK[Math.floor(Math.random() * CHALLENGE_DECK.length)];
}

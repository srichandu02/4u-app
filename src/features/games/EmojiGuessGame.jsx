import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "../../components/ui/Button";

const PUZZLES = [
  { emojis: "🦁👑", answer: "The Lion King", hint: "Classic Disney Movie" },
  { emojis: "👻🚫", answer: "Ghostbusters", hint: "80s Supernatural Comedy" },
  { emojis: "🕷️👨", answer: "Spider Man", hint: "Marvel Superhero" },
];

export function EmojiGuessGame({ showToast }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [solved, setSolved] = useState(false);

  const puzzle = PUZZLES[index];

  const handleGuess = () => {
    if (input.trim().toLowerCase() === puzzle.answer.toLowerCase()) {
      setSolved(true);
      confetti({ particleCount: 60, spread: 60 });
      if (showToast) showToast("Correct Emoji Guess! 🎉");
    } else {
      if (showToast) showToast("Try again! Check the hint.");
    }
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % PUZZLES.length);
    setInput("");
    setSolved(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Emoji Guessing</h3>

      <div className="w-full max-w-xs bg-[#1B1A3B] p-6 rounded-3xl border border-[#38316E] flex flex-col items-center gap-3">
        <span className="text-5xl my-2">{puzzle.emojis}</span>
        <p className="f-body text-xs text-[#A6A1CC]">Hint: {puzzle.hint}</p>

        {solved ? (
          <div className="flex flex-col items-center gap-2 pop-in">
            <span className="f-display font-bold text-base text-[#FF6B4A]">Correct: {puzzle.answer}!</span>
            <Button onClick={handleNext} variant="primary" size="sm">
              Next Puzzle
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full mt-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              placeholder="Type movie or phrase name…"
              className="bg-[#252152] border border-[#38316E] text-xs text-[#F5F3FF] p-3 rounded-full outline-none text-center f-body"
            />
            <Button onClick={handleGuess} variant="primary" size="sm">
              Submit Answer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

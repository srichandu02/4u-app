import React, { useState } from "react";
import { Button } from "../../components/ui/Button";

const QUESTIONS = [
  { optionA: "Travel 100 years into the future", optionB: "Travel 100 years into the past", percentA: 68, percentB: 32 },
  { optionA: "Always have unlimited free coffee", optionB: "Always have free flight tickets", percentA: 42, percentB: 58 },
  { optionA: "Be a famous video game creator", optionB: "Be a famous movie director", percentA: 55, percentB: 45 },
];

export function WouldYouRatherGame() {
  const [index, setIndex] = useState(0);
  const [voted, setVoted] = useState(null);

  const current = QUESTIONS[index];

  const handleVote = (choice) => {
    setVoted(choice);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % QUESTIONS.length);
    setVoted(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Would You Rather</h3>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={() => handleVote("A")}
          className={`p-5 rounded-2xl border text-sm font-semibold f-body transition-all cursor-pointer ${
            voted === "A" ? "bg-[#FF6B4A] text-[#100F26] border-[#FF6B4A]" : "bg-[#252152] text-[#F5F3FF] border-[#38316E]"
          }`}
        >
          {current.optionA}
          {voted && <span className="block text-xs mt-1 font-mono font-bold">{current.percentA}% chose this</span>}
        </button>

        <span className="f-display font-extrabold text-[#A6A1CC] text-xs">OR</span>

        <button
          onClick={() => handleVote("B")}
          className={`p-5 rounded-2xl border text-sm font-semibold f-body transition-all cursor-pointer ${
            voted === "B" ? "bg-[#FFB84D] text-[#100F26] border-[#FFB84D]" : "bg-[#252152] text-[#F5F3FF] border-[#38316E]"
          }`}
        >
          {current.optionB}
          {voted && <span className="block text-xs mt-1 font-mono font-bold">{current.percentB}% chose this</span>}
        </button>

        {voted && (
          <Button onClick={handleNext} variant="primary" size="sm" className="mt-2">
            Next Dilemma →
          </Button>
        )}
      </div>
    </div>
  );
}

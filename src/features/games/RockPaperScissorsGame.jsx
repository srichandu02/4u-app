import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "../../components/ui/Button";

const CHOICES = [
  { id: "rock", label: "Rock", icon: "✊" },
  { id: "paper", label: "Paper", icon: "✋" },
  { id: "scissors", label: "Scissors", icon: "✌️" },
];

export function RockPaperScissorsGame({ showToast }) {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });

  const handlePlay = (choice) => {
    const opp = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    setPlayerChoice(choice);
    setOpponentChoice(opp);

    if (choice.id === opp.id) {
      setResult("Draw!");
    } else if (
      (choice.id === "rock" && opp.id === "scissors") ||
      (choice.id === "paper" && opp.id === "rock") ||
      (choice.id === "scissors" && opp.id === "paper")
    ) {
      setResult("You Win!");
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
      confetti({ particleCount: 60, spread: 60 });
    } else {
      setResult("Opponent Won!");
      setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
    }
  };

  const handleReset = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Rock Paper Scissors</h3>

      <div className="flex justify-around w-full max-w-xs bg-[#1B1A3B] py-3 px-4 rounded-2xl border border-[#38316E]">
        <div>
          <span className="f-body text-xs text-[#A6A1CC]">You</span>
          <p className="f-mono font-bold text-lg text-[#FFB84D]">{score.player}</p>
        </div>
        <span className="f-body text-sm font-bold text-[#A6A1CC] self-center">vs</span>
        <div>
          <span className="f-body text-xs text-[#A6A1CC]">Opponent</span>
          <p className="f-mono font-bold text-lg text-[#FFB84D]">{score.opponent}</p>
        </div>
      </div>

      {result ? (
        <div className="flex flex-col items-center gap-3 my-2 pop-in">
          <div className="flex items-center gap-6 text-4xl">
            <div>
              <p className="text-xs text-[#A6A1CC] mb-1">Your pick</p>
              <span>{playerChoice.icon}</span>
            </div>
            <span>⚡</span>
            <div>
              <p className="text-xs text-[#A6A1CC] mb-1">Opponent</p>
              <span>{opponentChoice.icon}</span>
            </div>
          </div>

          <p className="f-display font-extrabold text-xl text-[#FF6B4A]">{result}</p>
          <Button onClick={handleReset} variant="primary" size="sm">
            Play Next Round
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 my-4">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              onClick={() => handlePlay(c)}
              className="flex flex-col items-center p-4 bg-[#252152] rounded-2xl border border-[#38316E] hover:bg-[#2E2966] hover:scale-105 transition-all cursor-pointer"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="f-body text-xs text-[#F5F3FF] mt-1 font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Button } from "../../components/ui/Button";

const TRUTHS = [
  "What is the most embarrassing song in your recent playlist?",
  "What is your guilty pleasure movie or TV show?",
  "If you could trade places with any friend for 1 day, who would it be?",
];

const DARES = [
  "Send a 10-second voice note singing your favorite chorus into chat!",
  "Post a story with your favorite emoji right now!",
  "Tell your match your best (or worst) dad joke!",
];

export function TruthOrDareGame() {
  const [card, setCard] = useState(null);

  const handlePick = (type) => {
    const pool = type === "truth" ? TRUTHS : DARES;
    const text = pool[Math.floor(Math.random() * pool.length)];
    setCard({ type, text });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Truth or Dare</h3>

      {card ? (
        <div className="w-full max-w-xs bg-[#1B1A3B] p-6 rounded-3xl border border-[#38316E] flex flex-col items-center gap-3 pop-in">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${card.type === 'truth' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
            {card.type}
          </span>
          <p className="f-body text-sm text-[#F5F3FF] font-medium my-2">{card.text}</p>
          <Button onClick={() => setCard(null)} variant="primary" size="sm">
            Pick Next Challenge
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 my-4">
          <button
            onClick={() => handlePick("truth")}
            className="p-6 bg-[#252152] rounded-3xl border border-[#38316E] hover:border-blue-500 hover:scale-105 transition-all cursor-pointer"
          >
            <span className="text-3xl">💡</span>
            <p className="f-display font-bold text-sm text-[#F5F3FF] mt-2">TRUTH</p>
          </button>

          <button
            onClick={() => handlePick("dare")}
            className="p-6 bg-[#252152] rounded-3xl border border-[#38316E] hover:border-red-500 hover:scale-105 transition-all cursor-pointer"
          >
            <span className="text-3xl">🔥</span>
            <p className="f-display font-bold text-sm text-[#F5F3FF] mt-2">DARE</p>
          </button>
        </div>
      )}
    </div>
  );
}

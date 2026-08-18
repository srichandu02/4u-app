import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "../../components/ui/Button";

const TRIVIA_QUESTIONS = [
  {
    question: "Which movie holds the record for highest grossing film of all time?",
    options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"],
    answer: 0,
    category: "Movies",
  },
  {
    question: "Which programming language was created by Brendan Eich in 10 days?",
    options: ["Python", "JavaScript", "Java", "C++"],
    answer: 1,
    category: "Tech",
  },
  {
    question: "Which anime features the legendary Straw Hat Pirates?",
    options: ["Naruto", "One Piece", "Bleach", "Dragon Ball"],
    answer: 1,
    category: "Anime",
  },
];

export function TriviaGame({ showToast }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = TRIVIA_QUESTIONS[index];

  const handleSelect = (optionIdx) => {
    if (selected !== null) return;
    setSelected(optionIdx);

    if (optionIdx === current.answer) {
      setScore((prev) => prev + 1);
      confetti({ particleCount: 50, spread: 50 });
      if (showToast) showToast("Correct Answer! +50 XP");
    } else {
      if (showToast) showToast("Wrong Answer!");
    }
  };

  const handleNext = () => {
    if (index + 1 < TRIVIA_QUESTIONS.length) {
      setIndex((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Trivia Battle</h3>

      {finished ? (
        <div className="flex flex-col items-center gap-3 py-4 pop-in">
          <span className="text-4xl">🏆</span>
          <h4 className="f-display font-bold text-xl text-[#FF6B4A]">Quiz Completed!</h4>
          <p className="f-body text-sm text-[#A6A1CC]">
            Your Score: <span className="f-mono text-[#FFB84D] font-bold">{score}/{TRIVIA_QUESTIONS.length}</span>
          </p>
          <Button onClick={handleRestart} variant="primary" size="sm">
            Play Again
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-[#A6A1CC] f-body px-1">
            <span>Category: {current.category}</span>
            <span>{index + 1} / {TRIVIA_QUESTIONS.length}</span>
          </div>

          <div className="bg-[#1B1A3B] p-4 rounded-2xl border border-[#38316E]">
            <p className="f-body text-sm text-[#F5F3FF] font-medium">{current.question}</p>
          </div>

          <div className="flex flex-col gap-2">
            {current.options.map((opt, idx) => {
              let btnClass = "bg-[#252152] text-[#F5F3FF] border-[#38316E]";
              if (selected !== null) {
                if (idx === current.answer) btnClass = "bg-green-600/30 border-green-500 text-green-200";
                else if (idx === selected) btnClass = "bg-red-600/30 border-red-500 text-red-200";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`p-3 rounded-2xl border text-xs font-semibold f-body text-left transition-colors cursor-pointer ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <Button onClick={handleNext} variant="primary" size="sm" className="mt-2">
              Next Question →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

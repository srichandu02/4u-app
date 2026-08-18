import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "../../components/ui/Button";

export function TicTacToeGame({ currentUser, onFinish, showToast }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const nextBoard = [...board];
    nextBoard[index] = isXNext ? "❌" : "⭕";
    setBoard(nextBoard);

    const win = calculateWinner(nextBoard);
    if (win) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (showToast) showToast(`Winner: ${win === "❌" ? currentUser?.name || "Player X" : "Player O"}! 🎉`);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="text-center">
        <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Tic Tac Toe</h3>
        <p className="f-body text-xs text-[#A6A1CC]">
          {winner
            ? `🏆 Winner: ${winner}`
            : isDraw
            ? "🤝 Game Draw!"
            : `Turn: ${isXNext ? "❌ (You)" : "⭕ (Opponent)"}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-64 h-64 bg-[#1B1A3B] p-2.5 rounded-3xl border border-[#38316E]">
        {board.map((square, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            className="flex items-center justify-center bg-[#252152] rounded-2xl text-2xl font-extrabold hover:bg-[#2E2966] transition-colors cursor-pointer select-none"
          >
            {square}
          </button>
        ))}
      </div>

      <div className="flex gap-2 w-full max-w-xs mt-2">
        <Button onClick={handleReset} variant="outline" fullWidth>
          Rematch
        </Button>
      </div>
    </div>
  );
}

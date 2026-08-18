import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "../../components/ui/Button";

const ROWS = 6;
const COLS = 7;

export function ConnectFourGame({ showToast }) {
  const [grid, setGrid] = useState(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState("🔴");
  const [winner, setWinner] = useState(null);

  const checkWinner = (board) => {
    // Horizontal, Vertical, Diagonal checks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = board[r][c];
        if (!p) continue;

        // Horizontal
        if (c + 3 < COLS && p === board[r][c+1] && p === board[r][c+2] && p === board[r][c+3]) return p;
        // Vertical
        if (r + 3 < ROWS && p === board[r+1][c] && p === board[r+2][c] && p === board[r+3][c]) return p;
        // Diagonal Down-Right
        if (r + 3 < ROWS && c + 3 < COLS && p === board[r+1][c+1] && p === board[r+2][c+2] && p === board[r+3][c+3]) return p;
        // Diagonal Up-Right
        if (r - 3 >= 0 && c + 3 < COLS && p === board[r-1][c+1] && p === board[r-2][c+2] && p === board[r-3][c+3]) return p;
      }
    }
    return null;
  };

  const dropToken = (colIndex) => {
    if (winner) return;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][colIndex]) {
        const nextGrid = grid.map((row) => [...row]);
        nextGrid[r][colIndex] = currentPlayer;
        setGrid(nextGrid);

        const win = checkWinner(nextGrid);
        if (win) {
          setWinner(win);
          confetti({ particleCount: 100, spread: 80 });
          if (showToast) showToast(`Connect Four Winner: ${win}! 🏆`);
        } else {
          setCurrentPlayer((prev) => (prev === "🔴" ? "🟡" : "🔴"));
        }
        break;
      }
    }
  };

  const handleReset = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPlayer("🔴");
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <h3 className="f-display font-bold text-lg text-[#F5F3FF]">Connect Four</h3>
        <p className="f-body text-xs text-[#A6A1CC]">
          {winner ? `🏆 Winner: ${winner}!` : `Turn: ${currentPlayer}`}
        </p>
      </div>

      {/* Grid Board */}
      <div className="bg-[#1B1A3B] p-2 rounded-2xl border border-[#38316E] flex flex-col gap-1.5">
        {grid.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5">
            {row.map((cell, cIdx) => (
              <button
                key={cIdx}
                onClick={() => dropToken(cIdx)}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#252152] border border-[#38316E] flex items-center justify-center text-lg hover:bg-[#2E2966] transition-colors cursor-pointer select-none"
              >
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>

      <Button onClick={handleReset} variant="outline" size="sm" className="mt-2">
        Reset Game
      </Button>
    </div>
  );
}

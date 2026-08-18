import React, { useState } from "react";
import { GAMES_CATALOG } from "../../services/gameService";
import { Modal } from "../../components/ui/Modal";
import { TicTacToeGame } from "./TicTacToeGame";
import { RockPaperScissorsGame } from "./RockPaperScissorsGame";
import { ConnectFourGame } from "./ConnectFourGame";
import { TriviaGame } from "./TriviaGame";
import { EmojiGuessGame } from "./EmojiGuessGame";
import { WouldYouRatherGame } from "./WouldYouRatherGame";
import { TruthOrDareGame } from "./TruthOrDareGame";
import { awardXpAndCoins } from "../../services/gamificationService";

export function GamesHub({ currentUser, showToast }) {
  const [activeGameId, setActiveGameId] = useState(null);

  const handleGameWin = async (xp = 40, coins = 20) => {
    if (currentUser?.id) {
      await awardXpAndCoins(currentUser.id, xp, coins);
      showToast(`Victory! Earned +${xp} XP & +${coins} Coins 🏆`);
    }
  };

  const renderGameComponent = () => {
    switch (activeGameId) {
      case "tictactoe":
        return <TicTacToeGame currentUser={currentUser} onWin={handleGameWin} showToast={showToast} />;
      case "rps":
        return <RockPaperScissorsGame onWin={handleGameWin} showToast={showToast} />;
      case "connect4":
        return <ConnectFourGame onWin={handleGameWin} showToast={showToast} />;
      case "trivia":
        return <TriviaGame onWin={handleGameWin} showToast={showToast} />;
      case "emojiguess":
        return <EmojiGuessGame onWin={handleGameWin} showToast={showToast} />;
      case "wouldyourather":
        return <WouldYouRatherGame />;
      case "truthordare":
        return <TruthOrDareGame />;
      default:
        return null;
    }
  };

  const activeGameMeta = GAMES_CATALOG.find((g) => g.id === activeGameId);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 no-scrollbar">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FF5E3A]/15 via-[#8B5CF6]/15 to-[#06B6D4]/15 p-5 rounded-3xl border border-[#363168] mb-5 shadow-lg">
        <h2 className="f-display font-extrabold text-lg text-[#F5F3FF]">Arcade & Social Games 🎮</h2>
        <p className="f-body text-xs text-[#A6A1CC] mt-1 leading-relaxed">
          Play multiplayer games, test trivia knowledge, and earn XP to level up your 4U profile!
        </p>
      </div>

      {/* Games Catalog Grid */}
      <div className="grid grid-cols-2 gap-3">
        {GAMES_CATALOG.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGameId(game.id)}
            className="flex flex-col items-start p-4 bg-[#1C1A3A] border border-[#363168] rounded-3xl hover:bg-[#26234D] hover:border-[#FF5E3A] transition-all text-left cursor-pointer active:scale-95 shadow-sm group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{game.icon}</span>
            <h4 className="f-display font-bold text-sm text-[#F5F3FF]">{game.title}</h4>
            <p className="f-body text-[11px] text-[#A6A1CC] mt-1 line-clamp-2 leading-relaxed">{game.description}</p>
            <span className="mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#26234D] text-[#FFAB38] border border-[#363168]">
              {game.category}
            </span>
          </button>
        ))}
      </div>

      {/* Game Modal Launcher */}
      {activeGameId && (
        <Modal
          isOpen={!!activeGameId}
          onClose={() => setActiveGameId(null)}
          title={activeGameMeta?.title || "Game Arena"}
        >
          {renderGameComponent()}
        </Modal>
      )}
    </div>
  );
}

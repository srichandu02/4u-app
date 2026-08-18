import React, { useState } from "react";
import { Search, Users, Hash, Gamepad2, Radio, X } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Avatar } from "../../components/ui/Avatar";
import { CANDIDATE_PROFILES } from "../../services/discoveryService";
import { GAMES_CATALOG } from "../../services/gameService";
import { SEED_ROOMS } from "../../services/roomService";

export function SearchModal({ isOpen, onClose, onSelectUser, onSelectRoom, onSelectGame, showToast }) {
  const [query, setQuery] = useState("");

  const filteredUsers = CANDIDATE_PROFILES.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.username?.toLowerCase().includes(query.toLowerCase()) ||
      p.interests.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      p.city?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGames = GAMES_CATALOG.filter(
    (g) =>
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRooms = SEED_ROOMS.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explore & Search 🔍">
      <div className="flex flex-col gap-4">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#26234D] border border-[#363168] rounded-2xl">
          <Search size={18} className="text-[#A6A1CC]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, #hashtags, games, or rooms…"
            className="flex-1 bg-transparent text-xs text-[#F5F3FF] outline-none f-body focus:placeholder-transparent"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#A6A1CC] hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results List */}
        {query.trim() ? (
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto no-scrollbar">
            {/* Users */}
            {filteredUsers.length > 0 && (
              <div>
                <p className="f-body text-xs font-semibold text-[#A6A1CC] mb-2 flex items-center gap-1.5">
                  <Users size={14} /> Creators ({filteredUsers.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {filteredUsers.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        if (onSelectUser) onSelectUser(user);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#13122A] hover:bg-[#26234D] transition-colors text-left cursor-pointer border border-[#363168]"
                    >
                      <Avatar name={user.name} src={user.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <span className="f-display font-bold text-xs text-[#F5F3FF]">{user.name}</span>
                        <p className="f-body text-[10px] text-[#A6A1CC]">@{user.username || "creator"} · {user.city || "Nearby"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Audio Rooms */}
            {filteredRooms.length > 0 && (
              <div>
                <p className="f-body text-xs font-semibold text-[#A6A1CC] mb-2 flex items-center gap-1.5">
                  <Radio size={14} /> Live Rooms ({filteredRooms.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {filteredRooms.slice(0, 3).map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        if (onSelectRoom) onSelectRoom(room);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#13122A] hover:bg-[#26234D] transition-colors text-left cursor-pointer border border-[#363168]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#FF5E3A]/20 flex items-center justify-center text-[#FF5E3A]">
                        <Radio size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="f-display font-bold text-xs text-[#F5F3FF] block truncate">{room.title}</span>
                        <p className="f-body text-[10px] text-[#A6A1CC]">Topic: {room.tag}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Games */}
            {filteredGames.length > 0 && (
              <div>
                <p className="f-body text-xs font-semibold text-[#A6A1CC] mb-2 flex items-center gap-1.5">
                  <Gamepad2 size={14} /> Games ({filteredGames.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {filteredGames.slice(0, 3).map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        if (onSelectGame) onSelectGame(game.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#13122A] hover:bg-[#26234D] transition-colors text-left cursor-pointer border border-[#363168]"
                    >
                      <span className="text-xl">{game.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="f-display font-bold text-xs text-[#F5F3FF] block">{game.title}</span>
                        <p className="f-body text-[10px] text-[#A6A1CC]">{game.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-[#A6A1CC]">Try searching for people like "Aisha", topics like "Music", or games like "Trivia".</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

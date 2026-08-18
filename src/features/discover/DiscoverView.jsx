import React, { useState, useEffect } from "react";
import { Sparkles, Heart, X, Flag, BadgeCheck, MessageCircle, UserPlus, UserCheck, Flame, Radio, Gamepad2, Hash } from "lucide-react";
import { Chip } from "../../components/ui/Chip";
import { Avatar } from "../../components/ui/Avatar";
import { fetchDiscoveryDeck, recordDiscoveryAction } from "../../services/discoveryService";
import { sendFriendRequest, toggleFollow, checkRelationshipStatus } from "../../services/friendService";
import { fetchLiveRooms } from "../../services/roomService";
import { GAMES_CATALOG } from "../../services/gameService";

const INTERESTS = ["Music", "Movies", "Gaming", "Travel", "Fitness", "Art", "Books", "Foodie", "Tech", "Anime"];

export function DiscoverView({
  currentUser,
  matchState,
  startSearch,
  currentMatch,
  passMatch,
  connectMatch,
  startCall,
  onReport,
  onOpenChat,
  onJoinRoom,
  onStartGame,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState("people"); // 'people' | 'rooms' | 'games'
  const [selectedTags, setSelectedTags] = useState(["Music"]);
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [liveRooms, setLiveRooms] = useState([]);
  const [relationship, setRelationship] = useState({ isFriend: false, isFollowing: false, isPendingSent: false });

  useEffect(() => {
    (async () => {
      const [candidates, rooms] = await Promise.all([
        fetchDiscoveryDeck(currentUser?.id, selectedTags),
        fetchLiveRooms(),
      ]);
      setDeck(candidates);
      setDeckIndex(0);
      setLiveRooms(rooms);
    })();
  }, [selectedTags, currentUser]);

  const activeCard = deck[deckIndex];

  useEffect(() => {
    if (activeCard && currentUser?.id) {
      checkRelationshipStatus(currentUser.id, activeCard.id).then(setRelationship);
    }
  }, [activeCard, currentUser]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handlePassCard = () => {
    if (activeCard) recordDiscoveryAction(currentUser?.id, activeCard.id, "pass");
    setDeckIndex((prev) => prev + 1);
  };

  const handleSendFriendReq = async (person) => {
    if (!person || !currentUser) return;
    try {
      await sendFriendRequest(currentUser.id, person.id);
      recordDiscoveryAction(currentUser.id, person.id, "connect");
      setRelationship((prev) => ({ ...prev, isPendingSent: true }));
      showToast(`Friend request sent to ${person.name}! 🤝`);
    } catch (e) {
      showToast("Could not send friend request");
    }
  };

  const handleToggleFollow = async (person) => {
    if (!person || !currentUser) return;
    try {
      const res = await toggleFollow(currentUser.id, person.id);
      setRelationship((prev) => ({ ...prev, isFollowing: res.following }));
      showToast(res.following ? `Following ${person.name}` : `Unfollowed ${person.name}`);
    } catch (e) {
      showToast("Could not update follow state");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 no-scrollbar">
      {/* Discovery Sub-Tabs */}
      <div className="flex p-1 bg-[#13122A] rounded-full border border-[#363168] mb-4">
        {[
          { id: "people", label: "Discover People", icon: Sparkles },
          { id: "rooms", label: "Live Rooms", icon: Radio },
          { id: "games", label: "Arcade Games", icon: Gamepad2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                active
                  ? "bg-[#FF5E3A] text-[#0B0A1A] shadow-md"
                  : "text-[#A6A1CC] hover:text-[#F5F3FF]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "people" && (
        <>
          {/* Interest Chips */}
          <div className="mb-4">
            <p className="f-body text-xs text-[#A6A1CC] mb-2">Filter by interests:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {INTERESTS.map((t) => (
                <Chip key={t} active={selectedTags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          {/* Pulse Instant Match Section */}
          <div className="flex flex-col items-center justify-center my-4 relative py-6 bg-gradient-to-b from-[#1C1A3A] to-[#13122A] rounded-3xl border border-[#363168] shadow-xl overflow-hidden">
            {matchState === "searching" && (
              <>
                <div className="pulse-ring w-24 h-24" />
                <div className="pulse-ring w-24 h-24" style={{ animationDelay: "0.6s" }} />
                <div className="pulse-ring w-24 h-24" style={{ animationDelay: "1.2s" }} />
              </>
            )}
            <button
              onClick={matchState === "idle" ? startSearch : undefined}
              className="relative flex flex-col items-center justify-center rounded-full f-display font-bold cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 88,
                height: 88,
                background: "linear-gradient(135deg, #FF5E3A, #FFAB38)",
                color: "#0B0A1A",
                boxShadow: "0 8px 28px rgba(255, 94, 58, 0.45)",
              }}
            >
              {matchState === "searching" ? (
                <span className="text-xs f-body font-bold animate-pulse">Matching…</span>
              ) : (
                <>
                  <Sparkles size={26} strokeWidth={2.4} />
                  <span className="text-[11px] mt-1 font-extrabold">Instant Match</span>
                </>
              )}
            </button>
            <p className="f-body text-xs text-[#A6A1CC] mt-3.5 text-center max-w-[260px] leading-relaxed">
              {matchState === "searching"
                ? "Connecting with an active user online who shares your interests in real time…"
                : "Match with compatible friends instantly for chat, voice, or games"}
            </p>
          </div>

          {/* Match Found Card */}
          {currentMatch && matchState === "found" && (
            <div className="pop-in rounded-3xl p-5 bg-[#1C1A3A] border-2 border-[#FF5E3A] shadow-2xl mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={currentMatch.name} size={56} ring />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="f-display font-bold text-base text-[#F5F3FF]">
                        {currentMatch.name}{currentMatch.age ? `, ${currentMatch.age}` : ""}
                      </span>
                      {currentMatch.verified && <BadgeCheck size={16} className="text-[#FF5E3A]" />}
                    </div>
                    <p className="f-body text-xs text-[#A6A1CC]">{currentMatch.city || "Online Match"}</p>
                  </div>
                </div>
                <button
                  onClick={() => onReport && onReport(currentMatch)}
                  className="p-2 rounded-full bg-[#26234D] text-[#A6A1CC] hover:text-white"
                >
                  <Flag size={14} />
                </button>
              </div>

              <p className="f-body text-sm mt-3 text-[#F5F3FF] leading-relaxed">
                {currentMatch.bio || "Matched based on shared preferences! Connect to start chatting."}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={passMatch}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl f-body font-semibold bg-[#26234D] text-[#A6A1CC] hover:text-white cursor-pointer"
                >
                  <X size={18} /> Skip
                </button>
                <button
                  onClick={connectMatch}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl f-body font-bold bg-[#FF5E3A] text-[#0B0A1A] hover:bg-[#FF7555] cursor-pointer shadow-lg"
                >
                  <Heart size={18} /> Connect & Chat
                </button>
              </div>
            </div>
          )}

          {/* Discovery Card Deck */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="f-display font-bold text-sm text-[#F5F3FF]">Compatible Friends</h3>
            <span className="text-xs text-[#A6A1CC] font-mono">{deckIndex + 1}/{deck.length}</span>
          </div>

          {activeCard ? (
            <div className="rounded-3xl p-5 bg-[#1C1A3A] border border-[#363168] shadow-xl pop-in flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={activeCard.name} src={activeCard.avatar_url} size={56} ring />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="f-display font-bold text-base text-[#F5F3FF]">
                        {activeCard.name}{activeCard.age ? `, ${activeCard.age}` : ""}
                      </span>
                      {activeCard.verified && <BadgeCheck size={16} className="text-[#FF5E3A]" />}
                    </div>
                    <p className="f-body text-xs text-[#A6A1CC]">@{activeCard.username || "creator"} · {activeCard.city || "Global"}</p>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="px-3 py-1.5 rounded-2xl bg-[#FF5E3A]/15 border border-[#FF5E3A]/40 flex flex-col items-center">
                  <span className="f-mono font-bold text-sm text-[#FFAB38]">
                    {activeCard.compatibility?.totalScore || 88}%
                  </span>
                  <span className="f-body text-[9px] text-[#A6A1CC] uppercase tracking-wider font-semibold">Match</span>
                </div>
              </div>

              {/* Compatibility Breakdown */}
              <div className="bg-[#13122A] p-3 rounded-2xl border border-[#363168]">
                <p className="f-body text-[11px] text-[#FFAB38] font-semibold mb-1">Compatibility Factors:</p>
                <ul className="list-disc list-inside text-[11px] text-[#A6A1CC] space-y-0.5">
                  {(activeCard.compatibility?.reasons || ["Shared gaming & social preferences"]).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <p className="f-body text-sm text-[#F5F3FF] leading-relaxed">{activeCard.bio}</p>

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap">
                {(activeCard.interests || []).map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs f-body bg-[#26234D] text-[#A6A1CC] border border-[#363168]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Discovery Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handlePassCard}
                  className="flex-1 py-3 rounded-2xl f-body text-xs font-semibold bg-[#26234D] text-[#A6A1CC] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={16} /> Skip
                </button>

                <button
                  onClick={() => handleToggleFollow(activeCard)}
                  className={`px-4 py-3 rounded-2xl f-body text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    relationship.isFollowing
                      ? "bg-[#26234D] text-[#10B981] border border-[#10B981]/30"
                      : "bg-[#26234D] text-[#F5F3FF] hover:bg-[#363168]"
                  }`}
                >
                  {relationship.isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {relationship.isFollowing ? "Following" : "Follow"}
                </button>

                <button
                  onClick={() => handleSendFriendReq(activeCard)}
                  disabled={relationship.isFriend || relationship.isPendingSent}
                  className="flex-1 py-3 rounded-2xl f-body text-xs font-bold bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Heart size={16} />
                  {relationship.isFriend ? "Friends" : relationship.isPendingSent ? "Requested" : "Add Friend"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1C1A3A] rounded-3xl p-8 text-center border border-[#363168]">
              <Sparkles size={32} className="text-[#FF5E3A] mx-auto mb-2" />
              <p className="f-body text-sm text-[#F5F3FF] font-semibold">You've explored all suggested profiles!</p>
              <p className="f-body text-xs text-[#A6A1CC] mt-1 mb-4">Try selecting different interest tags above to discover new people.</p>
              <button
                onClick={() => setDeckIndex(0)}
                className="px-5 py-2.5 bg-[#FF5E3A] text-[#0B0A1A] rounded-full text-xs font-bold cursor-pointer"
              >
                Rewind Deck
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "rooms" && (
        <div className="flex flex-col gap-3">
          {liveRooms.length === 0 ? (
            <p className="text-xs text-[#A6A1CC] text-center py-8">No live rooms at the moment.</p>
          ) : (
            liveRooms.map((room) => (
              <div key={room.id} className="p-4 rounded-3xl bg-[#1C1A3A] border border-[#363168] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF5E3A]/20 border border-[#FF5E3A]/40 flex items-center justify-center text-[#FF5E3A]">
                    <Radio size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="f-display font-bold text-sm text-[#F5F3FF]">{room.title}</h4>
                    <p className="f-body text-xs text-[#A6A1CC]">Hosted by {room.host?.name || "Member"} · <span className="text-[#FFAB38]">{room.tag || "General"}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => onJoinRoom && onJoinRoom(room)}
                  className="px-4 py-2 rounded-full bg-[#FF5E3A] text-[#0B0A1A] text-xs font-bold cursor-pointer"
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "games" && (
        <div className="grid grid-cols-2 gap-3">
          {GAMES_CATALOG.map((g) => (
            <div key={g.id} className="p-4 rounded-3xl bg-[#1C1A3A] border border-[#363168] flex flex-col justify-between">
              <div>
                <span className="text-2xl mb-2 block">{g.icon}</span>
                <h4 className="f-display font-bold text-sm text-[#F5F3FF]">{g.title}</h4>
                <p className="f-body text-[11px] text-[#A6A1CC] mt-1">{g.description}</p>
              </div>
              <button
                onClick={() => onStartGame && onStartGame(g.id)}
                className="mt-3 w-full py-2 bg-[#26234D] hover:bg-[#FF5E3A] hover:text-[#0B0A1A] text-[#F5F3FF] text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
              >
                Play Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

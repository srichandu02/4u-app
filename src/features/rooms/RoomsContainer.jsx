import React, { useState, useEffect } from "react";
import {
  Radio, Users, Plus, Mic, MicOff, LogOut, Heart, Flame, ThumbsUp, Send, Hand,
  Gift, Volume2, Sparkles, Pin, MessageSquare, Award, Smile, ChevronDown, UserCheck, Shield
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import {
  fetchLiveRooms,
  createLiveRoom,
  broadcastRoomReaction,
  broadcastRoomMessage,
  subscribeToRoomBroadcast,
  joinLiveRoom,
  leaveLiveRoom,
  endLiveRoom,
  updateParticipantRole,
} from "../../services/roomService";
import { soundFX } from "../../services/soundEffects";
import { awardXpAndCoins } from "../../services/gamificationService";

const ICEBREAKERS = [
  "What's a song you have on repeat right now? 🎵",
  "If you could teleport anywhere this weekend, where? ✈️",
  "Best game ever made of all time? 🎮",
  "What is the most underrated movie you love? 🍿",
  "Tea or Coffee? Defend your answer! ☕",
  "What's the best tech gadget you bought this year? ⚡"
];

const ROOM_CATEGORIES = ["All", "Music", "Tech", "Gaming", "Social", "Anime", "Cinema"];

export function RoomsContainer({ currentUser, showToast }) {
  const [rooms, setRooms] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [floaters, setFloaters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [muted, setMuted] = useState(true);
  const [myRole, setMyRole] = useState("listener"); // 'host' | 'speaker' | 'requested' | 'listener'
  const [createModal, setCreateModal] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);

  // Active Room state
  const [roomTitle, setRoomTitle] = useState("");
  const [roomTag, setRoomTag] = useState("Music");
  const [pinnedTopic, setPinnedTopic] = useState(ICEBREAKERS[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Simulated co-speakers & listeners in room
  const [participants, setParticipants] = useState([
    { id: "u2", name: "Aisha", role: "speaker", avatar_url: "", isMuted: false },
    { id: "u3", name: "Rohan", role: "listener", avatar_url: "", isMuted: true },
    { id: "u4", name: "Meera", role: "listener", avatar_url: "", isMuted: true },
  ]);

  const loadRooms = async () => {
    const data = await fetchLiveRooms();
    setRooms(data);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const isHost = activeRoom && currentUser?.id && (activeRoom.host_id === currentUser.id || activeRoom.host?.id === currentUser.id);

  useEffect(() => {
    if (!activeRoomId) return;

    if (isHost) {
      setMyRole("host");
      setMuted(false);
    } else {
      setMyRole("listener");
      setMuted(true);
      joinLiveRoom(activeRoomId, currentUser?.id, "listener");
    }

    const unsubscribe = subscribeToRoomBroadcast(
      activeRoomId,
      (reaction) => {
        const left = `${15 + Math.random() * 70}%`;
        setFloaters((prev) => [...prev, { id: reaction.id, emoji: reaction.emoji, left }]);
        if (reaction.sound) {
          if (reaction.sound === "airhorn") soundFX.playAirhorn();
          else if (reaction.sound === "applause") soundFX.playApplause();
          else if (reaction.sound === "levelup") soundFX.playLevelUp();
          else soundFX.playPop();
        }
        setTimeout(() => {
          setFloaters((prev) => prev.filter((x) => x.id !== reaction.id));
        }, 1500);
      },
      (msg) => {
        setMessages((prev) => [...prev, msg]);
      }
    );

    // Periodic speaking indicator simulation
    const speakInterval = setInterval(() => {
      setIsSpeaking((prev) => !prev);
    }, 2400);

    return () => {
      unsubscribe();
      clearInterval(speakInterval);
      if (!isHost) leaveLiveRoom(activeRoomId, currentUser?.id);
    };
  }, [activeRoomId, isHost, currentUser]);

  const handleSendReaction = (emoji, sound = null) => {
    if (!activeRoomId) return;
    broadcastRoomReaction(activeRoomId, emoji, currentUser?.name || "User", sound);
    if (sound === "airhorn") soundFX.playAirhorn();
    else if (sound === "applause") soundFX.playApplause();
    else if (sound === "levelup") soundFX.playLevelUp();
    else soundFX.playPop();
  };

  const handleSendChat = () => {
    if (!chatDraft.trim() || !activeRoomId) return;
    broadcastRoomMessage(activeRoomId, currentUser?.name || "User", chatDraft.trim());
    setChatDraft("");
  };

  const handleRequestSpeak = () => {
    if (myRole === "listener") {
      setMyRole("requested");
      updateParticipantRole(activeRoomId, currentUser.id, "requested");
      soundFX.playPop();
      showToast("Requested to speak on stage 🎙️");
    } else if (myRole === "requested") {
      setMyRole("listener");
      updateParticipantRole(activeRoomId, currentUser.id, "listener");
      showToast("Cancelled speaking request");
    }
  };

  const handlePromoteSpeaker = (personId) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, role: p.role === "speaker" ? "listener" : "speaker" } : p))
    );
    showToast("Participant role updated");
  };

  const handleSendGift = async (giftItem) => {
    setGiftModalOpen(false);
    handleSendReaction(giftItem.icon, "levelup");
    if (currentUser?.id) {
      await awardXpAndCoins(currentUser.id, 20, 0);
    }
    showToast(`Sent ${giftItem.name} ${giftItem.icon} to the stage! 🌟`);
  };

  const handleRandomIcebreaker = () => {
    const next = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
    setPinnedTopic(next);
    showToast("Pinned new icebreaker topic 📌");
  };

  const handleCreateRoom = async () => {
    if (!roomTitle.trim()) return;
    const room = await createLiveRoom(currentUser?.id, roomTitle.trim(), roomTag);
    setRooms((prev) => [room, ...prev]);
    setActiveRoomId(room.id);
    setCreateModal(false);
    setRoomTitle("");
    soundFX.playMatchSuccess();
    showToast("Live Audio Room launched! 🎙️");
  };

  const handleEndRoom = async () => {
    if (isHost) {
      await endLiveRoom(activeRoom.id, currentUser.id);
      showToast("Audio room ended");
    }
    setActiveRoomId(null);
    loadRooms();
  };

  const filteredRooms = activeCategory === "All"
    ? rooms
    : rooms.filter((r) => r.tag?.toLowerCase() === activeCategory.toLowerCase());

  // ---------------- Inside Active Room View ----------------
  if (activeRoom) {
    const speakersList = participants.filter((p) => p.role === "speaker");
    const listenersList = participants.filter((p) => p.role === "listener" || p.role === "requested");

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#070612] text-[#F5F3FF]">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-[#363168] bg-[#13122A] flex items-center justify-between z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <h3 className="f-display font-extrabold text-base text-[#F5F3FF] truncate max-w-[180px] sm:max-w-[260px]">
                {activeRoom.title}
              </h3>
            </div>
            <p className="f-body text-xs text-[#A6A1CC] mt-0.5">
              Hosted by <strong className="text-white">{activeRoom.host?.name || "Host"}</strong> · <span className="text-[#FFAB38] font-semibold">{activeRoom.tag}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudienceModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-xs font-semibold text-[#A6A1CC] hover:text-white cursor-pointer"
            >
              <Users size={14} /> {participants.length + 1}
            </button>
            <button
              onClick={isHost ? handleEndRoom : () => setActiveRoomId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 f-body text-xs font-semibold cursor-pointer border border-red-500/30"
            >
              <LogOut size={14} /> {isHost ? "End" : "Leave"}
            </button>
          </div>
        </div>

        {/* Pinned Icebreaker Topic Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#FF5E3A]/20 via-[#8B5CF6]/20 to-[#06B6D4]/20 border-b border-[#363168] flex items-center justify-between z-10 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Pin size={14} className="text-[#FFAB38] flex-shrink-0" />
            <p className="f-body text-xs text-[#F5F3FF] font-medium truncate">{pinnedTopic}</p>
          </div>
          {isHost && (
            <button
              onClick={handleRandomIcebreaker}
              className="text-[10px] text-[#FFAB38] hover:underline font-bold flex-shrink-0 ml-2 cursor-pointer"
            >
              Change Topic
            </button>
          )}
        </div>

        {/* Floating Emojis Animation Layer */}
        <div className="relative flex-1 overflow-hidden flex flex-col justify-between p-4">
          {floaters.map((f) => (
            <span key={f.id} className="float-emoji text-3xl" style={{ left: f.left, bottom: 80 }}>
              {f.emoji}
            </span>
          ))}

          {/* Speakers Stage Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#A6A1CC] flex items-center gap-1.5">
                <Mic size={13} className="text-[#FF5E3A]" /> Speakers on Stage ({speakersList.length + 1 + (myRole === "speaker" ? 1 : 0)})
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-[#13122A] border border-[#363168] grid grid-cols-3 sm:grid-cols-4 gap-4 text-center shadow-xl">
              {/* Host Avatar */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className={`relative ${isSpeaking ? "scale-105 transition-transform" : ""}`}>
                  <Avatar name={activeRoom.host?.name || "Host"} src={activeRoom.host?.avatar_url} size={62} ring />
                  {isSpeaking && <span className="absolute -inset-1 rounded-full border-2 border-[#FF5E3A] animate-ping pointer-events-none" />}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#FF5E3A] text-[9px] font-bold text-[#0B0A1A] shadow-md">
                    Host
                  </span>
                </div>
                <span className="f-body text-xs font-semibold text-[#F5F3FF] truncate max-w-[85px]">
                  {activeRoom.host?.name || "Host"}
                </span>
              </div>

              {/* Current User */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className="relative">
                  <Avatar name={currentUser?.name || "You"} src={currentUser?.avatar_url} size={62} ring={myRole === "speaker" || myRole === "host"} />
                  {(!muted && (myRole === "host" || myRole === "speaker")) && (
                    <span className="absolute -inset-1 rounded-full border-2 border-[#10B981] animate-pulse pointer-events-none" />
                  )}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#26234D] text-[9px] font-bold text-[#FFAB38] border border-[#363168]">
                    {myRole === "host" ? "Host" : myRole === "speaker" ? "Speaker" : "You"}
                  </span>
                </div>
                <span className="f-body text-xs text-[#F5F3FF]">You</span>
              </div>

              {/* Co-Speakers */}
              {speakersList.map((sp) => (
                <div key={sp.id} className="flex flex-col items-center gap-1.5 relative">
                  <Avatar name={sp.name} size={62} ring />
                  <span className="f-body text-xs text-[#F5F3FF] truncate max-w-[85px]">{sp.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* In-Room Live Chat & Reaction Feed */}
          <div className="max-h-36 overflow-y-auto no-scrollbar flex flex-col gap-1.5 p-3 bg-[#13122A]/85 backdrop-blur-md rounded-2xl border border-[#363168] shadow-inner mt-4">
            {messages.length === 0 ? (
              <p className="text-[11px] text-[#A6A1CC] italic text-center py-2">
                Room live chat. Say hello to everyone in the room! 👋
              </p>
            ) : (
              messages.slice(-20).map((m) => (
                <div key={m.id} className="text-xs f-body">
                  <span className="font-bold text-[#FFAB38] mr-1.5">{m.senderName}:</span>
                  <span className="text-[#F5F3FF]">{m.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Audio Room Controls Toolbar */}
        <div className="p-3 border-t border-[#363168] bg-[#13122A] flex flex-col gap-2.5 pb-safe z-20">
          {/* Chat Composer */}
          <div className="flex items-center gap-2">
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Chat in room…"
              className="flex-1 bg-[#1C1A3A] border border-[#363168] text-xs text-[#F5F3FF] px-4 py-2.5 rounded-full outline-none focus:border-[#FF5E3A]"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatDraft.trim()}
              className="p-2.5 rounded-full bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] disabled:opacity-40 cursor-pointer shadow-md"
            >
              <Send size={15} />
            </button>
          </div>

          {/* Controls & Soundboard Row */}
          <div className="flex items-center justify-between">
            {/* Mic / Speak Request */}
            <div className="flex items-center gap-2">
              {(myRole === "host" || myRole === "speaker") ? (
                <button
                  onClick={() => {
                    setMuted((m) => !m);
                    soundFX.playPop();
                  }}
                  className={`p-3 rounded-full cursor-pointer transition-all shadow-md active:scale-95 ${
                    muted ? "bg-[#26234D] text-[#A6A1CC]" : "bg-[#FF5E3A] text-[#0B0A1A] font-bold"
                  }`}
                  title={muted ? "Unmute Mic" : "Mute Mic"}
                >
                  {muted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              ) : (
                <button
                  onClick={handleRequestSpeak}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 ${
                    myRole === "requested"
                      ? "bg-[#FFAB38] text-[#0B0A1A]"
                      : "bg-[#26234D] text-[#F5F3FF] hover:bg-[#363168]"
                  }`}
                >
                  <Hand size={15} /> {myRole === "requested" ? "Requested" : "Ask to Speak"}
                </button>
              )}

              {/* Soundboard Button */}
              <button
                onClick={() => setSoundboardOpen(!soundboardOpen)}
                className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#FFAB38] hover:text-[#FF5E3A] cursor-pointer"
                title="Room SFX Soundboard"
              >
                <Volume2 size={17} />
              </button>

              {/* Virtual Gift Button */}
              <button
                onClick={() => setGiftModalOpen(true)}
                className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#FF5E3A] hover:text-[#FFAB38] cursor-pointer"
                title="Send Gift"
              >
                <Gift size={17} />
              </button>
            </div>

            {/* Quick Emoji Reactions */}
            <div className="flex items-center gap-1.5">
              {["👏", "❤️", "🔥", "😂"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-9 h-9 rounded-full bg-[#1C1A3A] border border-[#363168] flex items-center justify-center text-lg active:scale-125 transition-transform cursor-pointer hover:bg-[#26234D]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Soundboard Tray */}
          {soundboardOpen && (
            <div className="p-2.5 bg-[#1C1A3A] rounded-2xl border border-[#363168] flex items-center justify-between gap-2 pop-in">
              <span className="text-[10px] text-[#A6A1CC] uppercase font-bold pl-1">Room SFX:</span>
              {[
                { name: "Airhorn", icon: "🎺", sfx: "airhorn" },
                { name: "Applause", icon: "👏", sfx: "applause" },
                { name: "Fanfare", icon: "🏆", sfx: "levelup" },
                { name: "Pop", icon: "✨", sfx: "pop" },
              ].map((s) => (
                <button
                  key={s.sfx}
                  onClick={() => handleSendReaction(s.icon, s.sfx)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#26234D] hover:bg-[#FF5E3A] hover:text-[#0B0A1A] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>{s.icon}</span> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gift Modal */}
        <Modal isOpen={giftModalOpen} onClose={() => setGiftModalOpen(false)} title="Send Room Gift 🎁">
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[#A6A1CC]">Award coins & gifts to the speakers on stage!</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Diamond", icon: "💎", cost: 50 },
                { name: "Rocket", icon: "🚀", cost: 100 },
                { name: "Crown", icon: "👑", cost: 200 },
                { name: "Golden Star", icon: "⭐", cost: 30 },
              ].map((gift) => (
                <button
                  key={gift.name}
                  onClick={() => handleSendGift(gift)}
                  className="p-4 bg-[#26234D] border border-[#363168] hover:border-[#FF5E3A] rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="text-xs font-bold text-white">{gift.name}</span>
                  <span className="text-[10px] text-[#FFAB38] font-mono font-semibold">{gift.cost} Coins</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* Audience Roster Modal */}
        <Modal isOpen={audienceModalOpen} onClose={() => setAudienceModalOpen(false)} title="Room Members 👥">
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto no-scrollbar">
            <p className="text-xs font-bold text-[#FFAB38]">Stage Speakers</p>
            <div className="flex items-center justify-between p-2.5 bg-[#1C1A3A] rounded-2xl">
              <div className="flex items-center gap-2.5">
                <Avatar name={activeRoom.host?.name || "Host"} size={36} />
                <span className="text-xs font-bold text-white">{activeRoom.host?.name || "Host"} (Host)</span>
              </div>
              <span className="text-[10px] text-[#FF5E3A] font-bold">Host</span>
            </div>

            <p className="text-xs font-bold text-[#A6A1CC] mt-2">Listeners in Audience</p>
            {listenersList.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 bg-[#1C1A3A] rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <Avatar name={l.name} size={36} />
                  <div>
                    <span className="text-xs font-semibold text-white block">{l.name}</span>
                    <span className="text-[10px] text-[#A6A1CC]">{l.role === "requested" ? "Requested stage" : "Listener"}</span>
                  </div>
                </div>
                {isHost && (
                  <button
                    onClick={() => handlePromoteSpeaker(l.id)}
                    className="px-2.5 py-1 rounded-xl bg-[#26234D] hover:bg-[#FF5E3A] hover:text-[#0B0A1A] text-[11px] font-semibold text-[#F5F3FF] cursor-pointer"
                  >
                    Invite to Stage
                  </button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      </div>
    );
  }

  // ---------------- Live Audio Rooms Directory View ----------------
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 no-scrollbar">
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="f-display font-extrabold text-lg text-[#F5F3FF]">Live Audio Rooms 📻</h2>
          <p className="f-body text-xs text-[#A6A1CC]">Drop in on voice conversations & community hangouts</p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FFAB38] text-[#0B0A1A] text-xs font-bold shadow-lg cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={2.5} /> Host Room
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar mb-2">
        {ROOM_CATEGORIES.map((cat) => (
          <Chip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
            {cat}
          </Chip>
        ))}
      </div>

      {/* Room Listing Cards */}
      <div className="flex flex-col gap-3">
        {filteredRooms.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#1C1A3A] border border-[#363168] text-center shadow-md">
            <Radio size={36} className="text-[#FF5E3A] mx-auto mb-2.5 animate-pulse" />
            <p className="f-body text-sm font-bold text-[#F5F3FF]">No active rooms in "{activeCategory}"</p>
            <p className="f-body text-xs text-[#A6A1CC] mt-1 mb-4">
              Be the first to host a hangout room for music, tech, or gaming!
            </p>
            <Button onClick={() => setCreateModal(true)} variant="primary" size="sm">
              Start a Room Now
            </Button>
          </div>
        ) : (
          filteredRooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoomId(r.id)}
              className="text-left rounded-3xl p-4 bg-[#1C1A3A] border border-[#363168] hover:border-[#FF5E3A] transition-all flex items-center gap-3.5 cursor-pointer shadow-sm group active:scale-98"
            >
              <div className="relative">
                <Avatar name={r.host?.name || r.host} src={r.host?.avatar_url} size={50} ring />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#1C1A3A] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="f-display font-bold text-sm text-[#F5F3FF] truncate group-hover:text-[#FF5E3A] transition-colors">
                  {r.title}
                </h4>
                <p className="f-body text-xs text-[#A6A1CC] mt-0.5">
                  Hosted by {r.host?.name || "Member"} · <span className="text-[#FFAB38] font-semibold">{r.tag}</span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="flex items-center gap-1 f-mono text-xs text-[#10B981] font-bold">
                  <Radio size={12} className="animate-pulse" /> LIVE
                </span>
                <span className="f-body text-[10px] text-[#A6A1CC] flex items-center gap-1 font-mono">
                  <Users size={11} /> {r.listeners || 1}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Host Room Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Launch Live Audio Stage 🎙️">
        <div className="flex flex-col gap-4">
          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1 font-medium">Room Title</label>
            <input
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="e.g., Late Night Chill & Anime Beats"
              className="w-full bg-[#26234D] border border-[#363168] text-sm text-[#F5F3FF] p-3.5 rounded-2xl outline-none focus:border-[#FF5E3A]"
            />
          </div>

          <div>
            <label className="f-body text-xs text-[#A6A1CC] block mb-1.5 font-medium">Topic Tag</label>
            <div className="flex flex-wrap gap-2">
              {["Music", "Tech", "Gaming", "Social", "Anime", "Cinema"].map((t) => (
                <Chip key={t} active={roomTag === t} onClick={() => setRoomTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <Button onClick={handleCreateRoom} variant="primary" fullWidth className="mt-2 py-3.5">
            Go Live Now
          </Button>
        </div>
      </Modal>
    </div>
  );
}

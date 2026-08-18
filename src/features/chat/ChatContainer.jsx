import React, { useState, useRef, useEffect } from "react";
import { Send, Gift, Phone, Video, Gamepad2, ChevronLeft, Mic, Image, MoreVertical, Flag, ShieldAlert, Check, CheckCheck } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { VoiceNoteRecorder, VoicePlayer } from "./VoiceNoteRecorder";
import { InChatGameCard } from "./InChatGameCard";
import { broadcastTyping, subscribeToTyping, markMessagesAsRead } from "../../services/messageService";
import { uploadFile } from "../../services/storageService";
import { blockUser } from "../../services/friendService";
import { fileReport } from "../../matchmaking";

export function ChatContainer({
  chats = [],
  activeChatId,
  onOpenChat,
  onBack,
  currentUser,
  onSendMessage,
  onSendGift,
  onSendGameInvite,
  onStartCall,
  onLaunchGame,
  showToast,
}) {
  const [draft, setDraft] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeChatId && currentUser?.id) {
      markMessagesAsRead(activeChatId, currentUser.id);
    }
  }, [activeChat?.messages?.length, activeChatId, currentUser]);

  useEffect(() => {
    if (!activeChatId || !currentUser?.id) return;
    const unsub = subscribeToTyping(activeChatId, (data) => {
      if (data.userId !== currentUser.id) {
        setOtherUserTyping(data.isTyping);
      }
    });
    return unsub;
  }, [activeChatId, currentUser]);

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    if (activeChatId && currentUser?.id) {
      broadcastTyping(activeChatId, currentUser.id, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(activeChatId, currentUser.id, false);
      }, 2000);
    }
  };

  const handleSendText = () => {
    if (!draft.trim()) return;
    onSendMessage(activeChat.id, draft.trim(), "text");
    setDraft("");
    if (activeChatId && currentUser?.id) {
      broadcastTyping(activeChatId, currentUser.id, false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile("chat-media", file, "chat");
      onSendMessage(activeChat.id, "📷 Image", "image", { mediaUrl: url });
      showToast("Photo sent");
    } catch (err) {
      showToast("Failed to send image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlock = async () => {
    setChatMenuOpen(false);
    if (activeChat?.otherId && currentUser?.id) {
      await blockUser(currentUser.id, activeChat.otherId);
      showToast("User blocked");
      onBack();
    }
  };

  const handleReport = async () => {
    setChatMenuOpen(false);
    if (activeChat?.otherId && currentUser?.id) {
      await fileReport(currentUser.id, activeChat.otherId, "chat", "Inappropriate chat messages");
      showToast("Conversation reported to moderation");
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 no-scrollbar">
        <h3 className="f-display font-bold text-base text-[#F5F3FF] mb-3 px-1">
          Messages ({chats.length})
        </h3>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#1C1A3A] border border-[#363168] flex items-center justify-center text-[#FF5E3A] mb-3 shadow-lg">
              💬
            </div>
            <p className="f-body text-sm font-semibold text-[#F5F3FF]">No active chats yet</p>
            <p className="f-body text-xs text-[#A6A1CC] mt-1 max-w-xs leading-relaxed">
              Match with compatible creators in the Discover tab to start conversations!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map((c) => {
              const lastMsg = c.messages?.[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => onOpenChat(c.id)}
                  className="flex items-center gap-3 p-3.5 rounded-3xl bg-[#1C1A3A] border border-[#363168] hover:bg-[#26234D] transition-colors text-left cursor-pointer shadow-sm"
                >
                  <Avatar name={c.name} size={48} online ring />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="f-display font-bold text-sm text-[#F5F3FF] truncate">{c.name}</span>
                      <span className="f-body text-[10px] text-[#A6A1CC]">
                        {lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                      </span>
                    </div>
                    <p className="f-body text-xs text-[#A6A1CC] truncate mt-0.5">
                      {lastMsg?.body || lastMsg?.text || "Connected! Say hi 👋"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0A1A]">
      {/* Top Conversation Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#363168] bg-[#13122A] z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded-full text-[#F5F3FF] hover:bg-[#26234D] cursor-pointer">
            <ChevronLeft size={22} />
          </button>
          <Avatar name={activeChat.name} size={38} online ring />
          <div>
            <h4 className="f-display font-bold text-sm text-[#F5F3FF] truncate max-w-[120px] sm:max-w-[200px]">
              {activeChat.name}
            </h4>
            <span className="f-body text-[10px] text-[#10B981] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              {otherUserTyping ? "typing…" : "Online"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => onStartCall(activeChat.name, "audio", { chatId: activeChat.id, matchId: activeChat.id })}
            className="p-2 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] cursor-pointer"
            title="Voice Call"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => onStartCall(activeChat.name, "video", { chatId: activeChat.id, matchId: activeChat.id })}
            className="p-2 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] cursor-pointer"
            title="Video Call"
          >
            <Video size={16} />
          </button>
          <button
            onClick={() => onSendGameInvite(activeChat.id, "tictactoe")}
            className="p-2 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#FFAB38] hover:text-[#FF5E3A] cursor-pointer"
            title="Challenge to Game"
          >
            <Gamepad2 size={16} />
          </button>
          <button
            onClick={() => setChatMenuOpen(!chatMenuOpen)}
            className="p-2 rounded-full text-[#A6A1CC] hover:text-[#F5F3FF] cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {chatMenuOpen && (
            <div className="absolute right-0 top-11 w-44 bg-[#26234D] border border-[#363168] rounded-2xl p-1.5 shadow-2xl z-30 pop-in">
              <button
                onClick={handleReport}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F5F3FF] hover:bg-[#363168] rounded-xl cursor-pointer"
              >
                <Flag size={14} /> Report Chat
              </button>
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
              >
                <ShieldAlert size={14} /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 no-scrollbar">
        {(activeChat.messages || []).map((m, idx) => {
          const isMe = m.from === "me" || m.sender_id === currentUser?.id;

          if (m.kind === "game_invite") {
            let invitePayload = {};
            try {
              invitePayload = typeof m.body === "string" && m.body.startsWith("{") ? JSON.parse(m.body) : {};
            } catch (err) {}

            return (
              <InChatGameCard
                key={idx}
                inviteData={{
                  title: invitePayload.title || "Tic Tac Toe",
                  icon: invitePayload.icon || "❌⭕",
                  gameId: invitePayload.gameId || m.gameId || "tictactoe",
                  sessionId: invitePayload.sessionId,
                }}
                onAccept={() => {
                  if (onLaunchGame) onLaunchGame(invitePayload.gameId || m.gameId || "tictactoe", invitePayload.sessionId);
                  showToast("Launching challenge arena! 🎮");
                }}
                onDecline={() => showToast("Challenge declined")}
              />
            );
          }

          if (m.kind === "voice" || m.kind === "voice_note") {
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <VoicePlayer url={m.media_url || m.url} duration={m.duration || 5} />
              </div>
            );
          }

          if (m.kind === "image") {
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%] rounded-2xl overflow-hidden border border-[#363168]">
                  <img src={m.media_url || m.url} alt="Shared photo" className="w-full h-auto object-cover max-h-60" />
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl f-body text-sm leading-relaxed ${
                  isMe
                    ? "bg-[#FF5E3A] text-[#0B0A1A] rounded-br-sm shadow-md font-medium"
                    : "bg-[#1C1A3A] text-[#F5F3FF] border border-[#363168] rounded-bl-sm"
                }`}
              >
                <p>{m.body || m.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-[9px] ${isMe ? "text-[#0B0A1A]/70" : "text-[#A6A1CC]"}`}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                  {isMe && (
                    <span className="text-[#0B0A1A]">
                      {m.is_read ? <CheckCheck size={12} /> : <Check size={12} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {otherUserTyping && (
        <div className="px-5 py-1 text-[11px] text-[#FFAB38] font-medium animate-pulse flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFAB38]" /> {activeChat.name} is typing…
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="p-3 border-t border-[#363168] bg-[#13122A] flex items-center gap-2 pb-safe">
        <button
          onClick={onSendGift}
          className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#FFAB38] hover:text-[#FF5E3A] cursor-pointer"
          title="Send Gift"
        >
          <Gift size={18} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] cursor-pointer"
          title="Send Photo"
        >
          <Image size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <VoiceNoteRecorder
          onSendVoiceNote={(blob, url, duration) => {
            onSendMessage(activeChat.id, "🎤 Voice note", "voice", { url, duration });
          }}
          showToast={showToast}
        />

        <input
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          placeholder="Type message…"
          className="flex-1 bg-[#1C1A3A] border border-[#363168] text-xs text-[#F5F3FF] px-4 py-2.5 rounded-full outline-none f-body focus:border-[#FF5E3A]"
        />

        <button
          onClick={handleSendText}
          disabled={!draft.trim()}
          className="p-2.5 rounded-full bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] disabled:opacity-40 transition-all cursor-pointer shadow-md"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

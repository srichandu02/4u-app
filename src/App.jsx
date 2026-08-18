import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles, Home, Users, Gamepad2, MessageCircle, User, Plus, Search, Bell, Phone, Video, Mic, MicOff, VideoOff, PhoneOff, BadgeCheck, Radio, Shield, LogOut
} from "lucide-react";
import { requestOtp, verifyOtp, createProfileIfMissing, getCurrentProfile, onAuthStateChange, signOut, deleteAccount } from "./auth";
import { tryMatch, leaveQueue, loadUserMatches, loadMessages, sendMessage as sendMessageApi, subscribeToMessages, logCall as logCallApi, fileReport } from "./matchmaking";
import { isSupabaseConfigured } from "./supabaseClient";
import { WebRTCCallSession } from "./services/callService";

// Modular Feature Imports
import { HomeFeed } from "./features/home/HomeFeed";
import { DiscoverView } from "./features/discover/DiscoverView";
import { GamesHub } from "./features/games/GamesHub";
import { ChatContainer } from "./features/chat/ChatContainer";
import { ProfileView } from "./features/profile/ProfileView";
import { RoomsContainer } from "./features/rooms/RoomsContainer";
import { CreatePostModal } from "./features/create/CreatePostModal";
import { NotificationDrawer } from "./features/notifications/NotificationDrawer";
import { SearchModal } from "./features/search/SearchModal";
import { Toast } from "./components/ui/Toast";
import { Avatar } from "./components/ui/Avatar";
import { fetchFriends } from "./services/friendService";
import { fetchLiveRooms } from "./services/roomService";

// ---------------- Onboarding Component ----------------
function Onboarding({ step, email, setEmail, otp, setOtp, name, setName, birthdate, setBirthdate, agreed, setAgreed, onRequestOtp, onVerifyOtp, error, loading }) {
  const isConfigured = isSupabaseConfigured();

  if (step === "email") {
    const handleQuickDemo = () => {
      setEmail("demo@4u.app");
      setTimeout(() => onRequestOtp(), 50);
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 py-8">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-[#FF5E3A] to-[#FFAB38] shadow-2xl border border-white/20">
          <Sparkles size={36} className="text-[#0B0A1A]" />
        </div>
        <h1 className="f-display font-black text-2xl text-[#F5F3FF] tracking-tight">Welcome to 4U</h1>
        <p className="f-body text-xs text-[#A6A1CC] max-w-xs leading-relaxed">
          The real-time social discovery platform for voice rooms, arcade games, and instant friendships.
        </p>
        {!isConfigured && (
          <div className="w-full px-3.5 py-2.5 rounded-2xl text-xs f-body bg-[#1C1A3A] text-[#FFAB38] border border-[#363168]">
            💡 Development Mode: Passwordless login enabled.
          </div>
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email.trim() && onRequestOtp()}
          placeholder="you@example.com"
          type="email"
          className="w-full f-body text-sm px-4 py-3.5 rounded-2xl outline-none text-center bg-[#1C1A3A] text-[#F5F3FF] border border-[#363168] focus:border-[#FF5E3A]"
        />
        {error && <p className="f-body text-xs text-[#FF5E3A]">{error}</p>}
        <button
          onClick={onRequestOtp}
          disabled={!email.trim() || loading}
          className="w-full py-3.5 rounded-2xl f-body font-bold text-sm bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] disabled:opacity-50 transition-all cursor-pointer shadow-lg active:scale-98"
        >
          {loading ? "Sending security code…" : "Continue with Email"}
        </button>

        {!isConfigured && (
          <button
            onClick={handleQuickDemo}
            className="w-full py-2.5 rounded-2xl f-body text-xs font-medium bg-transparent border border-[#363168] text-[#A6A1CC] hover:text-[#F5F3FF] cursor-pointer"
          >
            ⚡ Quick Demo Sign In
          </button>
        )}
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 py-8">
        <h1 className="f-display font-extrabold text-xl text-[#F5F3FF]">Verify Your Email</h1>
        <p className="f-body text-xs text-[#A6A1CC]">Enter the 6-digit confirmation code sent to {email}</p>
        {!isConfigured && (
          <p className="f-mono text-xs px-3 py-1 rounded-full bg-[#1C1A3A] text-[#FFAB38] border border-[#363168]">
            Demo Code: 123456
          </p>
        )}
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && otp.trim() && onVerifyOtp()}
          placeholder="123456"
          inputMode="numeric"
          className="w-full f-body text-xl tracking-[0.4em] px-4 py-3.5 rounded-2xl outline-none text-center bg-[#1C1A3A] text-[#F5F3FF] border border-[#363168] focus:border-[#FF5E3A]"
        />
        {error && <p className="f-body text-xs text-[#FF5E3A]">{error}</p>}
        <button
          onClick={onVerifyOtp}
          disabled={!otp.trim() || loading}
          className="w-full py-3.5 rounded-2xl f-body font-bold text-sm bg-[#FF5E3A] text-[#0B0A1A] disabled:opacity-50 transition-all cursor-pointer shadow-lg active:scale-98"
        >
          {loading ? "Verifying…" : "Confirm Code"}
        </button>
      </div>
    );
  }

  // Profile Setup
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 overflow-y-auto py-8">
      <h1 className="f-display font-extrabold text-xl text-[#F5F3FF]">Create Your Profile</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your display name"
        className="w-full f-body text-sm px-4 py-3.5 rounded-2xl outline-none text-center bg-[#1C1A3A] text-[#F5F3FF] border border-[#363168] focus:border-[#FF5E3A]"
      />

      <div className="w-full text-left">
        <label className="f-body text-xs text-[#A6A1CC] block mb-1.5 font-medium">Date of birth (18+)</label>
        <input
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          type="date"
          className="w-full f-body text-sm px-4 py-3.5 rounded-2xl outline-none bg-[#1C1A3A] text-[#F5F3FF] border border-[#363168] focus:border-[#FF5E3A]"
        />
      </div>

      <label className="w-full flex items-start gap-2 text-left cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 accent-[#FF5E3A]"
        />
        <span className="f-body text-xs text-[#A6A1CC] leading-relaxed">
          I confirm I am 18+ and accept the 4U Terms of Service & Privacy Policy.
        </span>
      </label>

      {error && <p className="f-body text-xs text-[#FF5E3A]">{error}</p>}

      <button
        onClick={() => onVerifyOtp("createProfile")}
        disabled={!name.trim() || !birthdate || !agreed || loading}
        className="w-full py-3.5 rounded-2xl f-body font-bold text-sm bg-[#FF5E3A] text-[#0B0A1A] disabled:opacity-50 cursor-pointer shadow-lg"
      >
        {loading ? "Saving profile…" : "Enter 4U"}
      </button>
    </div>
  );
}

// ---------------- Mobile Bottom Navigation ----------------
function BottomNav({ tab, setTab, onOpenCreateModal }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "discover", label: "Discover", icon: Sparkles },
    { id: "rooms", label: "Rooms", icon: Radio },
    { id: "create", label: "Create", icon: Plus, isAction: true },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="grid grid-cols-7 flex-shrink-0 z-40 bg-[#13122A] border-t border-[#363168] pb-safe sm:hidden">
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;

        if (it.isAction) {
          return (
            <button
              key={it.id}
              onClick={onOpenCreateModal}
              className="flex flex-col items-center justify-center py-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FFAB38] text-[#0B0A1A] flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <Plus size={20} strokeWidth={2.5} />
              </div>
            </button>
          );
        }

        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className="flex flex-col items-center gap-1 py-2.5 cursor-pointer"
          >
            <Icon size={18} className={active ? "text-[#FF5E3A]" : "text-[#A6A1CC]"} strokeWidth={active ? 2.4 : 1.8} />
            <span className={`f-body text-[10px] font-semibold ${active ? "text-[#FF5E3A]" : "text-[#A6A1CC]"}`}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- WebRTC Call View Overlay ----------------
function CallOverlayView({ call, seconds, camOn, setCamOn, micOn, setMicOn, endCall, localVideoRef, remoteVideoRef }) {
  const connecting = call.status === "connecting";
  const noAnswer = call.status === "noanswer";

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col f-body bg-[#0B0A1A] pop-in">
      {/* Video Streams Container if Video Call */}
      {call.type === "video" && call.status === "active" ? (
        <div className="relative flex-1 bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-gray-900">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs text-white font-mono">{fmtTime(seconds)}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative p-6">
          {connecting && (
            <>
              <div className="pulse-ring w-32 h-32" />
              <div className="pulse-ring w-32 h-32" style={{ animationDelay: "0.6s" }} />
            </>
          )}
          <Avatar name={call.name} size={110} ring />
          <div className="flex items-center gap-1.5 mt-5">
            <span className="f-display font-bold text-xl text-[#F5F3FF]">{call.name}</span>
            <BadgeCheck size={18} className="text-[#FF5E3A]" />
          </div>
          <p className="f-mono text-sm mt-2 text-[#FFAB38]">
            {noAnswer ? "No answer" : connecting ? `${call.type === "video" ? "Video" : "Voice"} calling…` : fmtTime(seconds)}
          </p>
        </div>
      )}

      {/* Call Actions */}
      <div className="flex items-center justify-center gap-4 px-6 pb-10 pt-4 bg-[#13122A] border-t border-[#363168] flex-shrink-0">
        {!noAnswer && (
          <>
            <button
              onClick={() => setMicOn((m) => !m)}
              className={`p-4 rounded-full cursor-pointer transition-colors ${micOn ? "bg-[#26234D] text-[#F5F3FF]" : "bg-[#FF5E3A] text-[#0B0A1A]"}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            {call.type === "video" && (
              <button
                onClick={() => setCamOn((c) => !c)}
                className={`p-4 rounded-full cursor-pointer transition-colors ${camOn ? "bg-[#26234D] text-[#F5F3FF]" : "bg-[#FF5E3A] text-[#0B0A1A]"}`}
              >
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            )}
          </>
        )}
        <button onClick={endCall} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white cursor-pointer shadow-lg">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

// ---------------- Main App Component ----------------
export default function App() {
  const [tab, setTab] = useState("home");
  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authStep, setAuthStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // App UI Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Matchmaking State
  const [matchState, setMatchState] = useState("idle");
  const [currentMatch, setCurrentMatch] = useState(null);
  const timeoutRef = useRef(null);

  // Chat State
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Call & WebRTC State
  const [call, setCall] = useState(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const callTimerRef = useRef(null);
  const callSessionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Side Rail Data
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentProfile();
        if (profile) hydrateFromProfile(profile);
      } catch (e) {}
      setBooting(false);
    })();

    const unsubscribe = onAuthStateChange((user) => {
      if (!user) setMe(null);
    });
    return unsubscribe;
  }, []);

  const hydrateFromProfile = async (profile) => {
    setMe(profile);
    try {
      const [matches, friends, rooms] = await Promise.all([
        loadUserMatches(profile.id),
        fetchFriends(profile.id),
        fetchLiveRooms(),
      ]);

      setOnlineFriends(friends);
      setActiveRooms(rooms);

      const withMessages = await Promise.all(
        matches.map(async (m) => {
          const msgs = await loadMessages(m.matchId);
          return {
            id: m.matchId,
            otherId: m.otherId,
            name: m.otherName,
            messages: msgs.map((row) => ({
              from: row.sender_id === profile.id ? "me" : "them",
              text: row.body,
              kind: row.kind,
              mediaUrl: row.media_url,
              created_at: row.created_at,
              is_read: row.is_read,
            })),
          };
        })
      );
      setChats(withMessages);
    } catch (e) {}
  };

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 1800);
  };

  const handleRequestOtp = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      await requestOtp(email.trim());
      setAuthStep("otp");
    } catch (e) {
      setAuthError(e.message || "Couldn't send code, try again");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (mode) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (mode === "createProfile") {
        if (!agreed) { setAuthError("Please confirm you're 18+ and agree to the Terms."); setAuthLoading(false); return; }
        const profile = await createProfileIfMissing({ name: nameDraft.trim(), age: 24 });
        await hydrateFromProfile(profile);
        showToast(`Welcome to 4U, ${profile.name} 👋`);
        return;
      }
      await verifyOtp(email.trim(), otp.trim());
      const existing = await getCurrentProfile();
      if (existing) {
        await hydrateFromProfile(existing);
        showToast(`Welcome back, ${existing.name} 👋`);
      } else {
        setAuthStep("name");
      }
    } catch (e) {
      setAuthError(e.message || "Invalid code, try again");
    } finally {
      setAuthLoading(false);
    }
  };

  // Matchmaking
  const startSearch = async () => {
    if (!me) return;
    setMatchState("searching");
    try {
      const result = await tryMatch(me.id, ["Music", "Gaming"]);
      if (result && result.profile) {
        setCurrentMatch({
          id: result.profile.id, matchId: result.matchId, name: result.profile.name,
          age: result.profile.age, city: result.profile.city, bio: result.profile.bio,
          verified: result.profile.verified, tags: result.profile.interests || [],
        });
        setMatchState("found");
        return;
      }
    } catch (e) {}

    timeoutRef.current = setTimeout(() => {
      setCurrentMatch({
        id: "p1", name: "Aisha", age: 24, city: "Mumbai", bio: "Rooftop playlists & gaming 🎧✨", verified: true, tags: ["Music", "Gaming"],
      });
      setMatchState("found");
    }, 3000);
  };

  const connectMatch = () => {
    if (!currentMatch) return;
    const chatId = currentMatch.matchId || currentMatch.id;
    setChats((prev) => {
      if (prev.find((c) => c.id === chatId)) return prev;
      return [...prev, { id: chatId, otherId: currentMatch.id, name: currentMatch.name, messages: [{ from: "them", text: "Hey! Glad we connected on 4U 👋" }] }];
    });
    setActiveChatId(chatId);
    setTab("chat");
    setCurrentMatch(null);
    setMatchState("idle");
    showToast("Connected! Say hi 👋");
  };

  // WebRTC Call Initiation
  const startCall = async (name, type, ref = {}) => {
    setCall({ name, type, status: "connecting", ...ref });
    setCallSeconds(0);

    const matchId = ref.matchId || ref.chatId;
    if (matchId && me) {
      const session = new WebRTCCallSession({
        matchId,
        currentUserId: me.id,
        callType: type,
        onRemoteStream: (stream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        },
        onCallEnd: () => endCall(),
      });
      callSessionRef.current = session;
      const localStream = await session.startCall();
      if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }

    callTimerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    setCall((c) => (c ? { ...c, status: "active" } : null));
  };

  const endCall = () => {
    clearInterval(callTimerRef.current);
    if (callSessionRef.current) {
      callSessionRef.current.endCall();
      callSessionRef.current = null;
    }
    setCall(null);
    setCallSeconds(0);
  };

  const handleSendMessage = async (chatId, text, kind = "text", extra = {}) => {
    setChats((cs) =>
      cs.map((c) => (c.id === chatId ? { ...c, messages: [...(c.messages || []), { from: "me", text, kind, ...extra, created_at: new Date().toISOString() }] } : c))
    );
    if (me?.id) {
      await sendMessageApi(chatId, me.id, text, kind, extra.mediaUrl);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070612] text-[#F5F3FF]">
      {booting ? (
        <div className="flex items-center justify-center">
          <Sparkles size={36} className="text-[#FF5E3A] animate-spin" />
        </div>
      ) : !me ? (
        <div className="w-full sm:max-w-md bg-[#0B0A1A] sm:rounded-3xl border border-[#363168] shadow-2xl min-h-[540px] flex flex-col">
          <Onboarding
            step={authStep}
            email={email}
            setEmail={setEmail}
            otp={otp}
            setOtp={setOtp}
            name={nameDraft}
            setName={setNameDraft}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            agreed={agreed}
            setAgreed={setAgreed}
            onRequestOtp={handleRequestOtp}
            onVerifyOtp={handleVerifyOtp}
            error={authError}
            loading={authLoading}
          />
        </div>
      ) : (
        <div className="w-full h-[100dvh] flex max-w-7xl mx-auto overflow-hidden">
          {/* Desktop Left Sidebar */}
          <aside className="hidden md:flex flex-col w-64 p-5 bg-[#13122A] border-r border-[#363168] justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5E3A] to-[#FFAB38] flex items-center justify-center text-[#0B0A1A] font-black shadow-lg">
                  4U
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">4U Discovery</span>
              </div>

              <nav className="flex flex-col gap-1.5">
                {[
                  { id: "home", label: "Home Feed", icon: Home },
                  { id: "discover", label: "Discover People", icon: Sparkles },
                  { id: "rooms", label: "Audio Rooms", icon: Radio },
                  { id: "games", label: "Arcade Games", icon: Gamepad2 },
                  { id: "chat", label: "Messages", icon: MessageCircle },
                  { id: "profile", label: "My Profile", icon: User },
                ].map((it) => {
                  const Icon = it.icon;
                  const active = tab === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => { setActiveChatId(null); setTab(it.id); }}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-[#FF5E3A] text-[#0B0A1A] shadow-md font-bold"
                          : "text-[#A6A1CC] hover:text-white hover:bg-[#1C1A3A]"
                      }`}
                    >
                      <Icon size={19} />
                      {it.label}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5E3A] to-[#FFAB38] hover:opacity-95 text-[#0B0A1A] font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-98"
              >
                <Plus size={18} strokeWidth={2.5} /> Create Post
              </button>
            </div>

            {/* Desktop User Footer */}
            <div className="flex items-center justify-between p-3 bg-[#1C1A3A] rounded-2xl border border-[#363168]">
              <div className="flex items-center gap-2.5">
                <Avatar name={me.name} src={me.avatar_url} size={36} ring />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{me.name}</span>
                  <span className="text-[10px] text-[#FFAB38] font-mono">{me.coins || 240} 🪙</span>
                </div>
              </div>
              <button
                onClick={async () => { await signOut(); setMe(null); setAuthStep("email"); }}
                className="p-1.5 text-[#A6A1CC] hover:text-red-400 cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </aside>

          {/* Central Main Mobile/Tablet Container */}
          <main className="flex-1 flex flex-col relative max-w-xl mx-auto border-x border-[#363168] bg-[#0B0A1A] h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-[#363168] bg-[#13122A] z-20 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="f-display font-black text-xl text-white tracking-tight sm:hidden">4U</span>
                <span className="f-mono text-xs px-2.5 py-1 rounded-full bg-[#FF5E3A]/20 text-[#FFAB38] font-bold border border-[#FF5E3A]/40">
                  {me.coins || 240} 🪙
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-white cursor-pointer"
                >
                  <Search size={17} />
                </button>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="p-2.5 rounded-full bg-[#1C1A3A] border border-[#363168] text-[#A6A1CC] hover:text-white relative cursor-pointer"
                >
                  <Bell size={17} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FF5E3A] border-2 border-[#13122A]" />
                </button>
              </div>
            </header>

            {/* Routed Screens */}
            {tab === "home" && <HomeFeed currentUser={me} showToast={showToast} />}
            {tab === "discover" && (
              <DiscoverView
                currentUser={me}
                matchState={matchState}
                startSearch={startSearch}
                currentMatch={currentMatch}
                passMatch={() => { setCurrentMatch(null); setMatchState("idle"); }}
                connectMatch={connectMatch}
                startCall={startCall}
                onOpenChat={(person) => {
                  setChats((prev) => [...prev, { id: person.id, otherId: person.id, name: person.name, messages: [] }]);
                  setActiveChatId(person.id);
                  setTab("chat");
                }}
                onJoinRoom={(room) => {
                  setTab("rooms");
                }}
                onStartGame={(gameId) => {
                  setTab("games");
                }}
                showToast={showToast}
              />
            )}
            {tab === "rooms" && <RoomsContainer currentUser={me} showToast={showToast} />}
            {tab === "games" && <GamesHub currentUser={me} showToast={showToast} />}
            {tab === "chat" && (
              <ChatContainer
                chats={chats}
                activeChatId={activeChatId}
                onOpenChat={(id) => setActiveChatId(id)}
                onBack={() => setActiveChatId(null)}
                currentUser={me}
                onSendMessage={handleSendMessage}
                onSendGift={() => showToast("Sent gift! 🎁")}
                onSendGameInvite={(chatId, gameId) => {
                  const invitePayload = JSON.stringify({ title: "Tic Tac Toe", icon: "❌⭕", gameId: "tictactoe" });
                  handleSendMessage(chatId, invitePayload, "game_invite");
                  showToast("Challenge sent! 🎮");
                }}
                onStartCall={startCall}
                onLaunchGame={(gameId) => setTab("games")}
                showToast={showToast}
              />
            )}
            {tab === "profile" && (
              <ProfileView
                user={me}
                onSignOut={async () => { await signOut(); setMe(null); setAuthStep("email"); }}
                onDeleteAccount={async () => { await deleteAccount(); setMe(null); setAuthStep("email"); }}
                showToast={showToast}
              />
            )}

            {/* Mobile Bottom Navigation */}
            <BottomNav
              tab={tab}
              setTab={(t) => { setActiveChatId(null); setTab(t); }}
              onOpenCreateModal={() => setCreateModalOpen(true)}
            />

            {/* Call Overlay */}
            {call && (
              <CallOverlayView
                call={call}
                seconds={callSeconds}
                camOn={camOn}
                setCamOn={setCamOn}
                micOn={micOn}
                setMicOn={setMicOn}
                endCall={endCall}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
              />
            )}
          </main>

          {/* Desktop Right Activity Rail */}
          <aside className="hidden lg:flex flex-col w-72 p-5 bg-[#13122A] border-l border-[#363168] gap-6 overflow-y-auto no-scrollbar">
            {/* Friends Activity */}
            <div>
              <h3 className="font-bold text-sm text-white mb-3 flex items-center justify-between">
                <span>Online Friends</span>
                <span className="text-xs text-[#10B981] font-mono">● {onlineFriends.length}</span>
              </h3>
              {onlineFriends.length === 0 ? (
                <p className="text-xs text-[#A6A1CC]">No friends active right now.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {onlineFriends.slice(0, 5).map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2.5 bg-[#1C1A3A] rounded-2xl border border-[#363168]">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={f.name} src={f.avatar_url} size={32} online />
                        <span className="text-xs font-semibold text-white truncate max-w-[100px]">{f.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setChats((prev) => [...prev, { id: f.id, otherId: f.id, name: f.name, messages: [] }]);
                          setActiveChatId(f.id);
                          setTab("chat");
                        }}
                        className="p-1.5 rounded-full bg-[#26234D] text-[#FF5E3A] hover:bg-[#363168] cursor-pointer"
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Audio Rooms */}
            <div>
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Radio size={16} className="text-[#FF5E3A]" /> Live Audio Hangouts
              </h3>
              {activeRooms.length === 0 ? (
                <p className="text-xs text-[#A6A1CC]">No active audio rooms.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeRooms.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setTab("rooms")}
                      className="p-3 bg-[#1C1A3A] hover:bg-[#26234D] rounded-2xl border border-[#363168] cursor-pointer transition-colors"
                    >
                      <h4 className="text-xs font-bold text-white truncate">{r.title}</h4>
                      <p className="text-[10px] text-[#A6A1CC] mt-1">Topic: <span className="text-[#FFAB38]">{r.tag}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Global Modals */}
          <CreatePostModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            currentUserId={me.id}
            showToast={showToast}
          />
          <NotificationDrawer
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            currentUserId={me.id}
          />
          <SearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectUser={(u) => {
              setChats((prev) => [...prev, { id: u.id, otherId: u.id, name: u.name, messages: [] }]);
              setActiveChatId(u.id);
              setTab("chat");
            }}
            showToast={showToast}
          />
          <Toast text={toast} />
        </div>
      )}
    </div>
  );
}

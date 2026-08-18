import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { sendChatMessage } from "./messageService";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export async function logCallRecord(matchId, callerId, callType, status, durationSeconds) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("call_logs").insert({
      match_id: matchId,
      caller_id: callerId,
      call_type: callType,
      status,
      duration_seconds: durationSeconds,
    });

    const icon = callType === "video" ? "📹" : "📞";
    const durStr = `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`;
    const text = status === "no_answer" ? `${icon} Missed call` : `${icon} ${callType === "video" ? "Video" : "Voice"} call · ${durStr}`;
    await sendChatMessage(matchId, callerId, text, "call_log");
  } catch (e) {
    console.warn("Call log record error:", e);
  }
}

/**
 * WebRTC P2P Call Session Controller
 */
export class WebRTCCallSession {
  constructor({ matchId, isInitiator, callType = "audio", onRemoteStream, onConnectionStateChange, onSignalError }) {
    this.matchId = matchId;
    this.isInitiator = isInitiator;
    this.callType = callType;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onSignalError = onSignalError;

    this.peerConnection = null;
    this.localStream = null;
    this.channel = null;
    this.closed = false;
  }

  async start() {
    try {
      // 1. Get user media
      const constraints = {
        audio: true,
        video: this.callType === "video" ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
      };

      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Media devices error or denied, falling back to audio only if video requested:", err);
        if (this.callType === "video") {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw err;
        }
      }

      // 2. Initialize RTCPeerConnection
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote track
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.onRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE Candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.channel) {
          this.channel.send({
            type: "broadcast",
            event: "signal",
            payload: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection) {
          this.onConnectionStateChange(this.peerConnection.connectionState);
        }
      };

      // 3. Connect Supabase Signaling Channel
      if (isSupabaseConfigured()) {
        this.channel = supabase.channel(`call-signaling-${this.matchId}`);

        this.channel.on("broadcast", { event: "signal" }, async (payload) => {
          await this.handleIncomingSignal(payload.payload);
        });

        this.channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && this.isInitiator) {
            await this.createAndSendOffer();
          }
        });
      }

      return this.localStream;
    } catch (e) {
      if (this.onSignalError) this.onSignalError(e);
      return null;
    }
  }

  async createAndSendOffer() {
    if (!this.peerConnection || this.closed) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      if (this.channel) {
        this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "offer", sdp: offer },
        });
      }
    } catch (e) {
      console.warn("Error creating offer:", e);
    }
  }

  async handleIncomingSignal(signal) {
    if (!this.peerConnection || this.closed || !signal) return;

    try {
      if (signal.type === "offer" && !this.isInitiator) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        if (this.channel) {
          this.channel.send({
            type: "broadcast",
            event: "signal",
            payload: { type: "answer", sdp: answer },
          });
        }
      } else if (signal.type === "answer" && this.isInitiator) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === "candidate") {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.warn("Error adding ICE candidate:", err);
        }
      }
    } catch (e) {
      console.warn("Signal handling error:", e);
    }
  }

  setAudioEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  setVideoEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  end() {
    this.closed = true;
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

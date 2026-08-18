import React, { useState, useRef } from "react";
import { Mic, Square, Send, Play, Pause } from "lucide-react";

export function VoiceNoteRecorder({ onSendVoiceNote, showToast }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      if (showToast) showToast("Microphone permission denied or not supported");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob && onSendVoiceNote) {
      onSendVoiceNote(audioBlob, audioUrl, recordingTime);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    }
  };

  if (recording) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#7A3B2E]/40 border border-[#FF6B4A] rounded-full w-full">
        <span className="w-3 h-3 rounded-full bg-[#FF6B4A] animate-ping" />
        <span className="f-mono text-xs font-bold text-[#FFB84D]">
          Recording 0:{String(recordingTime).padStart(2, "0")}
        </span>
        <button
          onClick={stopRecording}
          className="ml-auto p-2 bg-[#FF6B4A] text-[#100F26] rounded-full"
        >
          <Square size={14} />
        </button>
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-[#252152] border border-[#38316E] rounded-full w-full">
        <audio src={audioUrl} controls className="h-8 flex-1" />
        <button
          onClick={handleSend}
          className="p-2.5 bg-[#FF6B4A] text-[#100F26] rounded-full"
        >
          <Send size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="p-2.5 rounded-full bg-[#2E2966] text-[#A6A1CC] hover:text-[#FF6B4A] transition-colors"
      title="Record Voice Note"
    >
      <Mic size={18} />
    </button>
  );
}

export function VoicePlayer({ url, duration = 0 }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-[#1B1A3B] rounded-2xl border border-[#38316E] min-w-[180px]">
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-[#FF6B4A] text-[#100F26]"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <div className="flex-1 flex flex-col">
        <div className="h-1.5 bg-[#38316E] rounded-full overflow-hidden w-full">
          <div className={`h-full bg-[#FFB84D] ${playing ? "w-full transition-all duration-3000" : "w-1/3"}`} />
        </div>
        <span className="f-mono text-[10px] text-[#A6A1CC] mt-1">
          Voice note · {duration ? `${duration}s` : "0:05"}
        </span>
      </div>
    </div>
  );
}

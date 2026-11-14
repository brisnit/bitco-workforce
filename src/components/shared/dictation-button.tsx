"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/* Minimal typings for the (non-standard) Web Speech API. */
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
function useSpeechSupported() {
  return useSyncExternalStore(noop, () => !!getCtor(), () => false);
}

/**
 * Optional voice-to-text. Only rendered as active when the browser actually
 * supports speech recognition; otherwise it says so plainly. Typing always works.
 */
export function DictationButton({
  onTranscript,
  size = "md",
}: {
  onTranscript: (text: string) => void;
  size?: "md" | "lg";
}) {
  const supported = useSpeechSupported();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recRef.current?.stop(), []);

  if (!supported) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <MicOff className="size-3.5" /> Voice input isn&apos;t supported in this browser — type your update instead.
      </p>
    );
  }

  function start() {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text.trim()) onTranscript(text.trim());
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone permission was denied. You can still type."
          : "Didn't catch that. Try again or type your update.",
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Couldn't start voice input. Please type instead.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => (listening ? recRef.current?.stop() : start())}
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-lg border font-semibold transition",
          size === "lg" ? "h-12 px-4 text-base" : "h-9 px-3 text-sm",
          listening ? "border-red-300 bg-red-50 text-red-700" : "border-steel-200 bg-white text-navy hover:border-navy",
        )}
        aria-pressed={listening}
      >
        {listening ? (
          <>
            <Square className="size-4 fill-current" /> Listening… tap to stop
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
          </>
        ) : (
          <>
            <Mic className="size-4" /> Speak instead
          </>
        )}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

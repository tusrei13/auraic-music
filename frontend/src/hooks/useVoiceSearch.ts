import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: string, listener: (event: SpeechRecognitionEvent | SpeechRecognitionErrorEvent) => void): void;
  removeEventListener(type: string, listener: (event: SpeechRecognitionEvent | SpeechRecognitionErrorEvent) => void): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onsoundend?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onaudioend?: (() => void) | null;
  onnomatch: (() => void) | null;
  onend: (() => void) | null;
}

export type SpeechRecognitionState = "idle" | "listening" | "unsupported" | "error";

export interface UseVoiceSearchResult {
  isListening: boolean;
  transcript: string;
  state: SpeechRecognitionState;
  errorMessage: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

function getSpeechRecognition(): { new (): SpeechRecognitionInstance } | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    (window as unknown as { webkitSpeechRecognition?: { new (): SpeechRecognitionInstance } }).webkitSpeechRecognition ||
    (window as unknown as { SpeechRecognition?: { new (): SpeechRecognitionInstance } }).SpeechRecognition ||
    undefined
  );
}

export function extractTranscript(results: ArrayLike<{ isFinal: boolean; [index: number]: { transcript: string } }>): {
  transcript: string;
  hasFinal: boolean;
} {
  let finalTranscript = "";
  let interimTranscript = "";
  let hasFinal = false;

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item.isFinal) {
      finalTranscript += item[0].transcript;
      hasFinal = true;
    } else {
      interimTranscript += item[0].transcript;
    }
  }

  return {
    transcript: (finalTranscript + interimTranscript).trim(),
    hasFinal,
  };
}

export function useVoiceSearch(language = "vi-VN"): UseVoiceSearchResult {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const currentTranscriptRef = useRef("");
  const isFinishingRef = useRef(false);

  // Timers
  const maxSessionTimeoutRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const noSpeechTimeoutRef = useRef<number | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearAllTimers = useCallback(() => {
    if (maxSessionTimeoutRef.current !== null) {
      window.clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (noSpeechTimeoutRef.current !== null) {
      window.clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
  }, []);

  // Check support on mount
  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setState("unsupported");
    }
  }, []);

  // Gracefully request recognition to stop and flush final words
  const finishRecognition = useCallback(() => {
    if (isFinishingRef.current || !recognitionRef.current) return;
    isFinishingRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      // If stop fails, abort to ensure release
      try {
        recognitionRef.current.abort();
      } catch {}
    }
  }, []);

  // Explicit user cancel / toggle off
  const stop = useCallback(() => {
    clearAllTimers();
    isFinishingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setState((curr) => (curr === "unsupported" ? "unsupported" : "idle"));
  }, [clearAllTimers]);

  const start = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setState("unsupported");
      return;
    }

    // Abort existing instance cleanly before launching a new one
    clearAllTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    setErrorMessage(null);
    currentTranscriptRef.current = "";
    setTranscript("");
    isFinishingRef.current = false;

    const recognition = new Recognition();
    // Use continuous = true so Chromium streams interim results in real-time as words are spoken
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setState("listening");

      // Safety ceiling: Search voice queries should never exceed 6 seconds
      maxSessionTimeoutRef.current = window.setTimeout(() => {
        if (isListeningRef.current) {
          finishRecognition();
        }
      }, 6_000);

      // No-speech watchdog: If no sound/result after 4.5 seconds, finish
      noSpeechTimeoutRef.current = window.setTimeout(() => {
        if (isListeningRef.current && !currentTranscriptRef.current) {
          finishRecognition();
        }
      }, 4_500);
    };

    recognition.onsoundstart = () => {
      // Sound detected - clear no speech watchdog
      if (noSpeechTimeoutRef.current !== null) {
        window.clearTimeout(noSpeechTimeoutRef.current);
        noSpeechTimeoutRef.current = null;
      }
    };

    recognition.onspeechstart = () => {
      if (noSpeechTimeoutRef.current !== null) {
        window.clearTimeout(noSpeechTimeoutRef.current);
        noSpeechTimeoutRef.current = null;
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Clear no-speech timer since words are arriving
      if (noSpeechTimeoutRef.current !== null) {
        window.clearTimeout(noSpeechTimeoutRef.current);
        noSpeechTimeoutRef.current = null;
      }

      const { transcript: recognizedText, hasFinal } = extractTranscript(event.results);

      if (recognizedText) {
        currentTranscriptRef.current = recognizedText;
        setTranscript(recognizedText);
      }

      // Reset silence timer
      if (silenceTimeoutRef.current !== null) {
        window.clearTimeout(silenceTimeoutRef.current);
      }

      if (hasFinal) {
        // A complete final chunk arrived: finish promptly after 400ms
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isListeningRef.current) {
            finishRecognition();
          }
        }, 400);
      } else {
        // Still interim: allow 1.2s pause before automatically concluding speech
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isListeningRef.current) {
            finishRecognition();
          }
        }, 1_200);
      }
    };

    recognition.onspeechend = () => {
      // Speech detector signaled speech ended: finish after brief 300ms cushion
      if (silenceTimeoutRef.current !== null) {
        window.clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = window.setTimeout(() => {
        if (isListeningRef.current) {
          finishRecognition();
        }
      }, 300);
    };

    recognition.onsoundend = () => {
      if (currentTranscriptRef.current) {
        if (silenceTimeoutRef.current !== null) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isListeningRef.current) {
            finishRecognition();
          }
        }, 300);
      }
    };

    recognition.onnomatch = () => {
      setErrorMessage("Không nhận diện được giọng nói, hãy thử lại");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearAllTimers();
      isListeningRef.current = false;
      setIsListening(false);
      setState("error");

      const errorMessages: Record<string, string> = {
        "audio-capture": "Không tìm thấy micro trên thiết bị",
        network: "Không thể kết nối dịch vụ giọng nói, vui lòng kiểm tra mạng",
        "no-speech": "Không nghe thấy giọng nói, hãy thử lại",
        "not-allowed": "Vui lòng cho phép quyền truy cập micro trong trình duyệt",
        "service-not-allowed": "Trình duyệt chưa hỗ trợ dịch vụ nhận diện giọng nói",
        aborted: "Đã dừng tìm kiếm bằng giọng nói",
      };

      if (event.error !== "aborted") {
        setErrorMessage(errorMessages[event.error] || "Lỗi nhận diện giọng nói, hãy thử lại");
      }
    };

    recognition.onend = () => {
      clearAllTimers();
      isListeningRef.current = false;
      setIsListening(false);

      const finalPhrase = currentTranscriptRef.current.trim();
      if (finalPhrase) {
        setTranscript(finalPhrase);
      } else if (!errorMessage) {
        setErrorMessage("Không nghe rõ giọng nói, hãy thử lại");
      }

      setState((current) => (current === "listening" ? "idle" : current));
      recognitionRef.current = null;
      isFinishingRef.current = false;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      clearAllTimers();
      isListeningRef.current = false;
      setIsListening(false);
      setState("error");
      setErrorMessage("Không thể bật micro, vui lòng kiểm tra quyền thiết bị");
      recognitionRef.current = null;
    }
  }, [clearAllTimers, errorMessage, finishRecognition, language]);

  const toggle = useCallback(() => {
    if (isListeningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [clearAllTimers]);

  return {
    isListening,
    transcript,
    state,
    errorMessage,
    start,
    stop,
    toggle,
  };
}

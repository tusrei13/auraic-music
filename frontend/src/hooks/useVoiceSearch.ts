import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
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
  onend: (() => void) | null;
}

type SpeechRecognitionState = "idle" | "listening" | "unsupported" | "error";

interface UseVoiceSearchResult {
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
  return (window as unknown as { SpeechRecognition?: { new (): SpeechRecognitionInstance }; webkitSpeechRecognition?: { new (): SpeechRecognitionInstance } }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: { new (): SpeechRecognitionInstance } }).webkitSpeechRecognition || undefined;
}

export function useVoiceSearch(language = "vi-VN"): UseVoiceSearchResult {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setState("unsupported");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = 0; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        setIsListening(false);
        setState("idle");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setState("error");
      setErrorMessage(event.error === "not-allowed" ? "Không có quyền truy cập micro" : event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setState((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [language]);

  const start = () => {
    if (!recognitionRef.current || isListening) return;
    setErrorMessage(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
      setState("listening");
    } catch (error) {
      setState("error");
      setErrorMessage((error as Error).message);
    }
  };

  const stop = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setState("idle");
  };

  const toggle = () => {
    if (isListening) stop();
    else start();
  };

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

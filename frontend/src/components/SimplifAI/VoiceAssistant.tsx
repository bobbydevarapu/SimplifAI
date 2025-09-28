import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VoiceAssistantProps {
  onBack?: () => void;
  onClose?: () => void;
}

export function VoiceAssistant({ onBack, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const blossomTimerRef = useRef<number | null>(null);
  const [blossomState, setBlossomState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [assistantReply, setAssistantReply] = useState<string | null>(null);

  // action buttons and personas removed as requested

  const startBlossomOpen = () => {
    // immediately set to open (stable rotating state)
    setBlossomState("open");
  };

  const startBlossomClose = () => {
    // immediately close the blossom
    setBlossomState("closed");
  };

  const stopAll = () => {
    setIsListening(false);
    setIsRecording(false);
    setAssistantReply(null);
    // stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    // stop recognition
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (e) {
      // ignore
    }
    // stop speech
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    startBlossomClose();
  };

  const startListening = async () => {
    try {
      // check microphone permission state first (granted / prompt / denied)
      let permState: PermissionState | 'prompt' = 'prompt';
      try {
        if (navigator.permissions && (navigator.permissions as any).query) {
          // some TS helpers
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const p = await navigator.permissions.query({ name: 'microphone' });
          permState = p.state as PermissionState;
        }
      } catch (e) {
        permState = 'prompt';
      }

      if (permState === 'denied') {
        // user blocked access in browser settings
        setPermissionDenied(true);
        setIsListening(false);
        setIsRecording(false);
        startBlossomClose();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setPermissionDenied(false);
      setIsListening(true);
      setIsRecording(true);
      startBlossomOpen();

      // Setup Web Speech API recognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.lang = "en-US";
        recog.interimResults = false;
        recog.maxAlternatives = 1;
        recog.continuous = true;
        recog.onresult = (ev: any) => {
          const text = ev.results[ev.results.length - 1][0].transcript;
          setTranscript(text);
          // pause recognition while processing / speaking
          try {
            recog.onresult = null;
            recog.stop();
          } catch (e) {}

          // process the transcript (try backend, fallback to placeholder)
          (async () => {
            let reply = '';
            try {
              const res = await fetch('/api/voice-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
              });
              if (res.ok) {
                const body = await res.json();
                reply = body.reply || body.text || `I heard: ${text}`;
              } else {
                reply = `I heard: ${text}`;
              }
            } catch (e) {
              // no backend available yet — provide a fallback reply
              reply = `I heard: ${text}`;
            }

            setAssistantReply(reply);
            try {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(reply);
              u.lang = recog.lang || 'en-US';
              u.onend = () => {
                // restart recognition if still listening
                if (isListening) {
                  try {
                    recog.onresult = (ev2: any) => {
                      const t2 = ev2.results[ev2.results.length - 1][0].transcript;
                      setTranscript(t2);
                      // this will be handled in same flow
                    };
                    recog.start();
                  } catch (e) {
                    console.warn('failed to restart recognition', e);
                  }
                }
              };
              window.speechSynthesis.speak(u);
            } catch (err) {
              console.warn('speech synthesis failed', err);
              // try to restart recognition even if TTS failed
              try {
                if (isListening) recog.start();
              } catch (e) {}
            }
          })();
        };
        recog.onend = () => {
          // If recognition ends unexpectedly while still listening, try to restart
          if (isListening) {
            try {
              recog.start();
            } catch (e) {
              // ignore
            }
          }
        };
        recog.onerror = (e: any) => {
          console.warn("recognition error", e);
        };
        recognitionRef.current = recog;
        try {
          recog.start();
        } catch (e) {
          console.warn('recognition start failed', e);
        }
      }
    } catch (err) {
      console.warn("Microphone permission denied or unavailable", err);
      setPermissionDenied(true);
      setIsListening(false);
      setIsRecording(false);
      startBlossomClose();
    }
  };

  const stopListening = () => {
    stopAll();
  };

  const toggleListening = () => {
    if (!isListening) startListening();
    else stopListening();
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopAll();
      if (blossomTimerRef.current) window.clearTimeout(blossomTimerRef.current);
    };
  }, []);

  // insert small runtime styles for rotation (scoped)
  useEffect(() => {
    const id = 'va-rotation-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.innerHTML = `
        @keyframes va-rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-rotate-slow { animation: va-rotate-slow 1.8s linear infinite; transform-origin: center; will-change: transform; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-8 relative">
      {/* Listening overlay (full-screen) */}
      {isListening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-50 flex flex-col items-center gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full bg-white/5 animate-pulse" />
              <div className="absolute -inset-6 rounded-full border border-white/10 opacity-60 animate-[pulse_1.8s_infinite]" />
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center">
                <img src="/src/assets/DashboardLogo.png" alt="logo" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="text-center text-muted-foreground">
              <div className="text-sm text-white/90">You may start speaking</div>
            </div>
          </div>
        </div>
      )}
      {/* Logo with blossom rings */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-14 h-14">
            {/* Rotating ring when open */}
            <div
              className={`absolute -inset-1 rounded-full border border-white/10 ${
                blossomState === 'open' ? 'opacity-90 animate-rotate-slow' : 'opacity-0'
              }`}
            />

            <div className={`relative z-10 rounded-full overflow-hidden flex items-center justify-center bg-card transition-all duration-300 ${
              blossomState === 'open' ? 'w-20 h-20' : 'w-14 h-14'
            }`}>
              <img src="/src/assets/DashboardLogo.png" alt="Dashboard logo" className={`object-contain transition-all duration-300 ${blossomState === 'open' ? 'w-16 h-16 animate-rotate-slow' : 'w-12 h-12'}`} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">SimplifAI</h1>
        </div>

        {/* Assistant reply display when speaking */}
        {assistantReply && (
          <div className="mt-2 text-sm text-muted-foreground">
            <div className="inline-block px-3 py-1 bg-card border border-border rounded-md">{assistantReply}</div>
          </div>
        )}
      </div>

      {/* Action buttons removed per user request */}

      {/* Voice Interface */}
      <div className="space-y-6">
        {/* Transcript Area */}
        {transcript && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
        )}

        {/* Voice Input */}
        <div className="relative">
          <div className="h-16 bg-card border border-border rounded-2xl flex items-center px-6">
            <span className="flex-1 text-muted-foreground">
              {isListening ? "Listening..." : "Tap to speak"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Auto</Badge>
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "ghost"}
                className={`h-8 w-8 p-0 ${isRecording ? 'animate-pulse' : ''}`}
                onClick={toggleListening}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className={`w-16 h-16 rounded-full ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={toggleListening}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isListening 
              ? "Listening for your voice..." 
              : "Tap the microphone to start speaking"
            }
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Voice assistant powered by SimplifAI</p>
      </div>
      {/* Close handled by surrounding dialog when present */}
    </div>
  );
}
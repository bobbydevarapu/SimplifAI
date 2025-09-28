import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Image, Mic, Newspaper, Paperclip, Search, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MainContentProps {
  onSearchClick?: () => void;
  onVoiceClick?: () => void;
}

export function MainContent({ onSearchClick, onVoiceClick }: MainContentProps) {
  const [query, setQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  // allow very large inputs (practical upper bound)
  const maxChars = 100000;

  // Attachments state
  const [attachments, setAttachments] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mobileAtMax, setMobileAtMax] = useState(false);

  // Adjust textarea height to its content up to a max (half viewport or 600px)
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    try {
      el.style.height = 'auto'
      const max = Math.min(window.innerHeight * 0.5, 600)
      const newH = Math.min(el.scrollHeight, max)
      el.style.height = `${newH}px`
      // make textarea scroll when it reaches max instead of growing past it
      el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
      // if this is the mobile textarea, set a flag so we can hide icons when at max
      if (el === mobileTextareaRef.current) {
        setMobileAtMax(el.scrollHeight > max)
      }
    } catch (e) {
      // ignore in SSR or weird env
    }
  }

  const actionButtons = [
    { label: "DeepSearch", icon: <Search className="w-5 h-5 mr-2" />, onClick: onSearchClick },
    { label: "Create Images", icon: <Image className="w-5 h-5 mr-2" /> },
    { label: "Latest News", icon: <Newspaper className="w-5 h-5 mr-2" /> },
  ];
  const isMobile = useIsMobile();
  const canSend = chatInput.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    return () => {
      // revoke object urls
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
    }
  }, [attachments])

  // adjust when input changes or on mount
  useEffect(() => {
    adjustHeight(desktopTextareaRef.current)
    adjustHeight(mobileTextareaRef.current)
  }, [chatInput, isMobile])

  // listen for global 'open-ask' events (dispatched by sidebar) to open a fresh chat
  useEffect(() => {
    const handler = () => {
      setChatInput('');
      setAttachments([]);
      // focus the proper textarea after a tick
      setTimeout(() => {
        try {
          const el = isMobile ? mobileTextareaRef.current : desktopTextareaRef.current;
          el?.focus();
          adjustHeight(el);
        } catch (e) {}
      }, 50);
    };
    window.addEventListener('open-ask', handler as EventListener);
    return () => window.removeEventListener('open-ask', handler as EventListener);
  }, [isMobile]);

  function fmtCount(n: number) {
    if (n < 1000) return String(n)
    if (n < 1000000) return `${(n/1000).toFixed(1)}k`
    return `${(n/1000000).toFixed(1)}M`
  }

  function onFilesSelected(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).map((f) => ({ id: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()), url: URL.createObjectURL(f), name: f.name }))
    setAttachments((s) => [...s, ...arr])
  }

  function removeAttachment(id: string) {
    setAttachments((s) => {
      const found = s.find((a) => a.id === id)
      if (found) URL.revokeObjectURL(found.url)
      return s.filter((a) => a.id !== id)
    })
  }

  return (
    <>
      <main className="flex-1 relative min-h-screen bg-background">
        {/* Fixed, centered panel: vertically centered on desktop, keeps its position regardless of sidebar open/closed */}
        <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/src/assets/DashboardLogo.png" alt="Dashboard logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">SimplifAI</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {actionButtons.map((button) => (
              (button.label === 'DeepSearch' || button.label === 'Create Images' || button.label === 'Latest News') ? (
                <Popover key={button.label}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-6 bg-card border-border hover:bg-accent flex items-center"
                      onClick={button.onClick}
                    >
                      {button.icon}
                      {button.label}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-3 bg-sidebar text-sidebar-foreground rounded-lg shadow-lg">
                    <div className="text-sm font-semibold">DEVELOPING MOOD</div>
                    <div className="text-xs text-sidebar-foreground/70 mt-1">COMMING SOON</div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  key={button.label}
                  variant="outline"
                  className="h-10 px-6 bg-card border-border hover:bg-accent flex items-center"
                  onClick={button.onClick}
                >
                  {button.icon}
                  {button.label}
                </Button>
              )
            ))}
            
            {/* Personas removed as requested */}
          </div>
        </div>

  {/* Chat Input Area */}
  <div className="space-y-2">
          {/* Desktop / large screens: keep existing layout */}
          {!isMobile && (
            <>
              <div className="relative">
                {/* Desktop: inline thumbnails above textarea if attachments exist */}
                {attachments.length > 0 && (
                  <div className="mb-3 flex gap-2">
                    {attachments.map((a) => (
                      <div key={a.id} className="relative w-12 h-12 rounded-md overflow-hidden bg-black/30 border">
                        <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                        <button onClick={() => removeAttachment(a.id)} aria-label="Remove" className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Textarea
                  ref={desktopTextareaRef}
                  placeholder="Type your message here..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onInput={(e: any) => adjustHeight(e.target)}
                  className="bg-card border-border rounded-xl resize-none pr-16 overflow-y-hidden"
                  maxLength={maxChars}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  {chatInput.length >= maxChars ? (
                    <div className="text-xs px-2 py-1 rounded bg-red-600 text-white">{`${chatInput.length}/${maxChars}`}</div>
                  ) : null}
                  <Button
                    size="sm"
                    aria-label={canSend ? 'Send message' : 'Voice input'}
                    className={`h-8 w-8 p-0 ${canSend ? 'bg-primary hover:bg-primary/90' : 'bg-white'}`}
                    onClick={() => {
                      if (canSend) {
                        // placeholder send: clear input and attachments for now
                        console.log('send', { text: chatInput, attachments });
                        setChatInput('');
                        setAttachments([]);
                      } else {
                        onVoiceClick?.();
                      }
                    }}
                    disabled={false}
                  >
                    {canSend ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <>
                    <input ref={fileInputRef} aria-hidden="true" title="Attach files" type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt,image/*,video/*" onChange={(e) => onFilesSelected(e.target.files)} />
                    <Button size="sm" variant="ghost" className="h-6 p-0" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="w-3 h-3 mr-1" />
                      Attach
                    </Button>
                  </>
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                </div>
              </div>
            </>
          )}

          {/* Mobile-only chat bar removed from inner panel; a top-level fixed mobile bar is rendered after </main> */}
        </div>
      </div>
      </main>

      {/* Top-level mobile fixed chat bar (keeps it out of the scroll area) */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
          <div className="bg-card border border-border rounded-2xl p-3 shadow-lg">
            <div className="relative">
              {/* Mobile: thumbnails above bar when present */}
              {attachments.length > 0 && (
                <div className="-mt-16 mb-2 flex gap-2 overflow-x-auto">
                  {attachments.map((a) => (
                    <div key={a.id} className="relative w-16 h-16 rounded-md overflow-hidden bg-black/30 border">
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      <button onClick={() => removeAttachment(a.id)} aria-label="Remove" className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                ref={mobileTextareaRef}
                placeholder="What do you want to know?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onInput={(e: any) => adjustHeight(e.target)}
                className="w-full bg-transparent pr-20 resize-none overflow-y-auto"
                maxLength={maxChars}
              />

              <div className="absolute right-3 bottom-3">
                <Button aria-label={chatInput.trim() ? 'Send message' : 'Voice input'} className="h-12 w-12 p-0 rounded-full bg-white flex items-center justify-center shadow-md" onClick={() => {
                  if (canSend) {
                    console.log('send', { text: chatInput, attachments });
                    setChatInput('');
                    setAttachments([]);
                  } else {
                    onVoiceClick?.();
                  }
                }}>
                  {chatInput.trim() ? <Send className="w-5 h-5 text-gray-900" /> : <Mic className="w-5 h-5 text-gray-900" />}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} aria-hidden="true" title="Attach files" type="file" className="hidden" multiple accept="image/*,video/*" onChange={(e) => onFilesSelected(e.target.files)} />
                <Button size="sm" variant="ghost" className={`h-8 p-0 flex items-center gap-2`} onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Attach</span>
                </Button>
                <Badge variant="secondary" className="text-sm">Auto</Badge>
              </div>

              {chatInput.length >= maxChars ? (
                <div className="text-xs px-2 py-1 rounded bg-red-600 text-white">{`${chatInput.length}/${maxChars}`}</div>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
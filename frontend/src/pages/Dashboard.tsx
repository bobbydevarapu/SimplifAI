
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageCircle } from 'lucide-react';
import React, { useState } from 'react';
import { AppSidebar } from '../components/SimplifAI/AppSidebar';
import { MainContent } from '../components/SimplifAI/MainContent';
import { SearchView } from '../components/SimplifAI/SearchView';
import { SettingsModal } from '../components/SimplifAI/SettingsModal';
import { VoiceAssistant } from '../components/SimplifAI/VoiceAssistant';
import { Dialog, DialogContent } from "../components/ui/dialog";
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';

const Dashboard: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showImagine, setShowImagine] = useState(false);
  // allow external components (like AppSidebar) to request showing the search/voice views
  React.useEffect(() => {
    const onOpenSearch = () => setShowSearch(true)
    const onOpenVoice = () => setShowVoice(true)
    const onOpenImagine = () => setShowImagine(true)
    window.addEventListener('open-search', onOpenSearch as EventListener)
    window.addEventListener('open-voice', onOpenVoice as EventListener)
    window.addEventListener('open-imagine', onOpenImagine as EventListener)
    return () => {
      window.removeEventListener('open-search', onOpenSearch as EventListener)
      window.removeEventListener('open-voice', onOpenVoice as EventListener)
      window.removeEventListener('open-imagine', onOpenImagine as EventListener)
    }
  }, [])
  // panel behavior is handled by SidebarProvider / Sidebar internally

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar trigger for mobile (uses SidebarProvider toggle) */}
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <SidebarTrigger />
        </div>

  {/* Desktop-only private chat icon (top-right, next to search row) */}
        <div className="hidden md:flex absolute top-4 right-4 z-50 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" aria-label="Private chat">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-3 bg-sidebar text-sidebar-foreground rounded-lg shadow-lg">
              <div className="text-sm font-semibold">DEVELOPING MOOD</div>
              <div className="text-xs text-sidebar-foreground/70 mt-1">COMMING SOON</div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Left panel (desktop) / sheet (mobile) handled by AppSidebar */}
        <AppSidebar
          showSecondaryMenu={true}
          onMenuToggle={() => setShowSettings(!showSettings)}
        />

        {/* Main Content Area */}
        <div className={`flex-1 relative ml-0 md:ml-64 transition-all duration-300`}>
          {/* Settings Modal */}
          <SettingsModal open={showSettings} onOpenChange={setShowSettings} />

          {/* Main Content or Search/Voice Views */}
          <MainContent
            onSearchClick={() => setShowSearch(true)}
            onVoiceClick={() => setShowVoice(true)}
          />
          {/* Search should open as an overlay on desktop and as a sheet on mobile. */}
          {showSearch && (
            <Dialog open={true} onOpenChange={(open) => !open && setShowSearch(false)}>
              <DialogContent closeVariant="destructive" className="md:backdrop-blur-sm md:bg-white/60 md:dark:bg-slate-900/60 md:rounded-2xl md:shadow-xl md:max-w-3xl md:mx-auto md:my-24 w-full h-full md:h-auto md:max-h-[80vh] p-0">
                <div className="w-full">
                  <SearchView onClose={() => setShowSearch(false)} />
                </div>
              </DialogContent>
            </Dialog>
          )}
          {showVoice && (
            <Dialog open={true} onOpenChange={(open) => !open && setShowVoice(false)}>
              <DialogContent className="md:backdrop-blur-sm md:bg-white/60 md:dark:bg-slate-900/60 md:rounded-2xl md:shadow-xl md:max-w-3xl md:mx-auto md:my-24 w-full h-full md:h-auto md:max-h-[80vh] p-0">
                <div className="w-full">
                  <VoiceAssistant onClose={() => setShowVoice(false)} />
                </div>
              </DialogContent>
            </Dialog>
          )}
          {/* Imagine blurred overlay with provided images */}
          {showImagine && (
            <Dialog open={true} onOpenChange={(open) => !open && setShowImagine(false)}>
              <DialogContent closeVariant="destructive" className="md:backdrop-blur-sm md:bg-white/40 md:dark:bg-slate-900/40 md:rounded-2xl md:shadow-xl md:max-w-4xl md:mx-auto md:my-12 w-full h-full md:h-auto md:max-h-[85vh] p-0">
                <div className="w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Imagine</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl overflow-hidden bg-card">
                      <img src="/src/assets/Hero.jpg" alt="imagine-1" className="w-full h-auto object-cover" />
                    </div>
                    <div className="rounded-xl overflow-hidden bg-card">
                      <img src="/src/assets/desktop.jpg" alt="imagine-2" className="w-full h-auto object-cover" />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};
export default Dashboard;
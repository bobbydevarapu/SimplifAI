import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [displayName, setDisplayName] = useState<string>('User');

  // derive display name from email same as sidebar
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const derive = (em?: string | null) => {
      if (!em) return 'User';
      const local = (em.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, '');
      if (!local) return 'User';
      const len = Math.max(3, Math.min(6, local.length));
      const part = local.slice(0, len);
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    };
    setDisplayName(derive(email));
  }, []);

  const settingsTabs = [
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent showClose={false} className="w-[95vw] max-w-3xl md:max-w-4xl mx-auto bg-card border-border rounded-xl overflow-hidden max-h-[85vh]">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 hover:bg-red-600/10"
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </DialogHeader>
  {/* Responsive body: stack on small screens, side-by-side on md+; content area scrolls if tall */}
  <div className="flex flex-col md:flex-row h-auto">
          {/* Small-screen top tabs */}
          <div className="md:hidden px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm ${activeTab===tab.id ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/80 bg-transparent'}`}
                >
                  <tab.icon className="w-4 h-4 inline-block mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar for md+ */}
          <div className="hidden md:block w-64 border-r border-border p-4">
            <nav className="space-y-2">
              {settingsTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
            {activeTab === "account" && (
              <div className="w-full max-w-3xl">
                <div className="p-4 bg-muted/50 rounded-lg w-full">
                  <div className="text-sm text-muted-foreground mb-2">Username :</div>
                  <div className="font-semibold text-sidebar-foreground text-lg">{displayName}</div>
                  <div className="mt-4 text-sm text-muted-foreground mb-2">Email :</div>
                  <div className="font-medium text-sidebar-foreground">{localStorage.getItem('userEmail') || 'user@example.com'}</div>
                </div>
              </div>
            )}
            {/* Appearance tab removed as requested */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
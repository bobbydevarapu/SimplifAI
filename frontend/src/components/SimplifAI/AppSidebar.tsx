import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ChevronDown,
  Edit,
  File,
  FolderOpen,
  HelpCircle,
  History,
  LogOut,
  Mic,
  Search,
  Settings,
  Share2,
  Users,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

  const mainNavItems = [
  { title: "Search", url: "/search", icon: Search, shortcut: "Ctrl+K", event: 'open-search' },
  { title: "Ask", url: "/ask", icon: Edit, event: 'open-ask' },
  { title: "Voice", url: "/voice", icon: Mic, event: 'open-voice' },
  { title: "Imagine", url: "/imagine", icon: Wand2, event: 'open-imagine' },
  { title: "Projects", url: "/projects", icon: FolderOpen },
];

const secondaryNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Report Issue", url: "/report", icon: AlertTriangle },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Files", url: "/files", icon: File },
  { title: "Community", url: "/community", icon: Users },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
  { title: "Changelog", url: "/changelog", icon: Calendar },
  { title: "Shared Links", url: "/shared", icon: Share2 },
  { title: "Upgrade plan", url: "/upgrade", icon: Zap },
  { title: "Sign Out", url: "/signout", icon: LogOut },
];

const historyItems = [
  {
    period: "Today",
    items: ["CloudVault-Website"]
  },
  {
    period: "August", 
    items: ["Directory Structure and Disk"]
  },
  {
    period: "July",
    items: ["Exam Question and Correct Answer"]
  },
  {
    period: "June",
    items: ["Project Structure and Code"]
  }
];

interface AppSidebarProps {
  showSecondaryMenu?: boolean;
  onMenuToggle?: () => void;
}

export function AppSidebar({ showSecondaryMenu = false, onMenuToggle }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [historyOpen, setHistoryOpen] = useState(true);
  const [recentItems, setRecentItems] = useState<Array<{ id: string; title: string; timestamp?: string }>>([]);
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const isMobile = useIsMobile();
  const [showPlansMobile, setShowPlansMobile] = useState(false);
  const [openPlansDialog, setOpenPlansDialog] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
    // derive display name (local part) with constraints: min 3, max 6 chars, first letter capitalized
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

  // Fetch recent history for the sidebar (shows only recent items)
  useEffect(() => {
    let mounted = true;
    async function fetchRecent() {
      try {
        const url = new URL('/api/search-history', window.location.origin);
        // ask server for recent items (no pagination here)
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const json = await res.json();
        if (!Array.isArray(json.groups)) return;
        // flatten groups to items and keep any timestamp if present
        const items: Array<{ id: string; title: string; timestamp?: string }> = [];
        for (const g of json.groups) {
          for (const it of g.items) {
            items.push({ id: it.id || String(Math.random()), title: it.title, timestamp: it.timestamp });
          }
        }
        // sort by timestamp desc if available
        items.sort((a, b) => {
          if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          return 0;
        });
        // keep only most recent 8
        const recent = items.slice(0, 8);
        if (mounted) setRecentItems(recent);
      } catch (e) {
        // ignore
      }
    }
    fetchRecent();
    // refresh every 30s for near real-time feel
    const id = setInterval(fetchRecent, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const formatPeriod = (ts?: string) => {
    if (!ts) return 'Recent';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleString(undefined, { month: 'long' });
    return String(d.getFullYear());
  };

  const formatRight = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    // otherwise show short date
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // group recentItems by period
  const recentGroups = recentItems.reduce((acc: Record<string, Array<{ id: string; title: string; timestamp?: string }>>, it) => {
    const period = formatPeriod(it.timestamp);
    if (!acc[period]) acc[period] = [];
    acc[period].push(it);
    return acc;
  }, {} as Record<string, Array<{ id: string; title: string; timestamp?: string }>>);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
  <Sidebar variant="floating" className={`${collapsed ? "w-14" : "w-64"} border-r border-sidebar-border`} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {/* Projects shows a responsive popover message card instead of navigation */}
                {item.title === 'Projects' ? (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavCls(isActive(item.url))}`}
                          aria-label={item.title}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span>{item.title}</span>
                              {item.shortcut && (
                                <span className="ml-auto text-xs text-sidebar-foreground/60">
                                  {item.shortcut}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full max-w-xs md:w-44 p-3 bg-sidebar text-sidebar-foreground rounded-lg shadow-lg">
                        <div className="text-sm font-semibold">DEVELOPING MOOD</div>
                        <div className="text-xs text-sidebar-foreground/70 mt-1">COMING SOON</div>
                      </PopoverContent>
                    </Popover>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      onClick={(e) => {
                        // If this nav item is wired to open an inline view, prevent navigation
                        // and dispatch a global event that Dashboard listens for.
                        if ((item as any).event) {
                          e.preventDefault()
                          window.dispatchEvent(new Event((item as any).event))
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavCls(isActive(item.url))}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span>{item.title}</span>
                          {item.shortcut && (
                            <span className="ml-auto text-xs text-sidebar-foreground/60">
                              {item.shortcut}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}

            {/* When collapsed on desktop, show a compact History icon in the rail so users can open history */}
            {collapsed && !isMobile && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="History" onClick={() => setHistoryOpen((v) => !v)}>
                  <button aria-label="History" title="History" className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50`}>
                    <History className="w-5 h-5" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary menu removed from left panel; items are available in profile popover */}

        {/* History Section */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  onClick={() => {
                    // open full search/history view
                    window.dispatchEvent(new Event('open-search'));
                    // also ensure the collapsible is open
                    setHistoryOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {Object.keys(recentGroups).length === 0 ? (
                      <div className="px-3 py-2 text-sm text-sidebar-foreground/60">No recent history</div>
                    ) : (
                      Object.entries(recentGroups).map(([period, items]) => (
                        <div key={period} className="space-y-1">
                          <div className="px-3 py-1 text-sm text-sidebar-foreground/60 font-medium">
                            {period}
                          </div>
                          {items.map((it) => (
                            <SidebarMenuItem key={it.id}>
                              <div
                                onClick={() => {
                                  // open full history/search view and prefill query
                                  try { localStorage.setItem('searchQuery', it.title); } catch (e) {}
                                  window.dispatchEvent(new Event('open-search'));
                                }}
                                className="group flex items-center gap-2 px-6 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg cursor-pointer"
                                title={it.title}
                              >
                                <span className="flex-1 truncate">{it.title}</span>
                                <div className="text-xs text-sidebar-foreground/60">{formatRight(it.timestamp)}</div>
                              </div>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      ))
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* User Profile (always available; compact when collapsed) */}
        <div className={`mt-auto ${collapsed ? 'py-3 px-0' : 'p-3'}`}>
          <div className="flex items-center justify-between gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className={`flex items-center ${collapsed ? 'gap-0 p-0 justify-center' : 'gap-3 p-2'} rounded-lg hover:bg-sidebar-accent/50 cursor-pointer` }>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/api/placeholder/32/32" alt={displayName} />
                    <AvatarFallback>{displayName.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</div>
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-sidebar rounded-xl overflow-hidden shadow-lg">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/api/placeholder/48/48" alt="User" />
                      <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sidebar-foreground">{displayName}</div>
                      <div className="text-xs text-sidebar-foreground/60 truncate">{userEmail || 'user@example.com'}</div>
                    </div>
                  </div>

                  {/* Plans Dialog (responsive) - opens when Upgrade clicked on any device if openPlansDialog === true */}
                  <Dialog open={openPlansDialog} onOpenChange={(v) => { setOpenPlansDialog(v); setShowPlansMobile(false); }}>
                    <DialogContent
                      showClose={false}
                      className={
                        isMobile
                          ? "left-0 top-0 translate-x-0 translate-y-0 w-full h-full m-0 p-4 rounded-none overflow-auto"
                          : "w-[95vw] max-w-3xl rounded-lg mx-auto p-6"
                      }
                    >
                      <div className="mx-auto px-2 py-4 max-w-[1100px]">
                        <div className="text-center space-y-4 mb-6">
                          <h2 className="text-2xl md:text-3xl font-bold text-vault-purple bg-gradient-purple text-transparent bg-clip-text">Explore Our Plans</h2>
                          <p className="text-sm text-vault-text-secondary max-w-xl mx-auto">Choose a plan to unlock AI tools.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                          <Card className="mx-auto w-full max-w-md bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-4">
                            <div className="flex justify-center mb-2">
                              <div className="w-20 h-20 bg-background flex items-center justify-center">
                                <img src="/src/assets/DashboardLogo.png" alt="Dashboard Logo" className="w-16 h-16 object-contain" />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-vault-text-primary text-center">Free Plan</h3>
                            <p className="text-center text-vault-text-secondary mt-2">Basic AI tools</p>
                            <Button variant="vault" className="w-full mt-4" onClick={() => { setOpenPlansDialog(false); navigate('/signup'); }}>Get Started</Button>
                          </Card>

                          <Card className="mx-auto w-full max-w-md bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-4">
                            <div className="flex justify-center mb-2">
                              <div className="w-20 h-20 bg-background flex items-center justify-center">
                                <img src="/src/assets/DashboardLogo.png" alt="Dashboard Logo" className="w-16 h-16 object-contain" />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-vault-text-primary text-center">Pro Plan</h3>
                            <p className="text-center text-vault-text-secondary mt-2">Advanced AI tools</p>
                            <Button variant="vault" className="w-full mt-4 bg-red-600" onClick={() => { setOpenPlansDialog(false); /* proceed to upgrade flow */ }}>Upgrade Now</Button>
                          </Card>

                          <Card className="mx-auto w-full max-w-md bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-4">
                            <div className="flex justify-center mb-2">
                              <div className="w-20 h-20 bg-background flex items-center justify-center">
                                <img src="/src/assets/DashboardLogo.png" alt="Dashboard Logo" className="w-16 h-16 object-contain" />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-vault-text-primary text-center">Business Plan</h3>
                            <p className="text-center text-vault-text-secondary mt-2">Premium AI tools</p>
                            <Button variant="vault" className="w-full mt-4 bg-red-600" onClick={() => { setOpenPlansDialog(false); /* proceed to upgrade flow */ }}>Upgrade Now</Button>
                          </Card>
                        </div>
                      </div>
                      <DialogClose asChild>
                        <button aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 bg-red-700/90 hover:bg-red-600">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>

                  {/* Mobile inline plans card - shown only when showPlansMobile is true */}
                  {isMobile && showPlansMobile && (
                    <div className="mt-4">
                      <Card className="bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-4">
                        <CardHeader className="text-center mb-4">
                          <CardTitle className="text-lg font-semibold">Explore Our Plans</CardTitle>
                          <div className="text-sm text-vault-text-secondary">Choose a plan to unlock AI tools.</div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="p-3 rounded-lg bg-background">
                              <div className="text-sm font-semibold text-vault-text-primary">Free Plan</div>
                              <div className="text-xs text-vault-text-secondary">Basic AI tools</div>
                              <Button variant="vault" className="w-full mt-3" onClick={() => { setShowPlansMobile(false); navigate('/signup'); }}>Get Started</Button>
                            </div>

                            <div className="p-3 rounded-lg bg-background">
                              <div className="text-sm font-semibold text-vault-text-primary">Pro Plan</div>
                              <div className="text-xs text-vault-text-secondary">Advanced AI tools</div>
                              <Button variant="vault" className="w-full mt-3 bg-red-600" onClick={() => { setShowPlansMobile(false); setOpenPlansDialog(false); /* handle upgrade selection inline or open modal */ }}>Upgrade Now</Button>
                            </div>

                            <div className="p-3 rounded-lg bg-background">
                              <div className="text-sm font-semibold text-vault-text-primary">Business Plan</div>
                              <div className="text-xs text-vault-text-secondary">Premium AI tools</div>
                              <Button variant="vault" className="w-full mt-3 bg-red-600" onClick={() => { setShowPlansMobile(false); setOpenPlansDialog(false); /* handle upgrade selection inline or open modal */ }}>Upgrade Now</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="mt-3 border-t border-sidebar-border" />

                  {/* Only the three actions requested: icon-only on desktop with hover tooltips; full labels visible on mobile (md below) */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="flex flex-col items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" aria-label="Settings" title="Settings" onClick={() => onMenuToggle ? onMenuToggle() : navigate('/settings')} variant="ghost" size="icon" className="h-10 w-10 rounded-lg flex items-center justify-center bg-sidebar-accent text-sidebar-primary">
                            <Settings className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Settings</TooltipContent>
                      </Tooltip>
                      <span className="mt-2 text-xs text-sidebar-foreground/80 block md:hidden">Settings</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" aria-label="Upgrade" title="Upgrade" onClick={() => { setOpenPlansDialog(true); if (isMobile) setShowPlansMobile(true); }} variant="default" size="icon" className="h-10 w-10 rounded-lg flex items-center justify-center bg-red-600 text-white shadow-sm">
                            <Zap className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Upgrade</TooltipContent>
                      </Tooltip>
                      <span className="mt-2 text-xs text-sidebar-foreground/80 block md:hidden">Upgrade</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" aria-label="Sign out" title="Sign out" onClick={() => { localStorage.removeItem('isAuthenticated'); localStorage.removeItem('userEmail'); navigate('/signin'); }} variant="outline" size="icon" className="h-10 w-10 rounded-lg flex items-center justify-center border border-sidebar-border text-sidebar-foreground bg-transparent">
                            <LogOut className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Sign Out</TooltipContent>
                      </Tooltip>
                      <span className="mt-2 text-xs text-sidebar-foreground/80 block md:hidden">Sign Out</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* When expanded: show the trigger side-by-side with the profile */}
            {!collapsed && (
              <div className="ml-2">
                <SidebarTrigger aria-label="Collapse sidebar">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </SidebarTrigger>
              </div>
            )}
          </div>

          {/* When collapsed: show the trigger centered below the avatar (rail behavior) */}
          {collapsed && (
            <div className="mt-3 flex justify-center">
              <SidebarTrigger aria-label="Expand sidebar">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </SidebarTrigger>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

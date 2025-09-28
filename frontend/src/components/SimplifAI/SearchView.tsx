import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SearchItem {
  id: string;
  title: string;
  snippet?: string;
  timestamp?: string;
}

interface SearchHistoryGroup {
  period: string;
  items: SearchItem[];
}

interface SearchViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

// Fetch helper: calls /api/search-history?q=... (GET) and expects { groups: SearchHistoryGroup[] }
async function fetchHistory(query = "", all = false): Promise<SearchHistoryGroup[]> {
  try {
    const url = new URL("/api/search-history", window.location.origin);
    if (query) url.searchParams.set("q", query);
    if (all) url.searchParams.set("all", "1");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to load history");
    const json = await res.json();
    if (Array.isArray(json.groups)) return json.groups as SearchHistoryGroup[];
  } catch (e) {
    // graceful fallback to empty
    return [];
  }
  return [];
}

export function SearchView({ onBack, onClose }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<SearchHistoryGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Check for a prefilled query from sidebar click
    const pref = (() => {
      try { return localStorage.getItem('searchQuery') || ''; } catch (e) { return ''; }
    })();
    if (pref) {
      setSearchQuery(pref);
      // clear the pref so next open is fresh
      try { localStorage.removeItem('searchQuery'); } catch (e) {}
      fetchHistory(pref).then((g) => {
        if (mounted) {
          setGroups(g);
          setLoading(false);
        }
      });
    } else {
      fetchHistory().then((g) => {
        if (mounted) {
          setGroups(g);
          setLoading(false);
        }
      });
    }
    return () => { mounted = false };
  }, []);

  // live filtered results (client-side) in case server returns a larger list
  const filtered = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((grp) => ({
        ...grp,
        items: grp.items.filter((it) => it.title.toLowerCase().includes(q) || (it.snippet || "").toLowerCase().includes(q))
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  const handleShowAll = async () => {
    setLoading(true);
    const all = await fetchHistory("", true);
    setGroups(all);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto h-full md:h-auto md:max-h-[80vh] md:rounded-2xl md:overflow-hidden bg-transparent">
      {/* container uses a column layout where header is fixed and body scrolls */}
      <div className="flex flex-col h-full bg-transparent">
        {/* Header (fixed) */}
        <div className="p-4 border-b border-border bg-transparent relative">
          {/* drag handle */}
          <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3" />

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border rounded-xl"
            />
            <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 overflow-auto flex-1 bg-transparent">
          {/* Actions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Actions</h3>
              <Button onClick={handleShowAll} variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-[#800000]">
                {loading ? "Loading..." : "Show All"}
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 justify-start gap-3 bg-card border-border hover:bg-accent"
            >
              <Plus className="w-4 h-4" />
              Create New Private Chat
            </Button>
          </div>

          {/* History Section */}
          <div className="mt-6 space-y-6">
            {(filtered.length === 0 && !loading) ? (
              <div className="text-sm text-muted-foreground">No history found.</div>
            ) : (
              filtered.map((period) => (
                <div key={period.period} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {period.period}
                  </h4>

                  <div className="space-y-2">
                    {period.items.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          // when clicking a history item, fill the search box with the title
                          setSearchQuery(item.title);
                        }}
                      >
                        <span className="flex-1 text-sm text-foreground">{item.title}</span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
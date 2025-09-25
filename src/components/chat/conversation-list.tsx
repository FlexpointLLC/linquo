import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardBrandColor } from "@/contexts/dashboard-brand-color-context";
import { useState, memo, useEffect, useRef, useCallback } from "react";

export type ConversationListItem = {
  id: string;
  name: string;
  email?: string;
  lastMessage: string;
  unread?: number;
  status?: "ACTIVE" | "BLOCKED";
  state?: "OPEN" | "CLOSED";
  timestamp?: string;
  avatar?: string;
  created_at?: string;
};

type ChatTab = "open" | "newest" | "resolved";

export const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
  section,
  onSectionChange,
}: {
  conversations: ConversationListItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  section?: string;
  onSectionChange?: (section: string) => void;
}) {
  const { brandColor } = useDashboardBrandColor();
  const [activeTab, setActiveTab] = useState<ChatTab>((section as ChatTab) || "open");

  // --- Frontend audio beep when an avatar border turns blue (unread > 0) ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canPlayRef = useRef<boolean>(false);
  const prevUnreadMapRef = useRef<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('linquo-sound-enabled') === 'true') return true;
      } catch {}
      try {
        if ('Notification' in window && Notification.permission === 'granted') return true;
      } catch {}
    }
    return false;
  });
  // Track notification permission implicitly via Notification.permission; no separate state needed

  // Initialize AudioContext after first user interaction (autoplay policies)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Track current notification permission
    try {
      if ('Notification' in window) {
        // If granted, ensure button remains hidden
        if (Notification.permission === 'granted') {
          try { localStorage.setItem('linquo-sound-enabled', 'true'); } catch {}
          setSoundEnabled(true);
        }
      }
    } catch {}
    const init = async () => {
      try {
        const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
        canPlayRef.current = true;
        setSoundEnabled(true);
      } catch {}
    };
    // Attempt immediate init if previously enabled (best effort; may remain suspended until a gesture)
    if (soundEnabled) {
      init();
    }
    const onInteract = () => { init(); };
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteract as EventListener);
      window.removeEventListener('keydown', onInteract as EventListener);
    };
  }, [soundEnabled]);

  // Politely ask for Notification permission on first load (best effort)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            try { localStorage.setItem('linquo-sound-enabled', 'true'); } catch {}
            setSoundEnabled(true);
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const playBeep = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) {
        if (!canPlayRef.current) return;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {}
  }, []);

  // Detect when any conversation transitions from unread 0 -> >0 and play beep
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    const prevMap = prevUnreadMapRef.current;
    for (const conv of conversations) {
      const prev = prevMap[conv.id] ?? 0;
      const curr = conv.unread ?? 0;
      if (prev === 0 && curr > 0) {
        // Avoid beeping for the currently open conversation
        if (!activeId || conv.id !== activeId) {
          playBeep();
        }
      }
      prevMap[conv.id] = curr;
    }
    prevUnreadMapRef.current = prevMap;
  }, [conversations, activeId, playBeep]);

  const enableSoundAndNotifications = useCallback(async () => {
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
        canPlayRef.current = true;
        setSoundEnabled(true);
        // confirmation beep
        await playBeep();
        try { localStorage.setItem('linquo-sound-enabled', 'true'); } catch {}
      }
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
    } catch {}
  }, [playBeep]);

  // Sync with section prop
  useEffect(() => {
    if (section && (section === "open" || section === "newest" || section === "resolved")) {
      setActiveTab(section as ChatTab);
    }
  }, [section]);
  
  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    const today = new Date();
    const convDate = conv.created_at ? new Date(conv.created_at) : new Date(conv.timestamp || '');
    const isToday = convDate.toDateString() === today.toDateString();
    
    switch (activeTab) {
      case "open":
        return conv.state !== "CLOSED";
      case "newest":
        return isToday; // Show ALL conversations from today (both open and resolved)
      case "resolved":
        return conv.state === "CLOSED";
      default:
        return true;
    }
  });
  
  const openCount = conversations.filter(c => c.state !== "CLOSED").length;
  const newestCount = conversations.filter(c => {
    const today = new Date();
    const convDate = c.created_at ? new Date(c.created_at) : new Date(c.timestamp || '');
    return convDate.toDateString() === today.toDateString();
  }).length;
  const resolvedCount = conversations.filter(c => c.state === "CLOSED").length;

  return (
    <div className="border-r shrink-0 bg-background h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-0 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
          {!soundEnabled && (
            <button
              onClick={enableSoundAndNotifications}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors cursor-pointer"
              title="Enable notification sound"
            >
              Enable sound/notifications
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => {
              setActiveTab("open");
              onSectionChange?.("open");
            }}
            className={`pb-2 px-1 font-medium transition-colors cursor-pointer ${
              activeTab === "open"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "open" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Open{openCount > 0 ? ` (${openCount})` : ''}
          </button>
          <button
            onClick={() => {
              setActiveTab("newest");
              onSectionChange?.("newest");
            }}
            className={`pb-2 px-1 font-medium transition-colors cursor-pointer ${
              activeTab === "newest"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "newest" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Newest{newestCount > 0 ? ` (${newestCount})` : ''}
          </button>
          <button
            onClick={() => {
              setActiveTab("resolved");
              onSectionChange?.("resolved");
            }}
            className={`pb-2 px-1 font-medium transition-colors cursor-pointer ${
              activeTab === "resolved"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "resolved" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Resolved{resolvedCount > 0 ? ` (${resolvedCount})` : ''}
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <div className="text-sm">
              {activeTab === "open" && "No open conversations"}
              {activeTab === "newest" && "No conversations today"}
              {activeTab === "resolved" && "No resolved conversations"}
            </div>
            <div className="text-xs mt-1">
              {activeTab === "open" && "All conversations are resolved"}
              {activeTab === "newest" && "No new conversations today"}
              {activeTab === "resolved" && "No conversations have been resolved yet"}
            </div>
          </div>
        ) : (
          filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className={
                "w-full text-left p-3 hover:bg-muted transition-colors cursor-pointer " +
                (activeId === c.id ? "border-r-2 bg-muted" : "")
              }
              style={activeId === c.id ? { borderRightColor: brandColor } : {}}
            >
              <div className="flex items-start gap-3">
                <Avatar className={`h-8 w-8 ${c.unread && c.unread > 0 ? 'ring-2 ring-blue-500' : ''}`}>
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {c.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-foreground truncate text-sm">
                      {c.name}
                    </div>
                    {c.timestamp && (
                      <span className={`text-xs flex-shrink-0 ${c.unread && c.unread > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                        {c.timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground truncate">
                    {c.lastMessage || "No messages yet"}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
});

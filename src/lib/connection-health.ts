import { getSupabaseBrowser } from "./supabase-browser";

export interface ConnectionHealth {
  isConnected: boolean;
  latency?: number;
  error?: string;
  timestamp: number;
}

export async function checkConnectionHealth(): Promise<ConnectionHealth> {
  const supabase = getSupabaseBrowser();
  
  if (!supabase) {
    return {
      isConnected: false,
      error: "Supabase client not available",
      timestamp: Date.now()
    };
  }

  const startTime = Date.now();
  
  try {
    // Simple health check query
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        isConnected: false,
        latency,
        error: error.message,
        timestamp: Date.now()
      };
    }
    
    return {
      isConnected: true,
      latency,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      isConnected: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now()
    };
  }
}

export function createConnectionMonitor(
  onHealthChange: (health: ConnectionHealth) => void,
  intervalMs: number = 30000 // Check every 30 seconds
) {
  let intervalId: NodeJS.Timeout | null = null;
  let isRunning = false;

  const start = () => {
    if (isRunning) return;
    
    isRunning = true;
    
    // Initial check
    checkConnectionHealth().then(onHealthChange);
    
    // Periodic checks
    intervalId = setInterval(async () => {
      const health = await checkConnectionHealth();
      onHealthChange(health);
    }, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  };

  return { start, stop };
}

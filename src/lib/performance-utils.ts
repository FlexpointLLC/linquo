// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Performance timer "${label}" was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    if (duration > 100) { // Log slow operations (>100ms)
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// Database query optimization suggestions
export const DB_OPTIMIZATION_TIPS = {
  messages: [
    "Add index on (conversation_id, created_at) for faster message queries",
    "Add index on (org_id, conversation_id) for organization-scoped queries",
    "Consider partitioning messages table by date for large datasets"
  ],
  conversations: [
    "Add index on (org_id, last_message_at) for conversation ordering",
    "Add index on (org_id, state) for filtering by conversation state",
    "Add index on (customer_id) for customer-conversation lookups"
  ],
  customers: [
    "Add index on (org_id, created_at) for customer ordering",
    "Add index on (email) for customer lookups",
    "Consider adding composite index on (org_id, email) for unique constraints"
  ]
};

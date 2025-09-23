// Request deduplication to prevent multiple identical requests
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<T>;
    }

    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store the request
    this.pendingRequests.set(key, request);

    return request;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

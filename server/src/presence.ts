// Tracks which users are currently connected and which room they are in.
// Pure data — the socket layer reads this to compute friend status and routing.

export class Presence {
  /** userId -> set of socket ids */
  private sockets = new Map<string, Set<string>>();
  /** userId -> room code */
  private rooms = new Map<string, string>();

  addSocket(userId: string, socketId: string): void {
    let set = this.sockets.get(userId);
    if (!set) {
      set = new Set();
      this.sockets.set(userId, set);
    }
    set.add(socketId);
  }

  /** Removes a socket. Returns true if the user has no remaining sockets (went offline). */
  removeSocket(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) return true;
    set.delete(socketId);
    if (set.size === 0) {
      this.sockets.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }

  setRoom(userId: string, code: string | null): void {
    if (code) this.rooms.set(userId, code);
    else this.rooms.delete(userId);
  }

  getRoom(userId: string): string | null {
    return this.rooms.get(userId) ?? null;
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { User } from "./types.js";

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  createdAt: number;
}

interface DbShape {
  users: User[];
  /** userId -> friend userIds */
  friendships: Record<string, string[]>;
  requests: FriendRequest[];
}

const EMPTY: DbShape = { users: [], friendships: {}, requests: [] };

/** Where the serialized DB blob lives. */
interface Persistence {
  kind: string;
  load(): Promise<DbShape | null>;
  save(db: DbShape): Promise<void>;
}

class FilePersistence implements Persistence {
  kind = "file";
  constructor(private file: string) {}
  async load(): Promise<DbShape | null> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      return JSON.parse(raw) as DbShape;
    } catch {
      return null;
    }
  }
  async save(db: DbShape): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(db, null, 2), "utf8");
  }
}

class RedisPersistence implements Persistence {
  kind = "redis";
  private key = "whoisfake:db";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private redis: any) {}
  async load(): Promise<DbShape | null> {
    const raw = await this.redis.get(this.key);
    return raw ? (JSON.parse(raw) as DbShape) : null;
  }
  async save(db: DbShape): Promise<void> {
    await this.redis.set(this.key, JSON.stringify(db));
  }
}

async function createPersistence(): Promise<Persistence> {
  if (config.redisUrl) {
    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis(config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      await redis.connect();
      await redis.ping();
      console.log("[store] connected to Redis");
      return new RedisPersistence(redis);
    } catch (err) {
      console.warn(
        `[store] Redis unavailable (${(err as Error).message}); falling back to file store`
      );
    }
  }
  console.log(`[store] using file store at ${config.dataFile}`);
  return new FilePersistence(config.dataFile);
}

export class Store {
  private db: DbShape = structuredClone(EMPTY);
  private saveTimer: NodeJS.Timeout | null = null;

  private constructor(private persistence: Persistence) {}

  static async create(): Promise<Store> {
    const persistence = await createPersistence();
    const store = new Store(persistence);
    const loaded = await persistence.load();
    if (loaded) {
      store.db = { ...structuredClone(EMPTY), ...loaded };
      store.db.friendships ??= {};
      store.db.requests ??= [];
    }
    return store;
  }

  get backend(): string {
    return this.persistence.kind;
  }

  private scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.persistence.save(this.db).catch((e) =>
        console.error("[store] save failed:", e)
      );
    }, 250);
  }

  // ---- users ----

  getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    const lower = username.trim().toLowerCase();
    return this.db.users.find((u) => u.usernameLower === lower);
  }

  createUser(user: User): User {
    this.db.users.push(user);
    this.scheduleSave();
    return user;
  }

  updateUser(id: string, patch: Partial<User>): User | undefined {
    const u = this.getUserById(id);
    if (!u) return undefined;
    Object.assign(u, patch);
    this.scheduleSave();
    return u;
  }

  // ---- friendships ----

  getFriendIds(userId: string): string[] {
    return this.db.friendships[userId] ?? [];
  }

  areFriends(a: string, b: string): boolean {
    return this.getFriendIds(a).includes(b);
  }

  addFriendEdge(a: string, b: string): void {
    (this.db.friendships[a] ??= []);
    (this.db.friendships[b] ??= []);
    if (!this.db.friendships[a].includes(b)) this.db.friendships[a].push(b);
    if (!this.db.friendships[b].includes(a)) this.db.friendships[b].push(a);
    this.scheduleSave();
  }

  removeFriendEdge(a: string, b: string): void {
    if (this.db.friendships[a]) {
      this.db.friendships[a] = this.db.friendships[a].filter((x) => x !== b);
    }
    if (this.db.friendships[b]) {
      this.db.friendships[b] = this.db.friendships[b].filter((x) => x !== a);
    }
    this.scheduleSave();
  }

  // ---- friend requests ----

  getRequestById(id: string): FriendRequest | undefined {
    return this.db.requests.find((r) => r.id === id);
  }

  findRequest(fromId: string, toId: string): FriendRequest | undefined {
    return this.db.requests.find((r) => r.fromId === fromId && r.toId === toId);
  }

  incomingRequests(userId: string): FriendRequest[] {
    return this.db.requests.filter((r) => r.toId === userId);
  }

  outgoingRequests(userId: string): FriendRequest[] {
    return this.db.requests.filter((r) => r.fromId === userId);
  }

  addRequest(req: FriendRequest): void {
    this.db.requests.push(req);
    this.scheduleSave();
  }

  removeRequest(id: string): void {
    this.db.requests = this.db.requests.filter((r) => r.id !== id);
    this.scheduleSave();
  }
}

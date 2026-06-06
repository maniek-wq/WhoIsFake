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

/**
 * Persistence backend. Methods are granular so the Redis backend can store one
 * key per record (browsable in RedisInsight: wif:user:*, wif:friends:*, wif:request:*),
 * while the file backend just rewrites a JSON snapshot.
 */
interface Persistence {
  kind: string;
  loadAll(): Promise<DbShape>;
  saveUser(u: User): Promise<void>;
  saveFriends(userId: string, ids: string[]): Promise<void>;
  saveRequest(r: FriendRequest): Promise<void>;
  deleteRequest(id: string): Promise<void>;
}

class FilePersistence implements Persistence {
  kind = "file";
  private timer: NodeJS.Timeout | null = null;
  constructor(private file: string, private snapshot: () => DbShape) {}

  async loadAll(): Promise<DbShape> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const db = JSON.parse(raw) as DbShape;
      return { ...structuredClone(EMPTY), ...db };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  // every mutation just schedules a debounced full-file write
  private schedule(): Promise<void> {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        void fs
          .mkdir(path.dirname(this.file), { recursive: true })
          .then(() => fs.writeFile(this.file, JSON.stringify(this.snapshot(), null, 2), "utf8"))
          .catch((e) => console.error("[store] file save failed:", e));
      }, 250);
    }
    return Promise.resolve();
  }
  saveUser() { return this.schedule(); }
  saveFriends() { return this.schedule(); }
  saveRequest() { return this.schedule(); }
  deleteRequest() { return this.schedule(); }
}

class RedisPersistence implements Persistence {
  kind = "redis";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private redis: any) {}

  private kUser = (id: string) => `wif:user:${id}`;
  private kFriends = (id: string) => `wif:friends:${id}`;
  private kReq = (id: string) => `wif:request:${id}`;

  private async mgetJson<T>(keys: string[]): Promise<T[]> {
    if (keys.length === 0) return [];
    const raws: (string | null)[] = await this.redis.mget(keys);
    return raws.filter((r): r is string => !!r).map((r) => JSON.parse(r) as T);
  }

  async loadAll(): Promise<DbShape> {
    const userKeys: string[] = await this.redis.keys("wif:user:*");

    // one-time migration from the legacy single-blob layout
    if (userKeys.length === 0) {
      const legacy = await this.redis.get("whoisfake:db");
      if (legacy) {
        const db = { ...structuredClone(EMPTY), ...(JSON.parse(legacy) as DbShape) };
        await this.importAll(db);
        console.log("[store] migrated legacy whoisfake:db -> per-record keys");
        return db;
      }
      return structuredClone(EMPTY);
    }

    const [users, friendKeys, reqKeys] = await Promise.all([
      this.mgetJson<User>(userKeys),
      this.redis.keys("wif:friends:*") as Promise<string[]>,
      this.redis.keys("wif:request:*") as Promise<string[]>,
    ]);

    const friendships: Record<string, string[]> = {};
    const friendVals = await this.mgetJson<string[]>(friendKeys);
    friendKeys.forEach((key, i) => {
      friendships[key.slice("wif:friends:".length)] = friendVals[i] ?? [];
    });

    const requests = await this.mgetJson<FriendRequest>(reqKeys);
    return { users, friendships, requests };
  }

  private async importAll(db: DbShape): Promise<void> {
    const pipe = this.redis.pipeline();
    for (const u of db.users) pipe.set(this.kUser(u.id), JSON.stringify(u));
    for (const [id, ids] of Object.entries(db.friendships))
      pipe.set(this.kFriends(id), JSON.stringify(ids));
    for (const r of db.requests) pipe.set(this.kReq(r.id), JSON.stringify(r));
    await pipe.exec();
  }

  async saveUser(u: User): Promise<void> {
    await this.redis.set(this.kUser(u.id), JSON.stringify(u));
  }
  async saveFriends(userId: string, ids: string[]): Promise<void> {
    await this.redis.set(this.kFriends(userId), JSON.stringify(ids));
  }
  async saveRequest(r: FriendRequest): Promise<void> {
    await this.redis.set(this.kReq(r.id), JSON.stringify(r));
  }
  async deleteRequest(id: string): Promise<void> {
    await this.redis.del(this.kReq(id));
  }
}

async function createPersistence(snapshot: () => DbShape): Promise<Persistence> {
  if (config.redisUrl) {
    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
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
  return new FilePersistence(config.dataFile, snapshot);
}

export class Store {
  private db: DbShape = structuredClone(EMPTY);
  private persistence!: Persistence;

  static async create(): Promise<Store> {
    const store = new Store();
    store.persistence = await createPersistence(() => store.db);
    store.db = await store.persistence.loadAll();
    store.db.friendships ??= {};
    store.db.requests ??= [];
    return store;
  }

  get backend(): string {
    return this.persistence.kind;
  }

  private fail = (e: unknown) => console.error("[store] persist failed:", e);

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
    void this.persistence.saveUser(user).catch(this.fail);
    return user;
  }

  updateUser(id: string, patch: Partial<User>): User | undefined {
    const u = this.getUserById(id);
    if (!u) return undefined;
    Object.assign(u, patch);
    void this.persistence.saveUser(u).catch(this.fail);
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
    void this.persistence.saveFriends(a, this.db.friendships[a]).catch(this.fail);
    void this.persistence.saveFriends(b, this.db.friendships[b]).catch(this.fail);
  }

  removeFriendEdge(a: string, b: string): void {
    if (this.db.friendships[a]) this.db.friendships[a] = this.db.friendships[a].filter((x) => x !== b);
    if (this.db.friendships[b]) this.db.friendships[b] = this.db.friendships[b].filter((x) => x !== a);
    void this.persistence.saveFriends(a, this.db.friendships[a] ?? []).catch(this.fail);
    void this.persistence.saveFriends(b, this.db.friendships[b] ?? []).catch(this.fail);
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
    void this.persistence.saveRequest(req).catch(this.fail);
  }

  removeRequest(id: string): void {
    this.db.requests = this.db.requests.filter((r) => r.id !== id);
    void this.persistence.deleteRequest(id).catch(this.fail);
  }
}

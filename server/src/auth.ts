import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "./config.js";
import type { Store } from "./store.js";
import type { PublicUser, User } from "./types.js";

const AVATARS = ["🦊", "🐺", "🐉", "👾", "🧙", "🐦‍⬛", "🐱", "👻", "🤖", "🥷", "🎭", "🦉", "💫", "🛰️", "🔮"];

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function toPublic(u: User): PublicUser {
  return {
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    isGuest: u.isGuest,
    stats: u.stats,
  };
}

export interface TokenPayload {
  sub: string;
  username: string;
  isGuest: boolean;
}

export function issueToken(u: User): string {
  const payload: TokenPayload = {
    sub: u.id,
    username: u.username,
    isGuest: u.isGuest,
  };
  const options: jwt.SignOptions = {
    expiresIn: config.tokenTtl as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

function validateUsername(username: string): string | null {
  const u = username.trim();
  if (u.length < 2 || u.length > 20) return "Username must be 2–20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return "Use only letters, numbers, and underscores";
  return null;
}

export class AuthError extends Error {}

export async function register(
  store: Store,
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  const err = validateUsername(username);
  if (err) throw new AuthError(err);
  if (password.length < 6) throw new AuthError("Password must be at least 6 characters");
  if (store.getUserByUsername(username)) throw new AuthError("Username already taken");

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: nanoid(12),
    username: username.trim(),
    usernameLower: username.trim().toLowerCase(),
    passwordHash,
    avatar: randomAvatar(),
    isGuest: false,
    createdAt: Date.now(),
    stats: { played: 0, wins: 0 },
  };
  store.createUser(user);
  return { user, token: issueToken(user) };
}

export async function login(
  store: Store,
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  const user = store.getUserByUsername(username);
  if (!user || !user.passwordHash) throw new AuthError("Invalid username or password");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError("Invalid username or password");
  return { user, token: issueToken(user) };
}

export function createGuest(store: Store, nick: string): { user: User; token: string } {
  const base = (nick || "Guest").trim().slice(0, 20) || "Guest";
  const user: User = {
    id: nanoid(12),
    username: base,
    usernameLower: `${base.toLowerCase()}#${nanoid(4)}`, // guests never collide / aren't searchable
    passwordHash: null,
    avatar: randomAvatar(),
    isGuest: true,
    createdAt: Date.now(),
    stats: { played: 0, wins: 0 },
  };
  store.createUser(user);
  return { user, token: issueToken(user) };
}

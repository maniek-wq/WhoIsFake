import { nanoid } from "nanoid";
import type { Store } from "./store.js";
import type { Presence } from "./presence.js";
import type { FriendsPayload, FriendStatus, FriendView } from "./types.js";

export class FriendError extends Error {}

function statusOf(presence: Presence, userId: string): FriendStatus {
  if (!presence.isOnline(userId)) return "offline";
  return presence.getRoom(userId) ? "in-game" : "online";
}

export function buildFriendsPayload(
  store: Store,
  presence: Presence,
  userId: string
): FriendsPayload {
  const friends: FriendView[] = store
    .getFriendIds(userId)
    .map((fid) => {
      const u = store.getUserById(fid);
      if (!u) return null;
      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        status: statusOf(presence, fid),
        roomCode: presence.getRoom(fid),
      } satisfies FriendView;
    })
    .filter((f): f is FriendView => f !== null)
    // online first, then in-game, then offline; alphabetical within
    .sort((a, b) => {
      const rank = { online: 0, "in-game": 1, offline: 2 } as const;
      return rank[a.status] - rank[b.status] || a.username.localeCompare(b.username);
    });

  const incoming = store.incomingRequests(userId).map((r) => {
    const from = store.getUserById(r.fromId);
    return {
      id: r.id,
      fromId: r.fromId,
      fromUsername: from?.username ?? "Unknown",
      fromAvatar: from?.avatar ?? "❔",
      createdAt: r.createdAt,
    };
  });

  const outgoing = store.outgoingRequests(userId).map((r) => {
    const to = store.getUserById(r.toId);
    return {
      id: r.id,
      fromId: r.toId, // shown as the target on the outgoing list
      fromUsername: to?.username ?? "Unknown",
      fromAvatar: to?.avatar ?? "❔",
      createdAt: r.createdAt,
    };
  });

  return { friends, incoming, outgoing };
}

/**
 * Sends (or auto-accepts) a friend request.
 * Returns the set of userIds whose friend payload changed and should be refreshed.
 */
export function requestFriend(
  store: Store,
  fromId: string,
  username: string
): string[] {
  const target = store.getUserByUsername(username);
  if (!target) throw new FriendError("No player with that username");
  if (target.isGuest) throw new FriendError("Guests can't be added as friends");
  if (target.id === fromId) throw new FriendError("You can't add yourself");
  if (store.areFriends(fromId, target.id)) throw new FriendError("Already friends");
  if (store.findRequest(fromId, target.id)) throw new FriendError("Request already sent");

  // If the target already sent us a request, accept it instead.
  const reverse = store.findRequest(target.id, fromId);
  if (reverse) {
    store.removeRequest(reverse.id);
    store.addFriendEdge(fromId, target.id);
    return [fromId, target.id];
  }

  store.addRequest({
    id: nanoid(10),
    fromId,
    toId: target.id,
    createdAt: Date.now(),
  });
  return [fromId, target.id];
}

export function respondRequest(
  store: Store,
  userId: string,
  requestId: string,
  accept: boolean
): string[] {
  const req = store.getRequestById(requestId);
  if (!req || req.toId !== userId) throw new FriendError("Request not found");
  store.removeRequest(req.id);
  if (accept) store.addFriendEdge(req.fromId, req.toId);
  return [req.fromId, req.toId];
}

export function removeFriend(store: Store, userId: string, friendId: string): string[] {
  if (!store.areFriends(userId, friendId)) throw new FriendError("Not friends");
  store.removeFriendEdge(userId, friendId);
  return [userId, friendId];
}

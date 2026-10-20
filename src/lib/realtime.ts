import "server-only";
import type { PoolClient } from "pg";
import { pool } from "@/db";

/**
 * Realtime transport built on PostgreSQL LISTEN / NOTIFY.
 * A single long-lived client fans events out to every SSE subscriber,
 * so no component ever polls the database.
 */
const CHANNEL = "sakhrti_events";

export type RealtimeEvent = {
  type: "order.created" | "order.updated" | "notification";
  orderCode?: string;
  orderId?: number;
  storeId?: number;
  userId?: number;
  status?: string;
  at: string;
};

type Listener = (event: RealtimeEvent) => void;

const globalForRt = globalThis as typeof globalThis & {
  __skhListeners?: Set<Listener>;
  __skhClient?: Promise<PoolClient> | null;
};

const listeners: Set<Listener> = (globalForRt.__skhListeners ??= new Set());

async function ensureListening() {
  if (globalForRt.__skhClient) return globalForRt.__skhClient;
  globalForRt.__skhClient = (async () => {
    const client = await pool.connect();
    client.on("notification", (msg) => {
      if (msg.channel !== CHANNEL || !msg.payload) return;
      try {
        const event = JSON.parse(msg.payload) as RealtimeEvent;
        listeners.forEach((l) => l(event));
      } catch {
        /* ignore malformed payloads */
      }
    });
    client.on("error", () => {
      globalForRt.__skhClient = null;
    });
    await client.query(`LISTEN ${CHANNEL}`);
    return client;
  })();
  return globalForRt.__skhClient;
}

export async function publish(event: Omit<RealtimeEvent, "at">) {
  const payload = JSON.stringify({ ...event, at: new Date().toISOString() });
  await pool.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
}

export async function subscribe(listener: Listener) {
  await ensureListening();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

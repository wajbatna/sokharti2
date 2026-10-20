"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SERVICE_FEE_CENTS } from "@/lib/utils";

/* ================================ CART ==================================== */

export type CartExtra = { id: number; name: string; price: number };

export type CartLine = {
  key: string;
  productId: number;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  quantity: number;
  notes: string;
  extras: CartExtra[];
};

export type CartStore = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  deliveryFee: number;
  minOrder: number;
  etaMin: number;
  etaMax: number;
};

type CartState = { store: CartStore | null; lines: CartLine[] };

type CartContextValue = CartState & {
  addLine: (store: CartStore, line: Omit<CartLine, "key">) => { replaced: boolean };
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "sakhrti.cart.v1";

const lineKey = (productId: number, extras: CartExtra[], notes: string) =>
  `${productId}:${extras.map((e) => e.id).sort().join("-")}:${notes.trim()}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ store: null, lines: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setState(JSON.parse(raw) as CartState);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addLine: CartContextValue["addLine"] = useCallback((store, line) => {
    let replaced = false;
    setState((prev) => {
      const sameStore = prev.store?.id === store.id;
      if (!sameStore && prev.lines.length) replaced = true;
      const lines = sameStore ? [...prev.lines] : [];
      const key = lineKey(line.productId, line.extras, line.notes);
      const existing = lines.findIndex((l) => l.key === key);
      if (existing >= 0) {
        lines[existing] = { ...lines[existing], quantity: lines[existing].quantity + line.quantity };
      } else {
        lines.push({ ...line, key });
      }
      return { store, lines };
    });
    return { replaced };
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setState((prev) => {
      const lines = prev.lines
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, quantity) } : l))
        .filter((l) => l.quantity > 0);
      return { store: lines.length ? prev.store : null, lines };
    });
  }, []);

  const removeLine = useCallback((key: string) => setQuantity(key, 0), [setQuantity]);
  const clear = useCallback(() => setState({ store: null, lines: [] }), []);

  const subtotal = useMemo(
    () => state.lines.reduce((sum, l) => sum + (l.basePrice + l.extras.reduce((s, e) => s + e.price, 0)) * l.quantity, 0),
    [state.lines],
  );
  const itemCount = useMemo(() => state.lines.reduce((s, l) => s + l.quantity, 0), [state.lines]);
  const deliveryFee = state.store?.deliveryFee ?? 0;
  const serviceFee = state.lines.length ? SERVICE_FEE_CENTS : 0;

  const value: CartContextValue = {
    ...state,
    addLine,
    setQuantity,
    removeLine,
    clear,
    subtotal,
    itemCount,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    drawerOpen,
    setDrawerOpen,
    hydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/* ============================== LOCATION ================================= */

export type DeliveryLocation = { city: string; address: string; lat?: number; lng?: number };

type LocationContextValue = {
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  hydrated: boolean;
};

const LocationContext = createContext<LocationContextValue | null>(null);
const LOC_KEY = "sakhrti.location.v1";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<DeliveryLocation | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOC_KEY);
      if (raw) setLocationState(JSON.parse(raw) as DeliveryLocation);
      else setPickerOpen(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setLocation = useCallback((loc: DeliveryLocation) => {
    setLocationState(loc);
    window.localStorage.setItem(LOC_KEY, JSON.stringify(loc));
    setPickerOpen(false);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        pickerOpen,
        openPicker: () => setPickerOpen(true),
        closePicker: () => setPickerOpen(false),
        hydrated,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}

/* =============================== TOASTS ================================== */

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
const ToastContext = createContext<{ push: (message: string, tone?: Toast["tone"]) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up pointer-events-auto w-full rounded-2xl px-4 py-3 text-center text-sm font-bold text-white shadow-lg ${
              t.tone === "error" ? "bg-rose-600" : t.tone === "info" ? "bg-[#111827]" : "bg-[#22C55E]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { push: () => {} };
}

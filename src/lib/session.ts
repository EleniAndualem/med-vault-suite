import { useEffect, useState } from "react";

import { medicines, seedSales, type Medicine, type Role, type Sale } from "./pharmacy-data";

const ROLE_KEY = "medicore.role";
const SALES_KEY = "medicore.sales";
const INVENTORY_KEY = "medicore.inventory";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener());

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

export function useSession() {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    setRoleState(read<Role | null>(ROLE_KEY, null));
    setReady(true);
    const listener = () => setRoleState(read<Role | null>(ROLE_KEY, null));
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    ready,
    role,
    signIn: (next: Role) => { write(ROLE_KEY, next); setRoleState(next); },
    signOut: () => { write(ROLE_KEY, null); setRoleState(null); },
  };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>(seedSales);

  useEffect(() => {
    setSales(read<Sale[]>(SALES_KEY, seedSales));
    const listener = () => setSales(read<Sale[]>(SALES_KEY, seedSales));
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    sales,
    addSale: (sale: Sale) => {
      const next = [sale, ...read<Sale[]>(SALES_KEY, seedSales)];
      write(SALES_KEY, next);
      setSales(next);
    },
    removeSale: (id: string) => {
      const next = read<Sale[]>(SALES_KEY, seedSales).filter((item) => item.id !== id);
      write(SALES_KEY, next);
      setSales(next);
    },
  };
}

export function useInventory() {
  const [inventory, setInventory] = useState<Medicine[]>(medicines);

  useEffect(() => {
    setInventory(read<Medicine[]>(INVENTORY_KEY, medicines));
    const listener = () => setInventory(read<Medicine[]>(INVENTORY_KEY, medicines));
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const save = (next: Medicine[]) => {
    write(INVENTORY_KEY, next);
    setInventory(next);
  };

  return {
    inventory,
    addMedicine: (medicine: Medicine) => save([medicine, ...read<Medicine[]>(INVENTORY_KEY, medicines)]),
    updateMedicine: (medicine: Medicine) => save(read<Medicine[]>(INVENTORY_KEY, medicines).map((item) => item.id === medicine.id ? medicine : item)),
    removeMedicine: (id: string) => save(read<Medicine[]>(INVENTORY_KEY, medicines).filter((item) => item.id !== id)),
  };
}

export type OrderItem = {
  medicineId: string;
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
};

export type Order = {
  id: string;
  createdAt: string;
  medicineId: string;
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
  patient: string;
  note: string;
  status: "Pending" | "Approved" | "Declined";
  requestedBy: string;
  items?: OrderItem[];
  paymentMethod?: "Cash" | "Card";
  paidAt?: string;
};

const ORDERS_KEY = "medicore.orders";

const seedOrders: Order[] = [
  { id: "ORD-2041", createdAt: "2026-09-18", medicineId: "amx500", name: "Amoxicillin 500 mg", qty: 6, unitPrice: 14.9, amount: 89.4, patient: "A. Bekele", note: "3x daily, 7 days", status: "Pending", requestedBy: "Dr. Selam Abera" },
  { id: "ORD-2042", createdAt: "2026-09-18", medicineId: "ins-gl", name: "Insulin Glargine", qty: 2, unitPrice: 46.2, amount: 92.4, patient: "M. Tesfaye", note: "Cold chain check", status: "Pending", requestedBy: "Dr. Selam Abera" },
];

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(seedOrders);

  useEffect(() => {
    setOrders(read<Order[]>(ORDERS_KEY, seedOrders));
    const listener = () => setOrders(read<Order[]>(ORDERS_KEY, seedOrders));
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    orders,
    addOrder: (order: Order) => {
      const next = [order, ...read<Order[]>(ORDERS_KEY, seedOrders)];
      write(ORDERS_KEY, next);
      setOrders(next);
    },
    setStatus: (id: string, status: Order["status"]) => {
      const next = read<Order[]>(ORDERS_KEY, seedOrders).map((item) => (item.id === id ? { ...item, status } : item));
      write(ORDERS_KEY, next);
      setOrders(next);
    },
    markPaid: (id: string, paymentMethod: "Cash" | "Card") => {
      const next = read<Order[]>(ORDERS_KEY, seedOrders).map((item) => item.id === id ? { ...item, status: "Approved" as const, paymentMethod, paidAt: new Date().toISOString() } : item);
      write(ORDERS_KEY, next);
      setOrders(next);
    },
  };
}

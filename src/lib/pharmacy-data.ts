export type Role = "Pharmacist" | "Cashier" | "Stock Manager";
export type Status = "In stock" | "Low stock" | "Expiring";

export type Medicine = {
  id: string;
  name: string;
  code: string;
  category: string;
  batch: string;
  qty: number;
  reorderPoint: number;
  expiry: string;
  expiringSoon?: boolean;
  cost: number;
  price: number;
  soldLast30: number;
};

export const medicines: Medicine[] = [
  { id: "atv20", name: "Atorvastatin 20 mg", code: "NDC 00093-0420", category: "Cardiovascular", batch: "ATV-4417", qty: 1240, reorderPoint: 400, expiry: "08/2027", cost: 11.2, price: 18.4, soldLast30: 320 },
  { id: "ctz10", name: "Cetirizine 10 mg", code: "NDC 00071-2210", category: "Antihistamine", batch: "CTZ-8830", qty: 3060, reorderPoint: 800, expiry: "02/2028", cost: 4.1, price: 7.25, soldLast30: 910 },
  { id: "amx500", name: "Amoxicillin 500 mg", code: "NDC 00092-1105", category: "Antibiotic", batch: "AMX-6612", qty: 2180, reorderPoint: 700, expiry: "11/2027", cost: 8.6, price: 14.9, soldLast30: 740 },
  { id: "sal100", name: "Salbutamol 100 mcg", code: "NDC 00049-7712", category: "Respiratory", batch: "SAL-0982", qty: 28, reorderPoint: 150, expiry: "05/2027", cost: 14.3, price: 22.75, soldLast30: 190 },
  { id: "ins-gl", name: "Insulin Glargine", code: "NDC 00034-5521", category: "Diabetes", batch: "INS-7741", qty: 34, reorderPoint: 60, expiry: "10/2026", expiringSoon: true, cost: 31.5, price: 46.2, soldLast30: 88 },
  { id: "lsp10", name: "Lisinopril 10 mg", code: "NDC 00067-3318", category: "Cardiovascular", batch: "LSP-2204", qty: 4520, reorderPoint: 900, expiry: "09/2027", cost: 6.4, price: 11.6, soldLast30: 610 },
  { id: "mtf500", name: "Metformin 500 mg", code: "NDC 00078-0735", category: "Diabetes", batch: "MTF-2214", qty: 42, reorderPoint: 500, expiry: "04/2027", cost: 5.2, price: 9.8, soldLast30: 880 },
  { id: "war5", name: "Warfarin 5 mg", code: "NDC 00056-0172", category: "Cardiovascular", batch: "WAR-1188", qty: 480, reorderPoint: 200, expiry: "10/2026", expiringSoon: true, cost: 7.3, price: 13.1, soldLast30: 150 },
  { id: "par500", name: "Paracetamol 500 mg", code: "NDC 00031-8801", category: "Analgesic", batch: "PAR-3390", qty: 6400, reorderPoint: 1500, expiry: "06/2028", cost: 2.1, price: 4.5, soldLast30: 2140 },
  { id: "ibu400", name: "Ibuprofen 400 mg", code: "NDC 00025-4412", category: "Analgesic", batch: "IBU-1145", qty: 2890, reorderPoint: 900, expiry: "03/2028", cost: 3.4, price: 6.2, soldLast30: 1180 },
  { id: "ome20", name: "Omeprazole 20 mg", code: "NDC 00186-0740", category: "Gastro", batch: "OME-5521", qty: 165, reorderPoint: 400, expiry: "01/2028", cost: 6.8, price: 12.4, soldLast30: 520 },
  { id: "azi250", name: "Azithromycin 250 mg", code: "NDC 00069-3051", category: "Antibiotic", batch: "AZI-2277", qty: 310, reorderPoint: 250, expiry: "12/2027", cost: 12.9, price: 21.5, soldLast30: 240 },
  { id: "cip500", name: "Ciprofloxacin 500 mg", code: "NDC 00093-0862", category: "Antibiotic", batch: "CIP-6033", qty: 96, reorderPoint: 300, expiry: "07/2027", cost: 9.1, price: 16.3, soldLast30: 310 },
  { id: "los50", name: "Losartan 50 mg", code: "NDC 00006-0952", category: "Cardiovascular", batch: "LOS-4412", qty: 1780, reorderPoint: 600, expiry: "05/2028", cost: 5.9, price: 10.9, soldLast30: 470 },
  { id: "gli5", name: "Glibenclamide 5 mg", code: "NDC 00087-6071", category: "Diabetes", batch: "GLI-7705", qty: 240, reorderPoint: 300, expiry: "11/2026", expiringSoon: true, cost: 4.6, price: 8.3, soldLast30: 260 },
  { id: "pre5", name: "Prednisolone 5 mg", code: "NDC 00054-4728", category: "Corticosteroid", batch: "PRE-9912", qty: 820, reorderPoint: 300, expiry: "02/2028", cost: 3.9, price: 7.6, soldLast30: 210 },
  { id: "ors", name: "ORS Sachets", code: "NDC 00074-3311", category: "Rehydration", batch: "ORS-2210", qty: 5120, reorderPoint: 1200, expiry: "09/2028", cost: 0.9, price: 2.1, soldLast30: 1630 },
  { id: "vitc", name: "Vitamin C 1000 mg", code: "NDC 00062-1122", category: "Supplement", batch: "VTC-3348", qty: 2450, reorderPoint: 700, expiry: "04/2028", cost: 2.8, price: 5.9, soldLast30: 980 },
  { id: "dox100", name: "Doxycycline 100 mg", code: "NDC 00143-3142", category: "Antibiotic", batch: "DOX-8811", qty: 58, reorderPoint: 250, expiry: "08/2027", cost: 7.7, price: 13.8, soldLast30: 290 },
  { id: "flu-vac", name: "Influenza Vaccine", code: "NDC 00005-1971", category: "Vaccine", batch: "FLU-1029", qty: 120, reorderPoint: 100, expiry: "12/2026", expiringSoon: true, cost: 18.4, price: 29.9, soldLast30: 96 },
];

export function statusOf(item: Medicine): Status {
  if (item.expiringSoon) return "Expiring";
  if (item.qty <= item.reorderPoint) return "Low stock";
  return "In stock";
}

export const stockValue = medicines.reduce((sum, item) => sum + item.qty * item.cost, 0);
export const lowStockItems = medicines.filter((item) => statusOf(item) === "Low stock");
export const expiringItems = medicines.filter((item) => statusOf(item) === "Expiring");

export type Sale = {
  id: string;
  date: string; // YYYY-MM-DD
  medicineId: string;
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
  cashier: string;
};

function sale(id: string, date: string, medicineId: string, qty: number, cashier = "Naomi Haile"): Sale {
  const item = medicines.find((m) => m.id === medicineId)!;
  return { id, date, medicineId, name: item.name, qty, unitPrice: item.price, amount: +(item.price * qty).toFixed(2), cashier };
}

export const seedSales: Sale[] = [
  sale("S-1041", "2026-09-14", "par500", 24),
  sale("S-1042", "2026-09-14", "amx500", 6),
  sale("S-1043", "2026-09-15", "ors", 40),
  sale("S-1044", "2026-09-15", "mtf500", 12),
  sale("S-1045", "2026-09-16", "ctz10", 18),
  sale("S-1046", "2026-09-16", "ibu400", 15),
  sale("S-1047", "2026-09-17", "vitc", 22),
  sale("S-1048", "2026-09-17", "atv20", 9),
  sale("S-1049", "2026-09-18", "ome20", 14),
  sale("S-1050", "2026-09-18", "par500", 30),
];

export const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const roleDetails: Record<Role, { user: string; greeting: string; summary: string }> = {
  Pharmacist: {
    user: "Dr. Selam Abera",
    greeting: "Clinical stock overview",
    summary: "Review prescriptions waiting to be dispensed, medicine availability, and safety-critical expiry alerts.",
  },
  Cashier: {
    user: "Naomi Haile",
    greeting: "Sales counter overview",
    summary: "Record sales at the counter, confirm prices, and check what is ready to sell right now.",
  },
  "Stock Manager": {
    user: "Yared Mekonnen",
    greeting: "Inventory control overview",
    summary: "Monitor stock value, reorder thresholds, incoming supply, and batch expiry.",
  },
};

export const prescriptions = [
  { id: "RX-10482", patient: "A. Bekele", medicine: "Amoxicillin 500 mg", note: "3× daily, 7 days", priority: "Priority" },
  { id: "RX-10483", patient: "M. Tesfaye", medicine: "Insulin Glargine", note: "Cold chain check", priority: "Priority" },
  { id: "RX-10484", patient: "S. Girma", medicine: "Lisinopril 10 mg", note: "Repeat, 30 days", priority: "Routine" },
  { id: "RX-10485", patient: "H. Yonas", medicine: "Salbutamol 100 mcg", note: "Counsel on inhaler use", priority: "Routine" },
];

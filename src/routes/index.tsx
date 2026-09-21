import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardCheck, CreditCard, Minus, PackagePlus, Pencil, Plus, Receipt, Search, ShoppingBag, Sparkles, Stethoscope, Trash2, WalletCards, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, GateScreen, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { recommendRestock } from "@/lib/ai.functions";
import { getStockSummary, money, prescriptions, roleDetails, statusOf, type Medicine } from "@/lib/pharmacy-data";
import { useInventory, useOrders, useSales, useSession, type Order, type OrderItem } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "MediCore Pharmacy Stock Management" },
    { name: "description", content: "Manage pharmacy medicines, prescription orders, in-person payments, sales, and stock alerts." },
    { property: "og:title", content: "MediCore Pharmacy Stock Management" },
    { property: "og:description", content: "A role-based operations workspace for one community pharmacy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DashboardPage,
});

type Suggestion = { medicine: string; suggestedQty: number; urgency: string; reason: string };
type CartLine = { medicine: Medicine; qty: number };

function DashboardPage() {
  const session = useSession();
  const { sales, addSale } = useSales();
  const { orders, addOrder, setStatus, markPaid } = useOrders();
  const { inventory, addMedicine, updateMedicine, removeMedicine } = useInventory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Low stock" | "Expiring">("All");
  const [notice, setNotice] = useState("");
  const [dispensed, setDispensed] = useState<string[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shopQuery, setShopQuery] = useState("");
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null | "new">(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const role = session.role;
  const summary = useMemo(() => getStockSummary(inventory), [inventory]);
  const visibleInventory = useMemo(() => inventory.filter((item) => {
    const matchesText = `${item.name} ${item.batch} ${item.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "All" || statusOf(item) === filter);
  }), [filter, inventory, query]);
  const shopItems = useMemo(() => inventory.filter((item) => `${item.name} ${item.category} ${item.code}`.toLowerCase().includes(shopQuery.toLowerCase())), [inventory, shopQuery]);

  if (!session.ready) return null;
  if (!role) return <GateScreen onSignIn={session.signIn} />;

  const detail = roleDetails[role];
  const pending = orders.filter((item) => item.status === "Pending");
  const todayRevenue = sales.filter((item) => item.date === "2026-09-18").reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = sales.reduce((sum, item) => sum + item.amount, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.medicine.price * line.qty, 0);
  const metrics: Array<[string, string, string]> = role === "Pharmacist"
    ? [["Available medicines", `${inventory.length}`, "in the formulary"], ["Prescription queue", `${prescriptions.length - dispensed.length}`, "awaiting review"], ["Orders awaiting payment", `${pending.length}`, "at the cashier"], ["Expiring soon", `${summary.expiringItems.length}`, "within 90 days"]]
    : role === "Cashier"
      ? [["Revenue today", money(todayRevenue), `${sales.length} recorded sales`], ["Awaiting payment", `${pending.length}`, "confirm in person"], ["Low stock", `${summary.lowStockItems.length}`, "offer alternatives"], ["Expiring soon", `${summary.expiringItems.length}`, "do not sell"]]
      : [["Stock value", money(summary.stockValue), `${inventory.length} medicines`], ["Total revenue", money(totalRevenue), "all recorded sales"], ["Low stock", `${summary.lowStockItems.length}`, "below reorder point"], ["Expiring soon", `${summary.expiringItems.length}`, "within 90 days"]];

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function addToCart(medicine: Medicine) {
    setCart((current) => {
      const existing = current.find((line) => line.medicine.id === medicine.id);
      return existing
        ? current.map((line) => line.medicine.id === medicine.id ? { ...line, qty: Math.min(line.qty + 1, medicine.qty) } : line)
        : [...current, { medicine, qty: 1 }];
    });
  }

  function changeCartQty(id: string, change: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.medicine.id !== id) return [line];
      const qty = Math.min(line.medicine.qty, line.qty + change);
      return qty > 0 ? [{ ...line, qty }] : [];
    }));
  }

  async function runRecommendations() {
    setAiState("loading"); setAiError("");
    try {
      const result = await recommendRestock({ data: { stock: inventory.map((item) => ({ name: item.name, qty: item.qty, reorderPoint: item.reorderPoint, soldLast30: item.soldLast30, price: item.price, expiry: item.expiry })) } });
      setSuggestions(result.suggestions); setAiState("idle");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Recommendations failed."); setAiState("error");
    }
  }

  function orderItems(order: Order): OrderItem[] {
    return order.items ?? [{ medicineId: order.medicineId, name: order.name, qty: order.qty, unitPrice: order.unitPrice, amount: order.amount }];
  }

  function completePayment() {
    if (!paymentOrder || !paymentConfirmed) return;
    orderItems(paymentOrder).forEach((line, index) => {
      addSale({ id: `S-${Date.now()}-${index + 1}`, date: new Date().toISOString().slice(0, 10), medicineId: line.medicineId, name: line.name, qty: line.qty, unitPrice: line.unitPrice, amount: line.amount, cashier: roleDetails.Cashier.user });
      const medicine = inventory.find((item) => item.id === line.medicineId);
      if (medicine) updateMedicine({ ...medicine, qty: Math.max(0, medicine.qty - line.qty) });
    });
    markPaid(paymentOrder.id, paymentMethod);
    announce(`${paymentOrder.id} paid and completed`);
    setPaymentOrder(null); setPaymentConfirmed(false);
  }

  return (
    <AppShell role={role} active="Overview" query={query} onQuery={setQuery} onSignOut={session.signOut} onBell={() => announce(`${summary.lowStockItems.length + summary.expiringItems.length} stock alerts to review`)}>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="max-w-2xl text-sm text-muted-foreground">{detail.summary}</p><p className="mt-1 font-mono text-[10px] uppercase text-primary">Signed in as {detail.user} · {role}</p></div>
        {role === "Pharmacist" && <Button onClick={() => setShowOrder(true)}><ShoppingBag className="size-4" />Create medicine order</Button>}
        {role === "Stock Manager" && <Button onClick={() => setEditingMedicine("new")}><PackagePlus className="size-4" />Add medicine</Button>}
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(([label, value, caption], index) => <article key={label} className="glass-panel animate-rise p-4 sm:p-5" style={{ animationDelay: `${index * 60}ms` }}><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>{index > 1 && <span className={cn("status-dot", index === 2 ? "bg-warning" : "bg-destructive")} />}</div><p className={cn("mt-3 text-2xl font-semibold", index === 2 && "text-warning", index === 3 && "text-destructive")}>{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{caption}</p></article>)}
      </section>

      {role === "Pharmacist" && <section className="grid gap-4 xl:grid-cols-3">
        <article className="glass-panel animate-rise p-5 xl:col-span-2">
          <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Stethoscope className="size-4" /></div><div><h2 className="text-sm font-semibold">Prescription fulfillment</h2><p className="mt-1 max-w-xl text-xs text-muted-foreground">Use this queue to verify the prescribed medicine, dosage, availability, and safety notes before preparing an order for cashier payment.</p></div></div><span className="font-mono text-[10px] text-muted-foreground">{prescriptions.length - dispensed.length} waiting</span></div>
          <div className="divide-y divide-border">{prescriptions.map((item) => {
            const done = dispensed.includes(item.id);
            const medicine = inventory.find((entry) => entry.name === item.medicine);
            return <div key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-medium">{item.medicine}</p><p className="font-mono text-[10px] text-muted-foreground">{item.id} · {item.patient} · {item.note}</p></div><div className="flex shrink-0 items-center gap-2">{item.priority === "Priority" && !done && <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-medium text-destructive">Priority</span>}{done ? <span className="rounded-full bg-success/12 px-2.5 py-1 text-[10px] font-medium text-success">Prepared</span> : <Button size="sm" variant="secondary" disabled={!medicine} onClick={() => { if (!medicine) return; addToCart(medicine); setDispensed((current) => [...current, item.id]); setShowOrder(true); }}>Prepare order</Button>}</div></div>;
          })}</div>
        </article>
        <article className="glass-panel animate-rise p-5"><div className="flex items-center gap-2"><ClipboardCheck className="size-4" /><h2 className="text-sm font-semibold">My orders</h2></div><div className="mt-2 divide-y divide-border">{orders.slice(0, 6).map((item) => <div key={item.id} className="py-2.5"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{orderItems(item).length} item{orderItems(item).length === 1 ? "" : "s"} · {money(item.amount)}</p><OrderStatus status={item.status} /></div><p className="font-mono text-[10px] text-muted-foreground">{item.id} · {item.patient}</p></div>)}</div>
        </article>
      </section>}

      {role === "Cashier" && <section className="grid gap-4 xl:grid-cols-3">
        <article className="glass-panel animate-rise overflow-hidden xl:col-span-2"><div className="flex items-start justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Orders awaiting payment</h2><p className="mt-1 text-xs text-muted-foreground">Complete an order only after receiving the full amount from the patient in person.</p></div><span className="rounded-full bg-warning/15 px-2.5 py-1 font-mono text-[10px] text-warning">{pending.length} unpaid</span></div>{pending.length === 0 ? <p className="p-8 text-center text-xs text-muted-foreground">No unpaid orders at the counter.</p> : <div className="divide-y divide-border">{pending.map((item) => <div key={item.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-semibold">{item.patient}</p><span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] text-warning">Payment due</span></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">{item.id} · {item.requestedBy} · {orderItems(item).length} item{orderItems(item).length === 1 ? "" : "s"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{orderItems(item).map((line) => <span key={line.medicineId} className="text-xs text-muted-foreground">{line.qty} × {line.name}</span>)}</div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><p className="text-lg font-semibold">{money(item.amount)}</p><Button onClick={() => { setPaymentOrder(item); setPaymentConfirmed(false); }}><WalletCards className="size-4" />Take payment</Button></div></div><Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => setStatus(item.id, "Declined")}>Cancel order</Button></div>)}</div>}</article>
        <article className="glass-panel animate-rise p-5"><div className="flex items-center gap-2"><Receipt className="size-4" /><h2 className="text-sm font-semibold">Revenue</h2></div><p className="mt-4 text-3xl font-semibold">{money(totalRevenue)}</p><p className="mt-1 text-xs text-muted-foreground">across {sales.length} recorded sales</p><Button variant="secondary" className="mt-4 w-full" onClick={() => { window.location.href = "/sales"; }}>Open sales records</Button></article>
      </section>}

      {role === "Stock Manager" && <>
        <section className="grid gap-4 xl:grid-cols-3"><article className="glass-panel p-5 xl:col-span-2"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Low stock medicines</h2><p className="mt-1 text-xs text-muted-foreground">Update quantities directly when stock is counted.</p></div><Button variant="ghost" size="sm" onClick={() => setFilter("Low stock")}>View all</Button></div><div className="mt-2 divide-y divide-border">{summary.lowStockItems.map((item) => <div key={item.id} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">Reorder point {item.reorderPoint} · {item.batch}</p></div><div className="flex items-center gap-3"><span className="font-mono text-sm text-warning">{item.qty}</span><Button size="sm" variant="secondary" onClick={() => setEditingMedicine(item)}>Update</Button></div></div>)}</div></article><article className="glass-panel p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Expiring soon</h2><Button variant="ghost" size="sm" onClick={() => setFilter("Expiring")}>Review</Button></div><div className="mt-2 divide-y divide-border">{summary.expiringItems.map((item) => <div key={item.id} className="py-2.5"><div className="flex items-center justify-between"><p className="text-sm font-medium">{item.name}</p><span className="font-mono text-[10px] text-destructive">{item.expiry}</span></div><p className="font-mono text-[10px] text-muted-foreground">{item.batch} · {item.qty} units</p></div>)}</div></article></section>
        <section className="glass-panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><div><h2 className="text-sm font-semibold">AI restock recommendations</h2><p className="text-[11px] text-muted-foreground">Based on your current medicine quantities and sales pace.</p></div></div><Button onClick={runRecommendations} disabled={aiState === "loading"}>{aiState === "loading" ? "Analyzing…" : "Generate suggestions"}</Button></div>{aiState === "error" && <p role="alert" className="mt-4 text-sm text-destructive">{aiError}</p>}{suggestions.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{suggestions.map((item) => <div key={item.medicine} className="rounded-lg border border-border bg-surface/70 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-medium">{item.medicine}</p><span className="text-[10px] font-medium text-warning">{item.urgency}</span></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">Suggested: {item.suggestedQty} units</p><p className="mt-1 text-[11px] text-muted-foreground">{item.reason}</p></div>)}</div>}{suggestions.length === 0 && aiState === "idle" && <p className="mt-4 text-sm text-muted-foreground">Generate a fresh restock plan when you are ready.</p>}</section>
      </>}

      <section className="glass-panel overflow-hidden"><div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-sm font-semibold">Medicines</h2><p className="font-mono text-[10px] text-muted-foreground">{visibleInventory.length} matching items</p></div><div className="ml-auto flex rounded-lg border border-border bg-surface/70 p-0.5">{(["All", "Low stock", "Expiring"] as const).map((item) => <Button key={item} variant={filter === item ? "default" : "ghost"} size="sm" onClick={() => setFilter(item)}>{item}</Button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead><tr className="font-mono text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-medium">Medicine</th><th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Batch</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Price</th><th className="px-3 py-3 font-medium">Expiry</th><th className="px-5 py-3 text-right font-medium">Status</th>{role === "Stock Manager" && <th className="px-5 py-3" />}</tr></thead><tbody className="divide-y divide-border">{visibleInventory.map((item) => { const status = statusOf(item); return <tr key={item.id} className="hover:bg-accent/50"><td className="px-5 py-3"><p className="font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.code}</p></td><td className="px-3 py-3 text-muted-foreground">{item.category}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.batch}</td><td className="px-3 py-3 text-right font-mono text-xs">{item.qty.toLocaleString()}</td><td className="px-3 py-3 text-right font-mono text-xs">{money(item.price)}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.expiry}</td><td className="px-5 py-3 text-right"><StatusBadge status={status} /></td>{role === "Stock Manager" && <td className="px-5 py-3"><div className="flex justify-end gap-1"><Button aria-label={`Edit ${item.name}`} variant="ghost" size="icon" onClick={() => setEditingMedicine(item)}><Pencil className="size-4" /></Button><Button aria-label={`Delete ${item.name}`} variant="ghost" size="icon" className="text-destructive" onClick={() => { if (window.confirm(`Delete ${item.name}?`)) { removeMedicine(item.id); announce(`${item.name} removed`); } }}><Trash2 className="size-4" /></Button></div></td>}</tr>; })}</tbody></table>{visibleInventory.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">No medicines match this search.</div>}</div></section>

      {showOrder && <OrderShop inventory={shopItems} cart={cart} query={shopQuery} total={cartTotal} onQuery={setShopQuery} onAdd={addToCart} onQty={changeCartQty} onClose={() => setShowOrder(false)} onSubmit={(patient, note) => {
        if (cart.length === 0) return;
        const items = cart.map((line) => ({ medicineId: line.medicine.id, name: line.medicine.name, qty: line.qty, unitPrice: line.medicine.price, amount: +(line.medicine.price * line.qty).toFixed(2) }));
        const first = items[0]; if (!first) return;
        addOrder({ id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`, createdAt: new Date().toISOString().slice(0, 10), medicineId: first.medicineId, name: first.name, qty: items.reduce((sum, item) => sum + item.qty, 0), unitPrice: first.unitPrice, amount: +items.reduce((sum, item) => sum + item.amount, 0).toFixed(2), patient, note, status: "Pending", requestedBy: roleDetails.Pharmacist.user, items });
        setCart([]); setShowOrder(false); announce("Order sent to the cashier for in-person payment");
      }} />}

      {paymentOrder && <PaymentDialog order={paymentOrder} items={orderItems(paymentOrder)} method={paymentMethod} confirmed={paymentConfirmed} onMethod={setPaymentMethod} onConfirmed={setPaymentConfirmed} onClose={() => { setPaymentOrder(null); setPaymentConfirmed(false); }} onComplete={completePayment} />}
      {editingMedicine && <MedicineDialog medicine={editingMedicine === "new" ? null : editingMedicine} onClose={() => setEditingMedicine(null)} onSave={(medicine) => { if (editingMedicine === "new") addMedicine(medicine); else updateMedicine(medicine); setEditingMedicine(null); announce(editingMedicine === "new" ? "Medicine added" : "Medicine updated"); }} />}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-panel">{notice}</div>}
    </AppShell>
  );
}

function OrderShop({ inventory, cart, query, total, onQuery, onAdd, onQty, onClose, onSubmit }: { inventory: Medicine[]; cart: CartLine[]; query: string; total: number; onQuery: (value: string) => void; onAdd: (medicine: Medicine) => void; onQty: (id: string, change: number) => void; onClose: () => void; onSubmit: (patient: string, note: string) => void }) {
  return <div className="fixed inset-0 z-50 bg-overlay p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="order-title"><div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-panel"><header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6"><div><h2 id="order-title" className="text-base font-semibold">Create medicine order</h2><p className="text-xs text-muted-foreground">Add medicines to the cart, then send the order to the cashier.</p></div><span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary">{cart.reduce((sum, line) => sum + line.qty, 0)} units</span><Button aria-label="Close order" variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></header><div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_380px]"><section className="min-h-0 overflow-y-auto p-4 sm:p-6"><label className="mb-4 flex h-10 items-center gap-2 rounded-lg border border-input bg-surface px-3"><Search className="size-4 text-muted-foreground" /><input aria-label="Search medicines to order" value={query} onChange={(event) => onQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search medicines or category" /></label><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{inventory.map((medicine) => <article key={medicine.id} className="rounded-lg border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><PackagePlus className="size-4" /></div><StatusBadge status={statusOf(medicine)} /></div><h3 className="mt-4 text-sm font-semibold">{medicine.name}</h3><p className="mt-1 text-[11px] text-muted-foreground">{medicine.category} · {medicine.qty} available</p><div className="mt-4 flex items-center justify-between"><span className="font-mono text-sm font-semibold">{money(medicine.price)}</span><Button size="sm" disabled={medicine.qty === 0} onClick={() => onAdd(medicine)}><Plus className="size-3.5" />Add</Button></div></article>)}</div></section><form className="flex min-h-0 flex-col border-t border-border bg-surface/70 lg:border-l lg:border-t-0" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit(String(form.get("patient")), String(form.get("note") ?? "")); }}><div className="border-b border-border p-5"><div className="flex items-center gap-2"><ShoppingBag className="size-4" /><h3 className="text-sm font-semibold">Order cart</h3></div></div><div className="min-h-32 flex-1 overflow-y-auto p-5">{cart.length === 0 ? <div className="grid h-full min-h-40 place-items-center text-center"><div><ShoppingBag className="mx-auto size-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Your cart is empty</p><p className="mt-1 text-xs text-muted-foreground">Choose medicines from the list.</p></div></div> : <div className="divide-y divide-border">{cart.map((line) => <div key={line.medicine.id} className="py-3"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium">{line.medicine.name}</p><p className="font-mono text-[10px] text-muted-foreground">{money(line.medicine.price)} each</p></div><p className="text-sm font-semibold">{money(line.medicine.price * line.qty)}</p></div><div className="mt-2 flex items-center gap-1"><Button type="button" aria-label={`Decrease ${line.medicine.name}`} variant="secondary" size="icon" className="size-7" onClick={() => onQty(line.medicine.id, -1)}><Minus className="size-3" /></Button><span className="w-8 text-center font-mono text-xs">{line.qty}</span><Button type="button" aria-label={`Increase ${line.medicine.name}`} variant="secondary" size="icon" className="size-7" onClick={() => onQty(line.medicine.id, 1)}><Plus className="size-3" /></Button></div></div>)}</div>}</div><div className="space-y-3 border-t border-border p-5"><label className="grid gap-1.5 text-xs font-medium">Patient name<input name="patient" required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" placeholder="Patient name" /></label><label className="grid gap-1.5 text-xs font-medium">Clinical note<input name="note" className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" placeholder="Dosage or handling note" /></label><div className="flex items-center justify-between border-t border-border pt-3"><span className="text-sm text-muted-foreground">Order total</span><span className="text-xl font-semibold">{money(total)}</span></div><Button type="submit" size="lg" className="w-full" disabled={cart.length === 0}>Send to cashier · {money(total)}</Button><p className="text-center text-[10px] text-muted-foreground">No sale is recorded until the cashier receives payment.</p></div></form></div></div></div>;
}

function PaymentDialog({ order, items, method, confirmed, onMethod, onConfirmed, onClose, onComplete }: { order: Order; items: OrderItem[]; method: "Cash" | "Card"; confirmed: boolean; onMethod: (method: "Cash" | "Card") => void; onConfirmed: (confirmed: boolean) => void; onClose: () => void; onComplete: () => void }) {
  return <div className="fixed inset-0 z-[55] grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title"><div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-panel"><header className="flex items-start justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] text-primary">{order.id}</p><h2 id="payment-title" className="mt-1 text-lg font-semibold">Receive in-person payment</h2><p className="mt-1 text-xs text-muted-foreground">Patient: {order.patient}</p></div><Button aria-label="Close payment" variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></header><div className="p-5"><div className="divide-y divide-border rounded-lg border border-border bg-background/60 px-4">{items.map((item) => <div key={item.medicineId} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.qty} × {money(item.unitPrice)}</p></div><p className="text-sm font-semibold">{money(item.amount)}</p></div>)}</div><div className="my-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">Amount due</span><span className="text-3xl font-semibold">{money(order.amount)}</span></div><fieldset><legend className="mb-2 text-xs font-medium">Payment method</legend><div className="grid grid-cols-2 gap-2">{(["Cash", "Card"] as const).map((option) => <label key={option} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm", method === option ? "border-primary bg-primary/10" : "border-border")}><input type="radio" className="sr-only" checked={method === option} onChange={() => onMethod(option)} />{option === "Cash" ? <WalletCards className="size-4" /> : <CreditCard className="size-4" />}{option}</label>)}</div></fieldset><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} /><span className="text-xs leading-relaxed"><strong className="block text-foreground">I received {money(order.amount)} in person</strong><span className="text-muted-foreground">Confirming this will complete the order and record the sale.</span></span></label></div><footer className="flex justify-end gap-2 border-t border-border p-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!confirmed} onClick={onComplete}><Check className="size-4" />Complete paid order</Button></footer></div></div>;
}

function MedicineDialog({ medicine, onClose, onSave }: { medicine: Medicine | null; onClose: () => void; onSave: (medicine: Medicine) => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="medicine-title"><form className="w-full max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-panel" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: medicine?.id ?? `med-${Date.now()}`, name: String(data.get("name")), code: String(data.get("code")), category: String(data.get("category")), batch: String(data.get("batch")), qty: Number(data.get("qty")), reorderPoint: Number(data.get("reorderPoint")), expiry: String(data.get("expiry")), cost: Number(data.get("cost")), price: Number(data.get("price")), soldLast30: medicine?.soldLast30 ?? 0 }); }}><div className="flex items-start justify-between"><div><h2 id="medicine-title" className="text-lg font-semibold">{medicine ? "Edit medicine" : "Add medicine"}</h2><p className="mt-1 text-xs text-muted-foreground">Manage the medicine’s identity, count, pricing, and expiry.</p></div><Button type="button" aria-label="Close medicine form" variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field name="name" label="Medicine name" defaultValue={medicine?.name} /><Field name="category" label="Category" defaultValue={medicine?.category} /><Field name="code" label="Medicine code" defaultValue={medicine?.code} /><Field name="batch" label="Batch number" defaultValue={medicine?.batch} /><Field name="qty" label="Quantity" type="number" min={0} defaultValue={medicine?.qty ?? 0} /><Field name="reorderPoint" label="Low-stock threshold" type="number" min={0} defaultValue={medicine?.reorderPoint ?? 0} /><Field name="cost" label="Unit cost" type="number" min={0} step="0.01" defaultValue={medicine?.cost ?? 0} /><Field name="price" label="Selling price" type="number" min={0} step="0.01" defaultValue={medicine?.price ?? 0} /><Field name="expiry" label="Expiry (MM/YYYY)" defaultValue={medicine?.expiry} placeholder="12/2028" /></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{medicine ? "Save changes" : "Add medicine"}</Button></div></form></div>;
}

function OrderStatus({ status }: { status: Order["status"] }) {
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium", status === "Approved" ? "bg-success/12 text-success" : status === "Declined" ? "bg-destructive/12 text-destructive" : "bg-warning/15 text-warning")}>{status === "Approved" ? "Paid" : status}</span>;
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-1.5 text-xs font-medium">{label}<input required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow focus:ring-2 focus:ring-ring" {...props} /></label>;
}

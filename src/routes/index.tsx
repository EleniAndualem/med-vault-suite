import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, PackagePlus, Receipt, ShoppingCart, Sparkles, Stethoscope, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, GateScreen, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { recommendRestock } from "@/lib/ai.functions";
import { expiringItems, lowStockItems, medicines, money, prescriptions, roleDetails, statusOf, stockValue } from "@/lib/pharmacy-data";
import { useOrders, useSales, useSession, type Order } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediCore Pharmacy Stock Management" },
      { name: "description", content: "Sign in as pharmacist, cashier, or stock manager to manage pharmacy inventory, orders, sales, and expiry alerts." },
      { property: "og:title", content: "MediCore Pharmacy Stock Management" },
      { property: "og:description", content: "A clear daily command center for pharmacists, cashiers, and stock managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

type Suggestion = { medicine: string; suggestedQty: number; urgency: string; reason: string };

function DashboardPage() {
  const session = useSession();
  const { sales } = useSales();
  const { orders, addOrder, setStatus } = useOrders();
  const { addSale } = useSales();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Low stock" | "Expiring">("All");
  const [notice, setNotice] = useState("");
  const [dispensed, setDispensed] = useState<string[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const role = session.role;
  const visibleInventory = useMemo(() => medicines.filter((item) => {
    const matchesText = `${item.name} ${item.batch} ${item.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "All" || statusOf(item) === filter);
  }), [filter, query]);

  if (!session.ready) return null;
  if (!role) return <GateScreen onSignIn={session.signIn} />;

  const detail = roleDetails[role];
  const pending = orders.filter((item) => item.status === "Pending");
  const todayRevenue = sales.filter((item) => item.date === "2026-09-18").reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = sales.reduce((sum, item) => sum + item.amount, 0);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  const metrics: Array<[string, string, string]> =
    role === "Pharmacist"
      ? [["Available medicines", `${medicines.length}`, "in the formulary"], ["Prescription queue", `${prescriptions.length - dispensed.length}`, "2 priority"], ["Low stock", `${lowStockItems.length}`, "below reorder point"], ["Expiring soon", `${expiringItems.length}`, "within 90 days"]]
      : role === "Cashier"
        ? [["Revenue today", money(todayRevenue), `${sales.length} recorded sales`], ["Orders to approve", `${pending.length}`, "from the pharmacist"], ["Low stock", `${lowStockItems.length}`, "offer alternatives"], ["Expiring soon", `${expiringItems.length}`, "do not sell"]]
        : [["Stock value", money(stockValue), `${medicines.length} active items`], ["Total revenue", money(totalRevenue), "all recorded sales"], ["Low stock", `${lowStockItems.length}`, "below reorder point"], ["Expiring soon", `${expiringItems.length}`, "within 90 days"]];

  async function runRecommendations() {
    setAiState("loading");
    setAiError("");
    try {
      const result = await recommendRestock({
        data: {
          stock: medicines.map((item) => ({ name: item.name, qty: item.qty, reorderPoint: item.reorderPoint, soldLast30: item.soldLast30, price: item.price, expiry: item.expiry })),
        },
      });
      setSuggestions(result.suggestions);
      setAiState("idle");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Recommendations failed.");
      setAiState("error");
    }
  }

  return (
    <AppShell role={role} active="Overview" query={query} onQuery={setQuery} onSignOut={session.signOut} onBell={() => announce(`${lowStockItems.length + expiringItems.length} stock alerts to review`)}>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-2xl text-sm text-muted-foreground">{detail.summary}</p>
          <p className="mt-1 font-mono text-[10px] uppercase text-primary">Signed in as {detail.user} · {role}</p>
        </div>
        {role === "Pharmacist" && <Button onClick={() => setShowOrder(true)}><ClipboardList className="size-4" />Order medicine</Button>}
        {role === "Stock Manager" && <Button onClick={() => setShowAdd(true)}><PackagePlus className="size-4" />Add stock</Button>}
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(([label, value, caption], index) => (
          <article key={label} className="glass-panel animate-rise p-4 sm:p-5" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>{index > 1 && <span className={cn("status-dot", index === 2 ? "bg-warning" : "bg-destructive")} />}</div>
            <p className={cn("mt-3 text-2xl font-semibold", index === 2 && "text-warning", index === 3 && "text-destructive")}>{value}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{caption}</p>
          </article>
        ))}
      </section>

      {role === "Pharmacist" && (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Stethoscope className="size-4 text-primary" /><h2 className="text-sm font-semibold">Prescription queue</h2></div><span className="font-mono text-[10px] text-muted-foreground">{prescriptions.length - dispensed.length} waiting</span></div>
            <div className="mt-2 divide-y divide-border">
              {prescriptions.map((item) => {
                const done = dispensed.includes(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.medicine}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{item.id} · {item.patient} · {item.note}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.priority === "Priority" && !done && <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-medium text-destructive">Priority</span>}
                      {done ? <span className="rounded-full bg-success/12 px-2.5 py-1 text-[10px] font-medium text-success">Dispensed</span> : <Button size="sm" variant="secondary" onClick={() => { setDispensed((prev) => [...prev, item.id]); announce(`${item.id} dispensed`); }}>Dispense</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
            <div className="flex items-center gap-2"><ClipboardList className="size-4" /><h2 className="text-sm font-semibold">My medicine orders</h2></div>
            {orders.length === 0 ? <p className="mt-6 text-center text-xs text-muted-foreground">No orders sent yet.</p> : (
              <div className="mt-2 divide-y divide-border">
                {orders.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{item.name}</p><OrderStatus status={item.status} /></div>
                    <p className="font-mono text-[10px] text-muted-foreground">{item.id} · {item.qty} × {money(item.unitPrice)} · {item.patient}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {role === "Cashier" && (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /><h2 className="text-sm font-semibold">Orders awaiting approval</h2></div><span className="font-mono text-[10px] text-muted-foreground">{pending.length} pending</span></div>
            {orders.length === 0 ? <p className="mt-6 text-center text-xs text-muted-foreground">No orders from the pharmacist yet.</p> : (
              <div className="mt-2 divide-y divide-border">
                {orders.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name} · {item.qty} units</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{item.id} · {item.patient} · {item.requestedBy} · {money(item.amount)}</p>
                      {item.note && <p className="text-[11px] text-muted-foreground">{item.note}</p>}
                    </div>
                    {item.status === "Pending" ? (
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setStatus(item.id, "Declined"); announce(`${item.id} declined`); }}>Decline</Button>
                        <Button size="sm" onClick={() => {
                          setStatus(item.id, "Approved");
                          addSale({ id: `S-${Date.now()}`, date: new Date().toISOString().slice(0, 10), medicineId: item.medicineId, name: item.name, qty: item.qty, unitPrice: item.unitPrice, amount: item.amount, cashier: roleDetails.Cashier.user });
                          announce(`${item.id} approved and recorded as a sale`);
                        }}><CheckCircle2 className="size-3.5" />Approve</Button>
                      </div>
                    ) : <OrderStatus status={item.status} />}
                  </div>
                ))}
              </div>
            )}
          </article>
          <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
            <div className="flex items-center gap-2"><Receipt className="size-4" /><h2 className="text-sm font-semibold">Revenue</h2></div>
            <p className="mt-4 text-3xl font-semibold">{money(totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">across {sales.length} recorded sales</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => { window.location.href = "/sales"; }}><ShoppingCart className="size-4" />Open sales page</Button>
          </article>
        </section>
      )}

      {role === "Stock Manager" && (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-warning" /><h2 className="text-sm font-semibold">Low stock thresholds</h2></div><Button variant="ghost" size="sm" onClick={() => setFilter("Low stock")}>View all</Button></div>
              <div className="mt-2 divide-y divide-border">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div><p className="text-sm font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">Reorder point {item.reorderPoint} · {item.batch}</p></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-sm font-medium text-warning">{item.qty}</span><Button size="sm" variant="secondary" onClick={() => announce(`Purchase order drafted for ${item.name}`)}>Reorder</Button></div>
                  </div>
                ))}
              </div>
            </article>
            <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-destructive" /><h2 className="text-sm font-semibold">Expiring soon</h2></div><Button variant="ghost" size="sm" onClick={() => setFilter("Expiring")}>Triage</Button></div>
              <div className="mt-2 divide-y divide-border">{expiringItems.map((item) => <div key={item.id} className="py-2.5"><div className="flex items-center justify-between"><p className="text-sm font-medium">{item.name}</p><span className="font-mono text-[10px] text-destructive">{item.expiry}</span></div><p className="font-mono text-[10px] text-muted-foreground">{item.batch} · {item.qty} units</p></div>)}</div>
            </article>
          </section>

          <section className="glass-panel animate-rise p-5 [animation-delay:300ms]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><div><h2 className="text-sm font-semibold">AI restock recommendations</h2><p className="text-[11px] text-muted-foreground">Based on current stock levels, reorder points, and the last 30 days of sales.</p></div></div>
              <Button onClick={runRecommendations} disabled={aiState === "loading"}>{aiState === "loading" ? "Analyzing…" : "Generate suggestions"}</Button>
            </div>
            {aiState === "error" && <p role="alert" className="mt-4 text-sm text-destructive">{aiError}</p>}
            {aiState === "loading" && <p className="mt-4 text-sm text-muted-foreground">Reviewing {medicines.length} medicines and recent sales…</p>}
            {suggestions.length > 0 && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {suggestions.map((item) => (
                  <div key={item.medicine} className="rounded-lg border border-border bg-surface/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.medicine}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", item.urgency === "High" ? "bg-destructive/12 text-destructive" : item.urgency === "Medium" ? "bg-warning/15 text-warning" : "bg-success/12 text-success")}>{item.urgency}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">Suggested order: {item.suggestedQty} units</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
            {suggestions.length === 0 && aiState === "idle" && <p className="mt-4 text-sm text-muted-foreground">No suggestions yet — generate a fresh restock plan.</p>}
          </section>
        </>
      )}

      <section className="glass-panel animate-rise overflow-hidden [animation-delay:320ms]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div><h2 className="text-sm font-semibold">Inventory</h2><p className="font-mono text-[10px] text-muted-foreground">{visibleInventory.length} matching items</p></div>
          <div className="ml-auto flex rounded-lg border border-border bg-surface/70 p-0.5">{(["All", "Low stock", "Expiring"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn("rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-colors", filter === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead><tr className="font-mono text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-medium">Medicine</th><th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Batch</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Price</th><th className="px-3 py-3 font-medium">Expiry</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {visibleInventory.map((item) => {
                const status = statusOf(item);
                return (
                  <tr key={item.id} className={cn("transition-colors hover:bg-accent/50", status === "Low stock" && "bg-warning/5", status === "Expiring" && "bg-destructive/5")}>
                    <td className="px-5 py-3"><p className="font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.code}</p></td>
                    <td className="px-3 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.batch}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{item.qty.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{money(item.price)}</td>
                    <td className={cn("px-3 py-3 font-mono text-xs", status === "Expiring" ? "text-destructive" : "text-muted-foreground")}>{item.expiry}</td>
                    <td className="px-5 py-3 text-right"><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleInventory.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">No medicines match this search.</div>}
        </div>
      </section>

      {showOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <form
            className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-panel"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const medicine = medicines.find((item) => item.id === String(form.get("medicine")))!;
              const qty = Number(form.get("qty"));
              addOrder({
                id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
                createdAt: new Date().toISOString().slice(0, 10),
                medicineId: medicine.id,
                name: medicine.name,
                qty,
                unitPrice: medicine.price,
                amount: +(medicine.price * qty).toFixed(2),
                patient: String(form.get("patient")),
                note: String(form.get("note") ?? ""),
                status: "Pending",
                requestedBy: roleDetails.Pharmacist.user,
              });
              setShowOrder(false);
              announce("Order sent to the cashier for approval");
            }}
          >
            <div className="flex items-center justify-between"><div><h2 id="order-title" className="text-lg font-semibold">Order medicine</h2><p className="text-xs text-muted-foreground">The cashier approves it before dispensing.</p></div><Button type="button" aria-label="Close dialog" variant="ghost" size="icon" onClick={() => setShowOrder(false)}><X className="size-4" /></Button></div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-xs font-medium">Medicine<select name="medicine" required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none">{medicines.map((item) => <option key={item.id} value={item.id}>{item.name} — {money(item.price)}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3">
                <Field name="qty" label="Quantity" type="number" min={1} defaultValue={1} />
                <Field name="patient" label="Patient" placeholder="e.g. A. Bekele" />
              </div>
              <Field name="note" label="Note" placeholder="Dosage or handling note" required={false} />
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowOrder(false)}>Cancel</Button><Button type="submit">Send to cashier</Button></div>
          </form>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="add-stock-title">
          <form className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-panel" onSubmit={(event) => { event.preventDefault(); setShowAdd(false); announce("Stock entry saved for review"); }}>
            <div className="flex items-center justify-between"><div><h2 id="add-stock-title" className="text-lg font-semibold">Add stock</h2><p className="text-xs text-muted-foreground">Record a new delivery for this pharmacy.</p></div><Button type="button" aria-label="Close dialog" variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="size-4" /></Button></div>
            <div className="mt-5 grid gap-4"><Field name="name" label="Medicine name" placeholder="e.g. Amoxicillin 500 mg" /><div className="grid grid-cols-2 gap-3"><Field name="batch" label="Batch number" placeholder="AMX-0000" /><Field name="qty" label="Quantity" type="number" placeholder="0" /></div><div className="grid grid-cols-2 gap-3"><Field name="expiry" label="Expiry date" type="month" /><Field name="cost" label="Unit cost" placeholder="0.00" /></div></div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save stock</Button></div>
          </form>
        </div>
      )}

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-panel">{notice}</div>}
    </AppShell>
  );
}

function OrderStatus({ status }: { status: Order["status"] }) {
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium", status === "Approved" ? "bg-success/12 text-success" : status === "Declined" ? "bg-destructive/12 text-destructive" : "bg-warning/15 text-warning")}>{status}</span>;
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-1.5 text-xs font-medium">{label}<input required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow focus:ring-2 focus:ring-ring" {...props} /></label>;
}

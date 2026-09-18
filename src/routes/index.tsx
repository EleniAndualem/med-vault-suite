import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Pill,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Stethoscope,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediCore Pharmacy Stock Management" },
      { name: "description", content: "Sign in as pharmacist, cashier, or stock manager to manage pharmacy inventory, sales, and expiry alerts." },
      { property: "og:title", content: "MediCore Pharmacy Stock Management" },
      { property: "og:description", content: "A clear daily command center for pharmacists, cashiers, and stock managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PharmacyApp,
});

type Role = "Pharmacist" | "Cashier" | "Stock Manager";
type Status = "In stock" | "Low stock" | "Expiring";

const inventory = [
  { name: "Atorvastatin 20 mg", code: "NDC 00093-0420", category: "Cardiovascular", batch: "ATV-4417", qty: 1240, expiry: "08/2027", price: 18.4, status: "In stock" as Status },
  { name: "Cetirizine 10 mg", code: "NDC 00071-2210", category: "Antihistamine", batch: "CTZ-8830", qty: 3060, expiry: "02/2028", price: 7.25, status: "In stock" as Status },
  { name: "Amoxicillin 500 mg", code: "NDC 00092-1105", category: "Antibiotic", batch: "AMX-6612", qty: 2180, expiry: "11/2027", price: 14.9, status: "In stock" as Status },
  { name: "Salbutamol 100 mcg", code: "NDC 00049-7712", category: "Respiratory", batch: "SAL-0982", qty: 28, expiry: "05/2027", price: 22.75, status: "Low stock" as Status },
  { name: "Insulin Glargine", code: "NDC 00034-5521", category: "Diabetes", batch: "INS-7741", qty: 34, expiry: "10/2026", price: 46.2, status: "Expiring" as Status },
  { name: "Lisinopril 10 mg", code: "NDC 00067-3318", category: "Cardiovascular", batch: "LSP-2204", qty: 4520, expiry: "09/2027", price: 11.6, status: "In stock" as Status },
  { name: "Metformin 500 mg", code: "NDC 00078-0735", category: "Diabetes", batch: "MTF-2214", qty: 42, expiry: "04/2027", price: 9.8, status: "Low stock" as Status },
  { name: "Warfarin 5 mg", code: "NDC 00056-0172", category: "Cardiovascular", batch: "WAR-1188", qty: 480, expiry: "10/2026", price: 13.1, status: "Expiring" as Status },
];

const prescriptions = [
  { id: "RX-10482", patient: "A. Bekele", medicine: "Amoxicillin 500 mg", note: "3× daily, 7 days", priority: "Priority" },
  { id: "RX-10483", patient: "M. Tesfaye", medicine: "Insulin Glargine", note: "Cold chain check", priority: "Priority" },
  { id: "RX-10484", patient: "S. Girma", medicine: "Lisinopril 10 mg", note: "Repeat, 30 days", priority: "Routine" },
  { id: "RX-10485", patient: "H. Yonas", medicine: "Salbutamol 100 mcg", note: "Counsel on inhaler use", priority: "Routine" },
];

const roleDetails: Record<Role, { user: string; greeting: string; summary: string; metrics: Array<[string, string, string]> }> = {
  Pharmacist: {
    user: "Dr. Selam Abera",
    greeting: "Clinical stock overview",
    summary: "Review prescriptions waiting to be dispensed, medicine availability, and safety-critical expiry alerts.",
    metrics: [["Available medicines", "1,270", "98.9% ready"], ["Prescription queue", "4", "2 priority"], ["Low stock", "14", "below reorder point"], ["Expiring soon", "7", "within 30 days"]],
  },
  Cashier: {
    user: "Naomi Haile",
    greeting: "Sales counter overview",
    summary: "Build a receipt, confirm prices, and check what is ready to sell right now.",
    metrics: [["Sales today", "$3,842", "126 transactions"], ["Open receipt", "0 items", "waiting"], ["Price updates", "3", "reviewed today"], ["Unavailable", "14", "offer alternatives"]],
  },
  "Stock Manager": {
    user: "Yared Mekonnen",
    greeting: "Inventory control overview",
    summary: "Monitor stock value, reorder thresholds, incoming supply, and batch expiry.",
    metrics: [["Stock value", "$248,910", "▲ 3.2% this week"], ["Active items", "1,284", "+12 restocked today"], ["Low stock", "14", "below reorder point"], ["Expiring soon", "7", "within 30 days"]],
  },
};

const roleIcon = { Pharmacist: Stethoscope, Cashier: ShoppingCart, "Stock Manager": Boxes };
const DEMO_CODE = "1234";
const money = (value: number) => `$${value.toFixed(2)}`;

function PharmacyApp() {
  const [role, setRole] = useState<Role | null>(null);
  if (!role) return <LoginScreen onSignIn={setRole} />;
  return <PharmacyDashboard key={role} role={role} onSignOut={() => setRole(null)} />;
}

function LoginScreen({ onSignIn }: { onSignIn: (role: Role) => void }) {
  const [selected, setSelected] = useState<Role>("Stock Manager");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 font-sans text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-lg bg-primary font-mono text-sm font-medium text-primary-foreground">MC</div>
          <div>
            <p className="text-sm font-semibold">MediCore</p>
            <p className="font-mono text-[9px] uppercase text-muted-foreground">Community pharmacy</p>
          </div>
        </div>
        <form
          className="glass-panel animate-rise space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() !== DEMO_CODE) {
              setError("Incorrect access code. Use 1234 for this demo.");
              return;
            }
            onSignIn(selected);
          }}
        >
          <div>
            <h1 className="text-lg font-semibold">Sign in to your workspace</h1>
            <p className="mt-1 text-xs text-muted-foreground">Choose your role — each one opens a different set of daily operations.</p>
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">Role</legend>
            {(Object.keys(roleDetails) as Role[]).map((item) => {
              const Icon = roleIcon[item];
              return (
                <label key={item} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors", selected === item ? "border-primary bg-primary/10" : "border-border hover:bg-accent")}>
                  <input type="radio" name="role" className="sr-only" checked={selected === item} onChange={() => setSelected(item)} />
                  <Icon className={cn("size-4", selected === item ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">{item}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{roleDetails[item].user}</span>
                </label>
              );
            })}
          </fieldset>
          <label className="grid gap-1.5 text-xs font-medium">
            Access code
            <input value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} inputMode="numeric" placeholder="1234" className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow focus:ring-2 focus:ring-ring" />
          </label>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Sign in</Button>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><ShieldCheck className="size-3.5" />Demo access code: 1234</p>
        </form>
      </div>
    </div>
  );
}

function PharmacyDashboard({ role, onSignOut }: { role: Role; onSignOut: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Low stock" | "Expiring">("All");
  const [mobileNav, setMobileNav] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");
  const [dispensed, setDispensed] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<Array<{ batch: string; name: string; price: number }>>([]);
  const detail = roleDetails[role];
  const visibleInventory = useMemo(() => inventory.filter((item) => {
    const matchesText = `${item.name} ${item.batch} ${item.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "All" || item.status === filter);
  }), [filter, query]);
  const receiptTotal = receipt.reduce((sum, item) => sum + item.price, 0);
  const metrics: Array<[string, string, string]> = role === "Cashier"
    ? [detail.metrics[0]!, ["Open receipt", `${receipt.length} items`, money(receiptTotal)], detail.metrics[2]!, detail.metrics[3]!]
    : role === "Pharmacist"
      ? [detail.metrics[0]!, ["Prescription queue", `${prescriptions.length - dispensed.length}`, "2 priority"], detail.metrics[2]!, detail.metrics[3]!]
      : detail.metrics;

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/15">
      <Sidebar role={role} mobileNav={mobileNav} onClose={() => setMobileNav(false)} onSignOut={onSignOut} />
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/75 backdrop-blur-2xl">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button aria-label="Open navigation" variant="secondary" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-4" /></Button>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{detail.greeting}</p>
              <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">THU 17 SEP · MEDICORE COMMUNITY PHARMACY</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-surface/75 px-3 text-sm text-muted-foreground shadow-sm md:flex">
                <Search className="size-4" />
                <input aria-label="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} className="w-48 bg-transparent text-foreground outline-none placeholder:text-muted-foreground" placeholder="Medicine, batch, NDC…" />
              </label>
              <Button aria-label="Open notifications" variant="secondary" size="icon" className="relative" onClick={() => announce("You have 4 stock alerts to review")}><Bell className="size-4" /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive font-mono text-[9px] text-destructive-foreground">4</span></Button>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium leading-tight">{detail.user}</p>
                <p className="font-mono text-[9px] uppercase text-muted-foreground">{role}</p>
              </div>
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">{role.split(" ").map((word) => word[0]).join("")}</div>
              <Button aria-label="Sign out" variant="secondary" size="icon" onClick={onSignOut}><LogOut className="size-4" /></Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <section className="sm:hidden">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface/75 px-3 text-sm text-muted-foreground"><Search className="size-4" /><input aria-label="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-foreground outline-none" placeholder="Search medicine or batch" /></label>
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="max-w-2xl text-sm text-muted-foreground">{detail.summary}</p><p className="mt-1 font-mono text-[10px] uppercase text-primary">Signed in as {detail.user} · {role}</p></div>
            {role === "Stock Manager" && <Button onClick={() => setShowAdd(true)}><PackagePlus className="size-4" />Add stock</Button>}
            {role === "Pharmacist" && <Button onClick={() => announce("Expiry triage list opened")}><AlertTriangle className="size-4" />Triage expiry</Button>}
            {role === "Cashier" && <Button onClick={() => { if (!receipt.length) return announce("Add an item to the receipt first"); setReceipt([]); announce(`Sale completed · ${money(receiptTotal)}`); }}><Receipt className="size-4" />Complete sale</Button>}
          </section>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {metrics.map(([label, value, caption], index) => <article key={label} className="glass-panel animate-rise p-4 sm:p-5" style={{ animationDelay: `${index * 60}ms` }}><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>{index > 1 && <span className={cn("status-dot", index === 2 ? "bg-warning" : "bg-destructive")} />}</div><p className={cn("mt-3 text-2xl font-semibold", index === 2 && "text-warning", index === 3 && "text-destructive")}>{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{caption}</p></article>)}
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
                          {done
                            ? <span className="rounded-full bg-success/12 px-2.5 py-1 text-[10px] font-medium text-success">Dispensed</span>
                            : <Button size="sm" variant="secondary" onClick={() => { setDispensed((prev) => [...prev, item.id]); announce(`${item.id} dispensed`); }}>Dispense</Button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
              <ExpiringPanel onTriage={() => setFilter("Expiring")} />
            </section>
          )}

          {role === "Cashier" && (
            <section className="grid gap-4 xl:grid-cols-3">
              <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShoppingCart className="size-4 text-primary" /><h2 className="text-sm font-semibold">Quick sell</h2></div><span className="font-mono text-[10px] text-muted-foreground">Tap to add to receipt</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {inventory.filter((item) => item.status !== "Expiring").slice(0, 6).map((item) => (
                    <button key={item.batch} onClick={() => { setReceipt((prev) => [...prev, { batch: item.batch, name: item.name, price: item.price }]); announce(`${item.name} added`); }} className="flex items-center justify-between rounded-lg border border-border bg-surface/70 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent">
                      <span className="truncate pr-2 font-medium">{item.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{money(item.price)}</span>
                    </button>
                  ))}
                </div>
              </article>
              <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Receipt className="size-4" /><h2 className="text-sm font-semibold">Current receipt</h2></div>{receipt.length > 0 && <Button variant="ghost" size="sm" onClick={() => setReceipt([])}>Clear</Button>}</div>
                {receipt.length === 0
                  ? <p className="mt-6 text-center text-xs text-muted-foreground">No items yet.</p>
                  : <div className="mt-2 divide-y divide-border">{receipt.map((item, index) => <div key={`${item.batch}-${index}`} className="flex items-center justify-between py-2 text-sm"><span className="truncate pr-2">{item.name}</span><span className="font-mono text-xs">{money(item.price)}</span></div>)}</div>}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="font-mono text-[10px] uppercase text-muted-foreground">Total</span><span className="text-lg font-semibold">{money(receiptTotal)}</span></div>
              </article>
            </section>
          )}

          {role === "Stock Manager" && (
            <section className="grid gap-4 xl:grid-cols-3">
              <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-warning" /><h2 className="text-sm font-semibold">Low stock thresholds</h2></div><Button variant="ghost" size="sm" onClick={() => setFilter("Low stock")}>View all</Button></div>
                <div className="mt-2 divide-y divide-border">{inventory.filter((item) => item.status === "Low stock").map((item) => <div key={item.batch} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">Reorder point 150 · {item.batch}</p></div><div className="flex items-center gap-3"><span className="font-mono text-sm font-medium text-warning">{item.qty}</span><Button size="sm" variant="secondary" onClick={() => announce(`Purchase order drafted for ${item.name}`)}>Reorder</Button></div></div>)}</div>
              </article>
              <ExpiringPanel onTriage={() => setFilter("Expiring")} />
            </section>
          )}

          <section className="glass-panel animate-rise overflow-hidden [animation-delay:320ms]">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-sm font-semibold">Inventory</h2><p className="font-mono text-[10px] text-muted-foreground">{visibleInventory.length} matching items</p></div><div className="ml-auto flex rounded-lg border border-border bg-surface/70 p-0.5">{(["All", "Low stock", "Expiring"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn("rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-colors", filter === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div><Button variant="secondary" size="sm"><SlidersHorizontal className="size-3.5" />Sort</Button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-sm"><thead><tr className="font-mono text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-medium">Medicine</th><th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Batch</th><th className="px-3 py-3 text-right font-medium">Qty</th>{role === "Cashier" && <th className="px-3 py-3 text-right font-medium">Price</th>}<th className="px-3 py-3 font-medium">Expiry</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{visibleInventory.map((item) => <tr key={item.batch} className={cn("transition-colors hover:bg-accent/50", item.status === "Low stock" && "bg-warning/5", item.status === "Expiring" && "bg-destructive/5")}><td className="px-5 py-3"><p className="font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.code}</p></td><td className="px-3 py-3 text-muted-foreground">{item.category}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.batch}</td><td className="px-3 py-3 text-right font-mono text-xs">{item.qty.toLocaleString()}</td>{role === "Cashier" && <td className="px-3 py-3 text-right font-mono text-xs">{money(item.price)}</td>}<td className={cn("px-3 py-3 font-mono text-xs", item.status === "Expiring" ? "text-destructive" : "text-muted-foreground")}>{item.expiry}</td><td className="px-5 py-3 text-right"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium", item.status === "In stock" ? "bg-success/12 text-success" : item.status === "Low stock" ? "bg-warning/15 text-warning" : "bg-destructive/12 text-destructive")}><span className={cn("size-1.5 rounded-full", item.status === "In stock" ? "bg-success" : item.status === "Low stock" ? "bg-warning" : "bg-destructive")} />{item.status}</span></td></tr>)}</tbody></table>{visibleInventory.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">No medicines match this search.</div>}</div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground"><span>Showing {visibleInventory.length} of {inventory.length}</span><div className="flex gap-1"><Button aria-label="Previous page" variant="secondary" size="icon" className="size-7"><ChevronLeft className="size-3.5" /></Button><span className="grid size-7 place-items-center rounded-md bg-foreground text-background">1</span><Button aria-label="Next page" variant="secondary" size="icon" className="size-7"><ChevronRight className="size-3.5" /></Button></div></div>
          </section>
        </main>
      </div>

      {showAdd && <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="add-stock-title"><form className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-panel" onSubmit={(event) => { event.preventDefault(); setShowAdd(false); announce("Stock entry saved for review"); }}><div className="flex items-center justify-between"><div><h2 id="add-stock-title" className="text-lg font-semibold">Add stock</h2><p className="text-xs text-muted-foreground">Record a new delivery for this pharmacy.</p></div><Button type="button" aria-label="Close dialog" variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="size-4" /></Button></div><div className="mt-5 grid gap-4"><Field label="Medicine name" placeholder="e.g. Amoxicillin 500 mg" /><div className="grid grid-cols-2 gap-3"><Field label="Batch number" placeholder="AMX-0000" /><Field label="Quantity" placeholder="0" type="number" /></div><div className="grid grid-cols-2 gap-3"><Field label="Expiry date" type="month" /><Field label="Unit cost" placeholder="$0.00" /></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save stock</Button></div></form></div>}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-panel">{notice}</div>}
    </div>
  );
}

function ExpiringPanel({ onTriage }: { onTriage: () => void }) {
  return (
    <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-destructive" /><h2 className="text-sm font-semibold">Expiring soon</h2></div><Button variant="ghost" size="sm" onClick={onTriage}>Triage</Button></div>
      <div className="mt-2 divide-y divide-border">{inventory.filter((item) => item.status === "Expiring").map((item, index) => <div key={item.batch} className="py-2.5"><div className="flex items-center justify-between"><p className="text-sm font-medium">{item.name}</p><span className="font-mono text-[10px] text-destructive">{18 + index * 7} d</span></div><p className="font-mono text-[10px] text-muted-foreground">{item.batch} · {item.qty} units</p></div>)}</div>
    </article>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-1.5 text-xs font-medium">{label}<input required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow focus:ring-2 focus:ring-ring" {...props} /></label>;
}

function Sidebar({ role, mobileNav, onClose, onSignOut }: { role: Role; mobileNav: boolean; onClose: () => void; onSignOut: () => void }) {
  const links = [
    [LayoutDashboard, "Overview"], [Pill, "Inventory", "1,284"],
    ...(role === "Cashier" ? [[ShoppingCart, "Sales counter", "12"], [Receipt, "Receipts", "126"]] : []),
    ...(role === "Pharmacist" ? [[Stethoscope, "Prescriptions", "4"], [ShieldCheck, "Safety checks"]] : []),
    ...(role === "Stock Manager" ? [[ClipboardList, "Purchase orders", "18"], [Truck, "Suppliers"], [PackagePlus, "Stock intake"]] : []),
    [FileChartColumn, "Reports"],
  ] as Array<[typeof Pill, string, string?]>;
  return <><button aria-label="Close navigation overlay" className={cn("fixed inset-0 z-40 bg-overlay lg:hidden", mobileNav ? "block" : "hidden")} onClick={onClose} /><aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-surface/90 backdrop-blur-2xl transition-transform lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center gap-2.5 px-5 pb-7 pt-6"><div className="grid size-9 place-items-center rounded-lg bg-primary font-mono text-sm font-medium text-primary-foreground">MC</div><div><p className="text-sm font-semibold">MediCore</p><p className="font-mono text-[9px] uppercase text-muted-foreground">Community pharmacy</p></div><Button aria-label="Close navigation" variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}><X className="size-4" /></Button></div><nav className="space-y-1 px-3" aria-label="Main navigation"><p className="px-3 py-2 font-mono text-[9px] uppercase text-muted-foreground">Operations</p>{links.map(([Icon, label, count]) => <button key={label} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", label === "Overview" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-4" /><span>{label}</span>{count && <span className="ml-auto font-mono text-[9px]">{count}</span>}</button>)}<p className="px-3 pb-2 pt-5 font-mono text-[9px] uppercase text-muted-foreground">System</p><button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><AlertTriangle className="size-4" />Alerts<span className="ml-auto grid size-4 place-items-center rounded-full bg-destructive font-mono text-[9px] text-destructive-foreground">4</span></button><button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="size-4" />Settings</button></nav><div className="mt-auto border-t border-border p-3"><div className="rounded-lg bg-background/65 p-3"><div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">{role.split(" ").map((word) => word[0]).join("")}</div><div className="min-w-0"><p className="truncate text-xs font-medium">{roleDetails[role].user}</p><p className="font-mono text-[9px] text-muted-foreground">{role} · On shift</p></div></div><Button variant="secondary" size="sm" className="mt-3 w-full" onClick={onSignOut}><LogOut className="size-3.5" />Sign out</Button></div></div></aside></>;
}

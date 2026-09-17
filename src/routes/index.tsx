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
  Menu,
  PackagePlus,
  Pill,
  Search,
  Settings,
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
      { name: "description", content: "Manage pharmacy inventory, low stock, expiring batches, and daily operations in one place." },
      { property: "og:title", content: "MediCore Pharmacy Stock Management" },
      { property: "og:description", content: "A clear daily command center for pharmacists, cashiers, and stock managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PharmacyDashboard,
});

type Role = "Pharmacist" | "Cashier" | "Stock Manager";
type Status = "In stock" | "Low stock" | "Expiring";

const inventory = [
  { name: "Atorvastatin 20 mg", code: "NDC 00093-0420", category: "Cardiovascular", batch: "ATV-4417", qty: 1240, expiry: "08/2027", price: "$18.40", status: "In stock" as Status },
  { name: "Cetirizine 10 mg", code: "NDC 00071-2210", category: "Antihistamine", batch: "CTZ-8830", qty: 3060, expiry: "02/2028", price: "$7.25", status: "In stock" as Status },
  { name: "Amoxicillin 500 mg", code: "NDC 00092-1105", category: "Antibiotic", batch: "AMX-6612", qty: 2180, expiry: "11/2027", price: "$14.90", status: "In stock" as Status },
  { name: "Salbutamol 100 mcg", code: "NDC 00049-7712", category: "Respiratory", batch: "SAL-0982", qty: 28, expiry: "05/2027", price: "$22.75", status: "Low stock" as Status },
  { name: "Insulin Glargine", code: "NDC 00034-5521", category: "Diabetes", batch: "INS-7741", qty: 34, expiry: "10/2026", price: "$46.20", status: "Expiring" as Status },
  { name: "Lisinopril 10 mg", code: "NDC 00067-3318", category: "Cardiovascular", batch: "LSP-2204", qty: 4520, expiry: "09/2027", price: "$11.60", status: "In stock" as Status },
  { name: "Metformin 500 mg", code: "NDC 00078-0735", category: "Diabetes", batch: "MTF-2214", qty: 42, expiry: "04/2027", price: "$9.80", status: "Low stock" as Status },
  { name: "Warfarin 5 mg", code: "NDC 00056-0172", category: "Cardiovascular", batch: "WAR-1188", qty: 480, expiry: "10/2026", price: "$13.10", status: "Expiring" as Status },
];

const roleDetails: Record<Role, { greeting: string; summary: string; metrics: Array<[string, string, string]> }> = {
  Pharmacist: {
    greeting: "Clinical stock overview",
    summary: "Review medicine availability, prescription demand, and safety-critical expiry alerts.",
    metrics: [["Available medicines", "1,270", "98.9% ready"], ["Prescription queue", "6", "2 priority"], ["Low stock", "14", "below reorder point"], ["Expiring soon", "7", "within 30 days"]],
  },
  Cashier: {
    greeting: "Sales counter overview",
    summary: "Find medicines quickly, confirm prices, and check what is ready to sell.",
    metrics: [["Sales today", "$3,842", "126 transactions"], ["Available items", "1,270", "ready to sell"], ["Price updates", "3", "reviewed today"], ["Unavailable", "14", "offer alternatives"]],
  },
  "Stock Manager": {
    greeting: "Inventory control overview",
    summary: "Monitor stock value, reorder thresholds, incoming supply, and batch expiry.",
    metrics: [["Stock value", "$248,910", "▲ 3.2% this week"], ["Active items", "1,284", "+12 restocked today"], ["Low stock", "14", "below reorder point"], ["Expiring soon", "7", "within 30 days"]],
  },
};

const roleIcon = { Pharmacist: Stethoscope, Cashier: ShoppingCart, "Stock Manager": Boxes };

function PharmacyDashboard() {
  const [role, setRole] = useState<Role>("Stock Manager");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Low stock" | "Expiring">("All");
  const [mobileNav, setMobileNav] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");
  const detail = roleDetails[role];
  const visibleInventory = useMemo(() => inventory.filter((item) => {
    const matchesText = `${item.name} ${item.batch} ${item.code}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "All" || item.status === filter);
  }), [filter, query]);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/15">
      <Sidebar role={role} mobileNav={mobileNav} onClose={() => setMobileNav(false)} />
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
              <div className="hidden items-center rounded-lg border border-border bg-surface/75 p-1 sm:flex" aria-label="Current role">
                {(Object.keys(roleDetails) as Role[]).map((item) => {
                  const Icon = roleIcon[item];
                  return <button key={item} onClick={() => setRole(item)} className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors", role === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}><Icon className="size-3.5" /><span className="hidden xl:inline">{item}</span></button>;
                })}
              </div>
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">{role === "Pharmacist" ? "PH" : role === "Cashier" ? "CA" : "SM"}</div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <section className="sm:hidden">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface/75 px-3 text-sm text-muted-foreground"><Search className="size-4" /><input aria-label="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-foreground outline-none" placeholder="Search medicine or batch" /></label>
            <select aria-label="Select role" value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none">{Object.keys(roleDetails).map((item) => <option key={item}>{item}</option>)}</select>
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="max-w-2xl text-sm text-muted-foreground">{detail.summary}</p><p className="mt-1 font-mono text-[10px] uppercase text-primary">Viewing as {role}</p></div>
            <Button onClick={() => setShowAdd(true)}><PackagePlus className="size-4" />Add stock</Button>
          </section>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {detail.metrics.map(([label, value, caption], index) => <article key={label} className="glass-panel animate-rise p-4 sm:p-5" style={{ animationDelay: `${index * 60}ms` }}><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>{index > 1 && <span className={cn("status-dot", index === 2 ? "bg-warning" : "bg-destructive")} />}</div><p className={cn("mt-3 text-2xl font-semibold", index === 2 && "text-warning", index === 3 && "text-destructive")}>{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{caption}</p></article>)}
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="glass-panel animate-rise p-5 xl:col-span-2 [animation-delay:240ms]">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-warning" /><h2 className="text-sm font-semibold">Low stock thresholds</h2></div><Button variant="ghost" size="sm" onClick={() => setFilter("Low stock")}>View all</Button></div>
              <div className="mt-2 divide-y divide-border">{inventory.filter((item) => item.status === "Low stock").concat(inventory.find((item) => item.name.startsWith("Lisinopril")) ?? []).slice(0, 3).map((item) => <div key={item.batch} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">Reorder point 150 · {item.batch}</p></div><span className="font-mono text-sm font-medium text-warning">{item.qty}</span></div>)}</div>
            </article>
            <article className="glass-panel animate-rise p-5 [animation-delay:280ms]">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot bg-destructive" /><h2 className="text-sm font-semibold">Expiring soon</h2></div><Button variant="ghost" size="sm" onClick={() => setFilter("Expiring")}>Triage</Button></div>
              <div className="mt-2 divide-y divide-border">{inventory.filter((item) => item.status === "Expiring").map((item, index) => <div key={item.batch} className="py-2.5"><div className="flex items-center justify-between"><p className="text-sm font-medium">{item.name}</p><span className="font-mono text-[10px] text-destructive">{18 + index * 7} d</span></div><p className="font-mono text-[10px] text-muted-foreground">{item.batch} · {item.qty} units</p></div>)}</div>
            </article>
          </section>

          <section className="glass-panel animate-rise overflow-hidden [animation-delay:320ms]">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-sm font-semibold">Inventory</h2><p className="font-mono text-[10px] text-muted-foreground">{visibleInventory.length} matching items</p></div><div className="ml-auto flex rounded-lg border border-border bg-surface/70 p-0.5">{(["All", "Low stock", "Expiring"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn("rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-colors", filter === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div><Button variant="secondary" size="sm"><SlidersHorizontal className="size-3.5" />Sort</Button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-sm"><thead><tr className="font-mono text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-medium">Medicine</th><th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Batch</th><th className="px-3 py-3 text-right font-medium">Qty</th>{role === "Cashier" && <th className="px-3 py-3 text-right font-medium">Price</th>}<th className="px-3 py-3 font-medium">Expiry</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{visibleInventory.map((item) => <tr key={item.batch} className={cn("transition-colors hover:bg-accent/50", item.status === "Low stock" && "bg-warning/5", item.status === "Expiring" && "bg-destructive/5")}><td className="px-5 py-3"><p className="font-medium">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.code}</p></td><td className="px-3 py-3 text-muted-foreground">{item.category}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.batch}</td><td className="px-3 py-3 text-right font-mono text-xs">{item.qty.toLocaleString()}</td>{role === "Cashier" && <td className="px-3 py-3 text-right font-mono text-xs">{item.price}</td>}<td className={cn("px-3 py-3 font-mono text-xs", item.status === "Expiring" ? "text-destructive" : "text-muted-foreground")}>{item.expiry}</td><td className="px-5 py-3 text-right"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium", item.status === "In stock" ? "bg-success/12 text-success" : item.status === "Low stock" ? "bg-warning/15 text-warning" : "bg-destructive/12 text-destructive")}><span className={cn("size-1.5 rounded-full", item.status === "In stock" ? "bg-success" : item.status === "Low stock" ? "bg-warning" : "bg-destructive")} />{item.status}</span></td></tr>)}</tbody></table>{visibleInventory.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">No medicines match this search.</div>}</div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground"><span>Showing {visibleInventory.length} of {inventory.length}</span><div className="flex gap-1"><Button aria-label="Previous page" variant="secondary" size="icon" className="size-7"><ChevronLeft className="size-3.5" /></Button><span className="grid size-7 place-items-center rounded-md bg-foreground text-background">1</span><Button aria-label="Next page" variant="secondary" size="icon" className="size-7"><ChevronRight className="size-3.5" /></Button></div></div>
          </section>
        </main>
      </div>

      {showAdd && <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="add-stock-title"><form className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-panel" onSubmit={(event) => { event.preventDefault(); setShowAdd(false); announce("Stock entry saved for review"); }}><div className="flex items-center justify-between"><div><h2 id="add-stock-title" className="text-lg font-semibold">Add stock</h2><p className="text-xs text-muted-foreground">Record a new delivery for this pharmacy.</p></div><Button type="button" aria-label="Close dialog" variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="size-4" /></Button></div><div className="mt-5 grid gap-4"><Field label="Medicine name" placeholder="e.g. Amoxicillin 500 mg" /><div className="grid grid-cols-2 gap-3"><Field label="Batch number" placeholder="AMX-0000" /><Field label="Quantity" placeholder="0" type="number" /></div><div className="grid grid-cols-2 gap-3"><Field label="Expiry date" type="month" /><Field label="Unit cost" placeholder="$0.00" /></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save stock</Button></div></form></div>}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-panel">{notice}</div>}
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-1.5 text-xs font-medium">{label}<input required className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow focus:ring-2 focus:ring-ring" {...props} /></label>;
}

function Sidebar({ role, mobileNav, onClose }: { role: Role; mobileNav: boolean; onClose: () => void }) {
  const links = [
    [LayoutDashboard, "Overview"], [Pill, "Inventory", "1,284"],
    ...(role === "Cashier" ? [[ShoppingCart, "Sales counter", "12"]] : [[ClipboardList, "Orders", "18"]]),
    ...(role === "Pharmacist" ? [[Stethoscope, "Prescriptions", "6"]] : []),
    [Truck, "Suppliers"], [FileChartColumn, "Reports"],
  ] as Array<[typeof Pill, string, string?]>;
  return <><button aria-label="Close navigation overlay" className={cn("fixed inset-0 z-40 bg-overlay lg:hidden", mobileNav ? "block" : "hidden")} onClick={onClose} /><aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-surface/90 backdrop-blur-2xl transition-transform lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center gap-2.5 px-5 pb-7 pt-6"><div className="grid size-9 place-items-center rounded-lg bg-primary font-mono text-sm font-medium text-primary-foreground">MC</div><div><p className="text-sm font-semibold">MediCore</p><p className="font-mono text-[9px] uppercase text-muted-foreground">Community pharmacy</p></div><Button aria-label="Close navigation" variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}><X className="size-4" /></Button></div><nav className="space-y-1 px-3" aria-label="Main navigation"><p className="px-3 py-2 font-mono text-[9px] uppercase text-muted-foreground">Operations</p>{links.map(([Icon, label, count]) => <button key={label} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", label === "Inventory" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="size-4" /><span>{label}</span>{count && <span className="ml-auto font-mono text-[9px]">{count}</span>}</button>)}<p className="px-3 pb-2 pt-5 font-mono text-[9px] uppercase text-muted-foreground">System</p><button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><AlertTriangle className="size-4" />Alerts<span className="ml-auto grid size-4 place-items-center rounded-full bg-destructive font-mono text-[9px] text-destructive-foreground">4</span></button><button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="size-4" />Settings</button></nav><div className="mt-auto border-t border-border p-3"><div className="rounded-lg bg-background/65 p-3"><div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">{role.split(" ").map((word) => word[0]).join("")}</div><div><p className="text-xs font-medium">Demo user</p><p className="font-mono text-[9px] text-muted-foreground">{role} · On shift</p></div></div></div></div></aside></>;
}
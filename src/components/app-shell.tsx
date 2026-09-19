import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Boxes, ClipboardList, FileChartColumn, LayoutDashboard, LogOut, Menu, PackagePlus, Pill, Receipt, Search, Settings, ShieldCheck, ShoppingCart, Stethoscope, Truck, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { roleDetails, type Role, type Status } from "@/lib/pharmacy-data";
import { cn } from "@/lib/utils";

const roleIcon = { Pharmacist: Stethoscope, Cashier: ShoppingCart, "Stock Manager": Boxes };
const DEMO_CODE = "1234";

export function GateScreen({ onSignIn }: { onSignIn: (role: Role) => void }) {
  const [selected, setSelected] = useState<Role>("Stock Manager");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 font-sans text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-lg bg-primary font-mono text-sm font-medium text-primary-foreground">MC</div>
          <div><p className="text-sm font-semibold">MediCore</p><p className="font-mono text-[9px] uppercase text-muted-foreground">Community pharmacy</p></div>
        </div>
        <form
          className="glass-panel animate-rise space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() !== DEMO_CODE) { setError("Incorrect access code. Use 1234 for this demo."); return; }
            onSignIn(selected);
          }}
        >
          <div><h1 className="text-lg font-semibold">Sign in to your workspace</h1><p className="mt-1 text-xs text-muted-foreground">Choose your role — each one opens a different set of daily operations.</p></div>
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
          <label className="grid gap-1.5 text-xs font-medium">Access code
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

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium", status === "In stock" ? "bg-success/12 text-success" : status === "Low stock" ? "bg-warning/15 text-warning" : "bg-destructive/12 text-destructive")}>
      <span className={cn("size-1.5 rounded-full", status === "In stock" ? "bg-success" : status === "Low stock" ? "bg-warning" : "bg-destructive")} />{status}
    </span>
  );
}

export function AppShell({ role, active, query, onQuery, onSignOut, onBell, children }: {
  role: Role;
  active: "Overview" | "Sales";
  query?: string;
  onQuery?: (value: string) => void;
  onSignOut: () => void;
  onBell?: () => void;
  children: React.ReactNode;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const detail = roleDetails[role];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/15">
      <Sidebar role={role} active={active} mobileNav={mobileNav} onClose={() => setMobileNav(false)} onSignOut={onSignOut} />
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/75 backdrop-blur-2xl">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button aria-label="Open navigation" variant="secondary" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-4" /></Button>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{active === "Sales" ? "Sales records" : detail.greeting}</p>
              <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">MEDICORE COMMUNITY PHARMACY</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {onQuery && (
                <label className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-surface/75 px-3 text-sm text-muted-foreground shadow-sm md:flex">
                  <Search className="size-4" />
                  <input aria-label="Search inventory" value={query} onChange={(event) => onQuery(event.target.value)} className="w-48 bg-transparent text-foreground outline-none placeholder:text-muted-foreground" placeholder="Medicine, batch, NDC…" />
                </label>
              )}
              {onBell && <Button aria-label="Open notifications" variant="secondary" size="icon" className="relative" onClick={onBell}><Bell className="size-4" /></Button>}
              <div className="hidden text-right sm:block"><p className="text-xs font-medium leading-tight">{detail.user}</p><p className="font-mono text-[9px] uppercase text-muted-foreground">{role}</p></div>
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">{role.split(" ").map((word) => word[0]).join("")}</div>
              <Button aria-label="Sign out" variant="secondary" size="icon" onClick={onSignOut}><LogOut className="size-4" /></Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ role, active, mobileNav, onClose, onSignOut }: { role: Role; active: string; mobileNav: boolean; onClose: () => void; onSignOut: () => void }) {
  const links: Array<[typeof Pill, string, string]> = [
    [LayoutDashboard, "Overview", "/"],
    [Receipt, "Sales", "/sales"],
    ...(role === "Pharmacist" ? ([[Stethoscope, "Prescriptions", "/"], [ClipboardList, "My orders", "/"]] as Array<[typeof Pill, string, string]>) : []),
    ...(role === "Cashier" ? ([[ClipboardList, "Approvals", "/"]] as Array<[typeof Pill, string, string]>) : []),
    ...(role === "Stock Manager" ? ([[Pill, "Inventory", "/"], [Truck, "Suppliers", "/"], [PackagePlus, "Stock intake", "/"]] as Array<[typeof Pill, string, string]>) : []),
    [FileChartColumn, "Reports", "/"],
  ];

  return (
    <>
      <button aria-label="Close navigation overlay" className={cn("fixed inset-0 z-40 bg-overlay lg:hidden", mobileNav ? "block" : "hidden")} onClick={onClose} />
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-border bg-surface/90 backdrop-blur-2xl transition-transform lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-2.5 px-5 pb-7 pt-6">
          <div className="grid size-9 place-items-center rounded-lg bg-primary font-mono text-sm font-medium text-primary-foreground">MC</div>
          <div><p className="text-sm font-semibold">MediCore</p><p className="font-mono text-[9px] uppercase text-muted-foreground">Community pharmacy</p></div>
          <Button aria-label="Close navigation" variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <nav className="space-y-1 px-3" aria-label="Main navigation">
          <p className="px-3 py-2 font-mono text-[9px] uppercase text-muted-foreground">Operations</p>
          {links.map(([Icon, label, to], index) => (
            <Link key={`${label}-${index}`} to={to} onClick={onClose} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", label === active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
              <Icon className="size-4" /><span>{label}</span>
            </Link>
          ))}
          <p className="px-3 pb-2 pt-5 font-mono text-[9px] uppercase text-muted-foreground">System</p>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><AlertTriangle className="size-4" />Alerts</button>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="size-4" />Settings</button>
        </nav>
        <div className="mt-auto border-t border-border p-3">
          <div className="rounded-lg bg-background/65 p-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">{role.split(" ").map((word) => word[0]).join("")}</div>
              <div className="min-w-0"><p className="truncate text-xs font-medium">{roleDetails[role].user}</p><p className="font-mono text-[9px] text-muted-foreground">{role} · On shift</p></div>
            </div>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={onSignOut}><LogOut className="size-3.5" />Sign out</Button>
          </div>
        </div>
      </aside>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, GateScreen } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { money, roleDetails } from "@/lib/pharmacy-data";
import { useInventory, useSales, useSession } from "@/lib/session";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales records — MediCore Pharmacy" },
      { name: "description", content: "Record each pharmacy sale with date, medicine, quantity and amount, and track total revenue." },
      { property: "og:title", content: "Sales records — MediCore Pharmacy" },
      { property: "og:description", content: "Record each pharmacy sale and track total revenue at the counter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const session = useSession();
  const { sales, addSale, removeSale } = useSales();
  const { inventory } = useInventory();
  const [medicineId, setMedicineId] = useState("");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState("2026-09-18");
  const [notice, setNotice] = useState("");

  const selected = inventory.find((item) => item.id === medicineId) ?? inventory[0];
  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, item) => sum + item.amount, 0);
    const units = sales.reduce((sum, item) => sum + item.qty, 0);
    return { revenue, units, average: sales.length ? revenue / sales.length : 0 };
  }, [sales]);

  if (!session.ready) return null;
  if (!session.role) return <GateScreen onSignIn={session.signIn} />;
  const canRecord = session.role === "Cashier";

  return (
    <AppShell role={session.role} active="Sales" onSignOut={session.signOut}>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {([["Total revenue", money(totals.revenue)], ["Sales recorded", `${sales.length}`], ["Units sold", `${totals.units}`], ["Average sale", money(totals.average)]] as const).map(([label, value]) => (
          <article key={label} className="glass-panel animate-rise p-4 sm:p-5">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      {canRecord ? (
        <section className="glass-panel animate-rise p-5">
          <div className="flex items-center gap-2"><Receipt className="size-4 text-primary" /><h2 className="text-sm font-semibold">Record a sale</h2></div>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_160px_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selected) return;
              addSale({ id: `S-${Date.now()}`, date, medicineId: selected.id, name: selected.name, qty, unitPrice: selected.price, amount: +(selected.price * qty).toFixed(2), cashier: roleDetails.Cashier.user });
              setQty(1);
              setNotice(`Recorded ${qty} × ${selected.name}`);
              window.setTimeout(() => setNotice(""), 2600);
            }}
          >
            <label className="grid gap-1.5 text-xs font-medium">Medicine
              <select value={medicineId} onChange={(event) => setMedicineId(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none">
                 {inventory.map((item) => <option key={item.id} value={item.id}>{item.name} — {money(item.price)}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Quantity
              <input type="number" min={1} value={qty} onChange={(event) => setQty(Math.max(1, Number(event.target.value)))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none" />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none" />
            </label>
            <Button type="submit" disabled={!selected}>Add sale · {money((selected?.price ?? 0) * qty)}</Button>
          </form>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Only the cashier records sales. You are viewing the sales history in read-only mode.</p>
      )}

      <section className="glass-panel animate-rise overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div><h2 className="text-sm font-semibold">Sales history</h2><p className="font-mono text-[10px] text-muted-foreground">{sales.length} records</p></div>
          <span className="text-sm font-semibold">{money(totals.revenue)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="font-mono text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Medicine</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Unit price</th><th className="px-3 py-3 text-right font-medium">Amount</th><th className="px-3 py-3 font-medium">Cashier</th>{canRecord && <th className="px-5 py-3" />}</tr></thead>
            <tbody className="divide-y divide-border">
              {sales.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.date}</td>
                  <td className="px-3 py-3 font-medium">{item.name}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{item.qty}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{money(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-medium">{money(item.amount)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{item.cashier}</td>
                  {canRecord && <td className="px-5 py-3 text-right"><Button aria-label={`Remove sale ${item.id}`} variant="ghost" size="icon" onClick={() => removeSale(item.id)}><Trash2 className="size-4" /></Button></td>}
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">No sales recorded yet.</div>}
        </div>
      </section>

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-panel">{notice}</div>}
    </AppShell>
  );
}

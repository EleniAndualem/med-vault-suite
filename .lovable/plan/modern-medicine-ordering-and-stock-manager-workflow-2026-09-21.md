# Modern medicine ordering and stock-manager workflow

## What will change
- Replace the pharmacist’s basic order form with a shop-style medicine picker, cart, quantity controls, patient details, and order summary.
- Keep prescription fulfillment as the pharmacist’s clinical workspace: review the prescription, verify the medicine and instructions, then prepare it for cashier payment. Add a concise explanation in that section so its purpose is clear.
- Change cashier approval into an in-person payment flow. The cashier must open the payment step, confirm cash was received, and only then complete the order and record the sale.
- Remove supplier-related navigation and language from the stock-manager experience.
- Give the stock manager working medicine management actions: add, edit, adjust quantities/prices, and delete medicines.

## Technical details
- Extend locally saved demo data for carts, multi-item orders, payment state, and editable inventory.
- Preserve existing seeded medicines, sales history, role-based login, and AI restock recommendations.
- Recalculate stock alerts, values, search results, and recommendations from the editable inventory.
- Verify pharmacist ordering, cashier payment confirmation, stock CRUD, desktop/mobile layout, and app errors.

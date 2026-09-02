# Inventory Tracker

Build an inventory management app called Stackwise.

Stackwise gives businesses a clear, real-time view of everything they have in stock — what's on hand, what's running low, what's on order, and where it's all coming from. It should feel like a command center for inventory: open the app and instantly know the health of your stock without digging through spreadsheets. This is a template designed to be remixed and adapted for any business that tracks physical goods — retail shops, warehouses, restaurants, clinics, maker spaces, or internal supply rooms.

Who it's for

Inventory Managers who track stock day-to-day, receive shipments, and fulfill internal requests

Admins who configure the system, manage suppliers, set reorder rules, and review analytics

Staff / Requestors who browse available inventory, submit requests for items, and report usage or issues

Demo Mode and Authentication

Since this app is a template meant to be remixed, it should support two ways to get in:

Demo mode — the default experience. When someone opens the app for the first time, they see a prominent "Try Demo" button on the landing page alongside the standard sign-in option. Clicking it drops them straight into the app as a demo admin user with full access to all features and pre-loaded seed data. No account creation, no email, no password. The demo session should feel fully functional — users can browse, create, edit, and delete anything. A subtle persistent banner at the top reminds them they're in demo mode and invites them to create a real account when ready. Demo data resets on each new demo session so the experience is always clean.

Real authentication — for people who remix the template and deploy it for their own business. Standard email and password sign-up and sign-in. New users default to the Requestor role. Admins can promote users through the admin panel. When real auth is active and a user is signed in, the demo banner disappears and everything persists normally.

The template should be structured so that switching from demo mode to real auth is simple and obvious — a developer remixing the project should be able to plug in their own auth provider and database without reworking the app's structure.

Home Dashboard

When a user opens the app, they should immediately see:

A real-time stock health summary — total SKUs tracked, items in stock, items running low, and items out of stock, displayed as clear metric cards

A "needs attention" section highlighting items below their reorder threshold, pending purchase orders, and items with expiring shelf life if applicable

Recent activity feed showing the last 15–20 stock movements (received, shipped, adjusted, requested)

A quick search bar front and center to jump to any item by name, SKU, or barcode

Product / Item Catalog

The core registry of everything being tracked. Each item should have:

Name, description, and optional image

SKU and barcode number (scannable)

Category and tags for flexible organization (e.g. "Electronics > Cables" or tags like "fragile", "perishable")

Unit of measure (each, box, case, kg, liter, etc.)

Current quantity on hand, calculated automatically from stock movements

Reorder threshold — the quantity at which an alert is triggered

Reorder quantity — the suggested amount to order when restocking

Preferred supplier (linked from the supplier directory)

Cost per unit and sale price if applicable

Location within the warehouse or facility (aisle, shelf, bin)

Status: active, discontinued, or archived

Custom fields — admins should be able to add their own fields so any business can track what matters to them (e.g. lot number, expiration date, color, size)

Users should be able to browse the catalog with filters for category, supplier, stock status (in stock, low, out of stock), and location. Bulk editing should be supported — select multiple items and update category, supplier, location, or status in one action.

Stock Movements

Every change to inventory should be tracked as a stock movement event with a clear audit trail. Movement types include:

Received — items arriving from a supplier or purchase order

Shipped / Issued — items leaving inventory (sold, fulfilled, distributed internally)

Adjusted — manual corrections for damage, loss, miscounts, or returns

Transferred — items moved between locations within the organization

Each movement records the item, quantity, direction (in or out), timestamp, who performed it, a reference number or note, and the resulting new quantity. Users should be able to log movements manually or have them generated automatically from purchase orders and requests.

The app should maintain a full movement history per item so anyone can see exactly how the current quantity was arrived at.

Purchase Orders

When stock is low or a reorder is triggered, users should be able to create a purchase order:

Select a supplier from the directory

Add line items with quantities and expected unit costs

The system should auto-suggest items that are at or below their reorder threshold and pre-fill the reorder quantity

Set an expected delivery date

Track the order through statuses: draft, submitted, partially received, fully received, cancelled

When a shipment arrives, the user marks items as received (partial or full), and stock levels update automatically

Each purchase order should have a printable or downloadable summary

Supplier Directory

A dedicated section to manage all suppliers:

Company name, contact person, email, phone, address

Notes and terms (payment terms, lead times, minimum order quantities)

Linked items — see which products come from this supplier

Order history — a log of all purchase orders placed with this supplier

Performance indicators — average lead time and fulfillment accuracy calculated from past orders

Reorder Alerts and Notifications

The alert system should be proactive, not just reactive:

When an item's quantity drops to or below its reorder threshold, flag it on the dashboard and send a notification

When an item hits zero, escalate the alert visually

When a purchase order is expected to arrive, send a reminder

When a purchase order is overdue, flag it prominently

Configurable notification preferences — in-app alerts, and optionally email digests (daily or weekly summary of low stock and pending orders)

Inventory Requests

Staff or requestors should be able to submit a request for items they need:

Select items from the catalog, specify quantities, add a reason or project reference

Requests go into a queue for inventory managers to approve, partially fulfill, or decline

Approved requests automatically generate a stock movement (issued) and reduce inventory

Requestors can see the status of their requests: pending, approved, fulfilled, declined

Barcode and Quick Entry

To support fast warehouse workflows:

Items should display a barcode on their detail page that can be printed as a label

A quick-entry mode where users type or scan a barcode to pull up an item and immediately log a stock movement (receive, issue, or adjust) without navigating through menus

Bulk import and export via CSV for initial setup or periodic reconciliation

Locations and Warehouses

For businesses with multiple storage areas:

Define locations as a flexible hierarchy — warehouse, zone, aisle, shelf, bin

Assign items to specific locations

Filter and browse inventory by location

Transfer stock between locations with a logged movement

See a per-location inventory summary

Admin Settings

Admins have full system configuration access:

Categories and tags — create and manage the taxonomy for organizing items

Custom fields — define additional fields that appear on all or specific categories of items

User management — invite users, assign roles (Admin, Inventory Manager, Requestor)

Reorder defaults — set global default reorder thresholds and quantities that can be overridden per item

Locations — manage the location hierarchy

Data management — CSV import/export for items, suppliers, and movements; option to reset demo data

Analytics and Reporting

A reporting section with visual dashboards:

Stock overview — current inventory value, item counts by status (in stock, low, out of stock), category breakdown

Movement trends — chart of items received vs issued over time (daily, weekly, monthly) to spot trends and seasonality

Turnover rate — which items move fast and which sit idle, helping identify dead stock

Reorder frequency — how often each item triggers a reorder, useful for adjusting thresholds

Supplier performance — average lead time and order accuracy by supplier

Cost analysis — total spend by supplier, category, or time period

All reports should be filterable by date range, category, supplier, and location, and exportable as CSV or PDF

AI Features

Smart Reorder Suggestions — The system should analyze historical movement patterns for each item and suggest optimized reorder thresholds and quantities. Instead of a static "reorder at 10 units" rule, the AI looks at consumption rate, lead time from the supplier, and seasonal variation to recommend dynamic reorder points. For example: "This item averages 45 units/week but spikes to 80 in December. Your supplier takes 5 days to deliver. Suggested reorder point: 65 units." Surface these suggestions as actionable cards that admins can accept with one click or dismiss.

Demand Forecasting — A dashboard widget that projects future stock levels for the next 30, 60, or 90 days based on historical usage trends. Show a line chart per item or category with a projected quantity curve and a highlighted zone where stock is expected to drop below the reorder threshold. This lets managers plan ahead rather than react to stockouts.

Anomaly Detection — Flag unusual stock movements automatically. If an item's usage suddenly spikes or drops compared to its historical pattern, or if a manual adjustment seems unusually large, surface an alert: "Warehouse B reported a 200-unit adjustment on Item X — this is 10x the typical adjustment for this item." This helps catch errors, theft, or process breakdowns early.

Natural Language Search — Let users search inventory conversationally. Instead of navigating filters, they can type things like "what's running low in electronics" or "show me everything we ordered from Acme Supply last quarter" or "which items haven't moved in 90 days" and get instant, accurate results.

User Roles

Three roles:

Admin — full access to everything including system settings, user management, supplier management, analytics, and all operational features

Inventory Manager — can manage the item catalog, log stock movements, create and manage purchase orders, approve requests, and view analytics. Cannot access system settings or manage users.

Requestor — can browse the catalog, see stock levels, submit inventory requests, and view their own request history. No access to stock movements, purchase orders, supplier details, or admin tools.

Seed Data

Pre-load the app with realistic sample data so it feels functional immediately:

4–5 categories with 30–40 total items across them, including a mix of healthy stock, low stock, and out-of-stock items

3–4 suppliers with linked items and a few past purchase orders

2–3 locations with items distributed across them

60–80 historical stock movements over the past 30 days to populate the activity feed and analytics

A few pending inventory requests and one open purchase order

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dash-stock-home.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea62b27f-0c32-43df-8e99-c615d2db45cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

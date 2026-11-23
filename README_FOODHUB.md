# 🚛 FoodHub WMS & Smart Logistics System

A complete **Warehouse Management & Logistics Supply Chain System (WMS)** built for food distribution, cold-chain temperature control, bulk stock requisition, and fleet dispatch.

---

## 🌟 Re-engineered Features for Warehouse & Logistics

1. **Supply Chain Authentication & Role-Based Access**
   - **Warehouse Logistics Admin** (`admin` / `admin123`): Complete WMS control, cold storage zones, SKU master catalog, and freight revenue analytics.
   - **Dock Supervisor / Forklift Staff** (`staff` / `staff123`): Stage fulfillment, pallet cold loading, and fleet departure.
   - **Branch Consignee / Restaurant Client** (`customer` / `cust123`): Bulk ingredient requisition, branch dispatch tracking, and digital waybill retrieval.

2. **Warehouse Storage Zones (Cold Chain Management)**
   - **Deep Freeze Chamber (-18°C to -20°C)** for frozen meats, patties, and poultry.
   - **Chilled Room (2°C to 4°C)** for dairy blocks, mozzarella, and cooking cream.
   - **Dry Ambient Racks** for rice sacks, coffee beans, and seasonings.
   - **Packaging & Fleet Disposables Bay** for takeout cartons and greaseproof wraps.
   - Add/delete custom warehouse storage chambers.

3. **Warehouse Stock Master & SKU Management (CRUD)**
   - Pallet & carton bulk inventory tracking with SKU IDs (e.g. `SKU-701`).
   - Temperature requirements, storage bays, and rack coordinates per item.
   - Toggle stock availability: `Pallet In Stock` vs `Depleted`.

4. **Bulk Requisition Manifest (Cargo Cart)**
   - Branch inventory orders with quantity multipliers.
   - Real-time cargo valuation and automated cold-chain handling fee calculation.

5. **Fleet Dispatch & Transit Fulfillment**
   - Live workflow tracking: `Pending (Staging)`, `Preparing (Cold Loading)`, `Ready (At Loading Bay)`, `Completed (Delivered & Signed)`, `Cancelled`.
   - Filter dispatches by warehouse status and freight billing.

6. **Freight Settlement & Payment Management**
   - Support for Corporate Fleet Accounts (Net 30), Freight COD, E-Wallets, and Direct Wire Bank Transfer.
   - Instant invoice clearance toggles.

7. **Official Cargo Waybills (Automated Receipts)**
   - Official logistics dispatch slips with RFID batch tags, origin depot, consignee receiver, and driver signature blocks.
   - One-click browser print formatting (`Ctrl+P`).

8. **WMS Command Tower & Logistics Reports**
   - Total paid logistics freight revenue, active storage SKUs, pending bay loadings, and fleet dispatches.
   - Highest turnover supplies ranking and payment settlement distribution.

---

## 🚀 How to Run

1. Simply double-click **`start_foodhub.bat`** in `C:\SIA_MERANOJOHN\org.openwms-master`.
2. Or open `http://localhost:8080` in your browser.

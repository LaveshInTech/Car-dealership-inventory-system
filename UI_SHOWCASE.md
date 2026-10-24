# Apex Motors — UI Showcase & Design System Walkthrough

## 1. Visual Design Direction & Palette
The interface is designed with a premium automotive aesthetic:
- **Navigation Bar**: Deep Navy Charcoal (`#0f172a` / `brand-900`) with subtle border lines (`#1e293b`)
- **Primary Accent**: Performance Blue (`#3882b2` / `brand-500`)
- **Background**: Soft clean canvas (`#f8fafc` / `slate-50`)
- **Cards**: High-contrast white (`#ffffff`) with rounded corners (`rounded-2xl` / `rounded-3xl`), border boundaries (`border-slate-200/80`), and soft elevation shadows (`shadow-sm` / `shadow-md`).

---

## 2. Page Directory & Completed Screens

### 1. Dashboard & Analytics (`/dashboard`)
- **Summary KPIs**: Total Valuation (`$1,489,585`), Total Units (`27 Units`), Low Stock Alerts (`3 Models`), Out of Stock (`2 Models`).
- **Interactive Visualizations**:
  - Category Valuation Bar Chart (showing capital distribution across Coupe, SUV, Sedan, Truck, Wagon).
  - Units in Stock Pie Chart with category legend.
- **Recent Activity Ledger**: Real-time sales transactions and consignment restocks.
- **Recent Vehicles Showcase**: Direct links to newly consigned vehicles.

### 2. Vehicle Showroom & Inventory (`/inventory`)
- **View Toggle**: Effortless switching between **Grid View** (modern visual cards) and **Table View** (dense enterprise data grid).
- **Search & Multi-Filtering**: Instant keyword search across make, model, color, or description; category tabs; min/max price range filter.
- **Smart Sorting**: Newest, Price (Low to High), Price (High to Low), Stock (Low to High), Stock (High to Low), Model Year.
- **Stock Badges**: Real-time visual status ("In Stock: 5", "Low Stock: 2 left", "Out of Stock").
- **Pagination**: Numbered page control with item counts.

### 3. Vehicle Specifications & Details (`/inventory/:id`)
- High-definition automotive imagery showcase.
- Full specifications: Year, VIN, Mileage, Fuel Type (Gasoline, Electric, Hybrid, Diesel), Transmission (Automatic, Manual), Color.
- In-depth vehicle overview and equipment description.
- Direct Purchase CTA button (automatically disabled if vehicle has zero stock).
- Dedicated Vehicle Audit Ledger displaying past acquisitions and sales for that specific vehicle.

### 4. Purchase Confirmation Interface (`/inventory/:id/purchase`)
- Unit selector with maximum available stock bounds.
- Live financial breakdown: Subtotal, Dealer conveyance fee, Total balance due.
- ACID database transaction enforcement preventing negative stock or overselling.
- Digital invoice receipt upon successful order placement (`TX-XXXXXX`).

### 5. Inventory Transaction History (`/transactions`)
- Complete audit ledger of all events.
- Filterable tabs: `All Transactions`, `Purchases`, `Restocks`.
- Displays transaction ID, timestamp, unit delta, price per unit, total amount, and operator notes.

### 6. Dealership Fleet Admin Console (`/admin`)
- Administrative inventory table.
- Dedicated Restock Modal: Increment vehicle units with shipment notes.
- Safe Deletion Modal: Permanent deletion with confirmation prompt.
- Protected by backend role verification (HTTP 403 for unauthorized users).

### 7. User Authentication & Profile
- `LoginPage`: One-click Auto-Fill Demo Credentials buttons for Admin and Customer.
- `RegisterPage`: Password length, confirmation match, and email validation.
- `ProfilePage`: User credentials, role badge (`ADMIN` or `USER`), and personal purchase history.
- `UnauthorizedPage` (403) and `NotFoundPage` (404).

---

## 3. Component Architecture & Reusability
- `Navbar.tsx`: Responsive navigation with mobile hamburger drawer and session status.
- `StatCard.tsx`: Metric presentation with custom badge variants (`success`, `warning`, `danger`, `info`).
- `VehicleCard.tsx`: Aspect-ratio vehicle photography, spec pills, and conditional action buttons.
- `Toast.tsx`: Dynamic toast notifications for errors, confirmations, and alerts.
- `ProtectedRoute.tsx`: Route guard ensuring valid JWT and optional `requireAdmin` enforcement.

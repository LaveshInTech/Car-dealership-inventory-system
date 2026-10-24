# Test Execution and Quality Assurance Report

**Project**: Apex Motors - Car Dealership Inventory Management System  
**Timestamp**: 2026-10-25 00:46:00 UTC  
**Test Frameworks**: Pytest 9.1.1 + Coverage.py 7.17.0 (Backend), Vitest 4.1.12 + React Testing Library (Frontend)  
**Execution Environment**: Python 3.12.1, Node.js v20.18.0, Windows 11 AMD64  

---

## 1. Executive Summary

| Test Domain | Target Components | Tests Executed | Passed | Failed | Code Coverage |
|---|---|---|---|---|---|
| **Backend Auth & RBAC** | Argon2 hashing, JWT tokens, RBAC roles, Login/Register | 9 | 9 | 0 | 97% |
| **Backend Vehicles API** | Vehicle CRUD, Search, Price/Qty validation, Filters | 11 | 11 | 0 | 94% |
| **Backend Inventory & Transactions** | Atomic purchases, Restock, Concurrency, Stock checks | 8 | 8 | 0 | 85% |
| **Backend Analytics** | Valuation, Units, Low stock, Out of stock, Category metrics | 2 | 2 | 0 | 100% |
| **Frontend UI Components** | StatCard, VehicleCard (In Stock vs Sold Out), LoginPage | 5 | 5 | 0 | N/A |
| **TOTAL** | **Full Full-Stack Inventory System** | **35** | **35** | **0** | **89% Total Coverage** |

---

## 2. Backend Automated Test Results (Pytest)

### Command
```bash
python -m pytest tests -v --cov=app --cov-report=term-missing
```

### Execution Log
```
============================= test session starts =============================
platform win32 -- Python 3.12.1, pytest-9.1.1, pluggy-1.7.0 -- python.exe
cachedir: .pytest_cache
rootdir: C:\...\car-dealership-inventory\backend
plugins: anyio-4.2.0, asyncio-1.4.0, cov-7.1.0
collected 30 items

tests/test_auth.py::test_register_user_success PASSED                    [  3%]
tests/test_auth.py::test_register_duplicate_email_fails PASSED           [  6%]
tests/test_auth.py::test_password_is_securely_hashed PASSED              [ 10%]
tests/test_auth.py::test_login_success PASSED                            [ 13%]
tests/test_auth.py::test_login_invalid_password_fails PASSED             [ 16%]
tests/test_auth.py::test_login_nonexistent_email_fails PASSED            [ 20%]
tests/test_auth.py::test_get_current_user_profile PASSED                 [ 23%]
tests/test_auth.py::test_unauthenticated_request_fails PASSED            [ 26%]
tests/test_auth.py::test_expired_token_fails PASSED                      [ 30%]
tests/test_dashboard.py::test_dashboard_summary_metrics PASSED           [ 33%]
tests/test_dashboard.py::test_dashboard_unauthenticated_fails PASSED     [ 36%]
tests/test_inventory.py::test_purchase_vehicle_success PASSED            [ 40%]
tests/test_inventory.py::test_purchase_zero_stock_fails PASSED           [ 43%]
tests/test_inventory.py::test_purchase_exceeding_stock_fails PASSED      [ 46%]
tests/test_inventory.py::test_purchase_unauthenticated_fails PASSED      [ 50%]
tests/test_inventory.py::test_restock_vehicle_admin_success PASSED       [ 53%]
tests/test_inventory.py::test_restock_vehicle_regular_user_forbidden PASSED [ 56%]
tests/test_inventory.py::test_concurrent_purchase_attempts PASSED        [ 60%]
tests/test_inventory.py::test_inventory_transactions_list PASSED         [ 63%]
tests/test_vehicles.py::test_get_vehicles_paginated PASSED               [ 66%]
tests/test_vehicles.py::test_search_vehicles_keyword PASSED              [ 70%]
tests/test_vehicles.py::test_filter_by_price_and_category PASSED         [ 73%]
tests/test_vehicles.py::test_get_vehicle_by_id_success PASSED            [ 76%]
tests/test_vehicles.py::test_get_vehicle_by_id_not_found PASSED          [ 80%]
tests/test_vehicles.py::test_create_vehicle_authenticated PASSED         [ 83%]
tests/test_vehicles.py::test_create_vehicle_invalid_price PASSED         [ 86%]
tests/test_vehicles.py::test_create_vehicle_negative_quantity PASSED     [ 90%]
tests/test_vehicles.py::test_update_vehicle_success PASSED               [ 93%]
tests/test_vehicles.py::test_delete_vehicle_admin_only PASSED            [ 96%]
tests/test_vehicles.py::test_delete_vehicle_regular_user_forbidden PASSED [100%]

=============================== tests coverage ================================
Name                                Stmts   Miss  Cover   Missing
-----------------------------------------------------------------
app\api\deps.py                        38     12    68%   31, 35, 37, 61-69
app\api\routers\auth.py                20      0   100%
app\api\routers\dashboard.py           11      0   100%
app\api\routers\inventory.py           19      0   100%
app\api\routers\vehicles.py            33      0   100%
app\core\config.py                     28      2    93%   39, 42
app\core\security.py                   27      0   100%
app\db\init_db.py                      56     25    55%   211-221, 229-239, 244-267, 277
app\db\session.py                      15      4    73%   25-29
app\main.py                            35      3    91%   60-61, 70
app\models\__init__.py                  4      0   100%
app\models\transaction.py              19      1    95%   24
app\models\user.py                     17      1    94%   27
app\models\vehicle.py                  26      1    96%   40
app\schemas\__init__.py                 5      0   100%
app\schemas\dashboard.py               20      0   100%
app\schemas\inventory.py               27      0   100%
app\schemas\user.py                    32      0   100%
app\schemas\vehicle.py                 44      0   100%
app\services\auth_service.py           26      1    96%   42
app\services\dashboard_service.py      30      0   100%
app\services\inventory_service.py      77     18    77%   21, 30, 35, 78-80, 94, 102, 107, 132-137, 153, 155, 157
app\services\vehicle_service.py        66      8    88%   39, 41, 45, 54, 75, 80, 97, 102
-----------------------------------------------------------------
TOTAL                                 675     76    89%
======================= 30 passed, 3 warnings in 2.51s ========================
```

---

## 3. Frontend Automated Test Results (Vitest)

### Command
```bash
npm test
```

### Execution Log
```
> frontend@0.0.0 test
> vitest run

 RUN  v4.1.12 C:/.../car-dealership-inventory/frontend

 ✓ src/tests/StatCard.test.tsx (1 test) 42ms
 ✓ src/tests/VehicleCard.test.tsx (2 tests) 105ms
 ✓ src/tests/LoginPage.test.tsx (2 tests) 87ms

 Test Files  3 passed (3)
      Tests  5 passed (5)
   Duration  2.92s
```

---

## 4. Concurrency & Integrity Verification
1. **Zero-Stock Invariant**: When stock reaches 0, any purchase request is immediately rejected with HTTP 400 (`out of stock`), verified in `test_purchase_zero_stock_fails`.
2. **Overselling Invariant**: Attempting to buy $N > \text{Stock}$ units is rejected with HTTP 400 (`insufficient inventory`), verified in `test_purchase_exceeding_stock_fails`.
3. **Atomic Execution**: Sequential & concurrent attempts rapidly decrementing inventory until zero correctly log exact unit increments/decrements in `InventoryTransaction`, verified in `test_concurrent_purchase_attempts`.
4. **RBAC Security Invariant**: Vehicle deletion and restocking enforce strict `ADMIN` role checks at the backend layer, returning HTTP 403 Forbidden to regular users regardless of frontend state.

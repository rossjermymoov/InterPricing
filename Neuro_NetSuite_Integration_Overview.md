# Neuro × Oracle NetSuite Integration Overview

**Prepared for:** Chief Commercial Officer (CCO)  
**Product:** Neuro (`heyneuro.io`)  
**Scope:** Native NetSuite ERP Connector (Order Push, Fulfillment & Tracking Sync, Stock/Inventory Sync)

---

## Executive Summary

Neuro can build a **direct, native NetSuite connector** using Oracle NetSuite's standard **SuiteTalk REST Web Services** and **SuiteQL** APIs—with **no Oracle partnership, SuiteApp approval, or manual intervention from NetSuite required**.

Customers connect their NetSuite account to Neuro via self-serve API credentials in a few minutes. Once connected, Neuro can:
1. **Push Sales Orders** directly into NetSuite in JSON format.
2. **Poll Fulfillment & Dispatch Data** on a schedule (cron) to retrieve dispatched status, courier, and tracking numbers (and generate/map tracking URLs).
3. **Sync Stock / Inventory Availability** on a schedule so Neuro always knows what stock is available to fulfill.

---

## 1. Customer Onboarding Experience (Self-Serve)

Each merchant connects their own NetSuite instance directly inside Neuro without Neuro needing to contact Oracle or manage per-customer middleware.

### Recommended Auth Methods
| Method | How the Customer Connects | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Token-Based Auth (TBA / OAuth 1.0)** *(Recommended for fast onboarding)* | Customer creates an Integration Record + Access Token in NetSuite and pastes 5 values into Neuro (`Account ID`, `Consumer Key`, `Consumer Secret`, `Token ID`, `Token Secret`). | Easiest for non-technical merchants; no SSL certificates required. | Uses OAuth 1.0 `HMAC-SHA256` request signing on Neuro's backend. |
| **OAuth 2.0 Client Credentials (M2M)** | Neuro provides a public `.pem` certificate; customer uploads it to NetSuite and pastes `Account ID`, `Client ID`, and `Certificate ID`. | Modern OAuth 2.0 Bearer token flow; short-lived tokens. | Slightly more technical setup for the customer (uploading a certificate file). |

> **Note:** Full one-click "Login with NetSuite" (OAuth 2.0 Authorization Code flow) across arbitrary customer accounts requires Oracle SuiteApp partner registration. TBA and M2M work immediately out of the box.

---

## 2. End-to-End Data Flow

```text
┌──────────────────┐        1. Push Order (JSON)        ┌──────────────────────┐
│                  │ ──────────────────────────────────► │                      │
│   Neuro          │                                     │   Customer's         │
│   (heyneuro.io)  │ ◄────────────────────────────────── │   NetSuite ERP       │
│                  │   2. Cron: Fulfillment & Tracking   │                      │
│                  │   3. Cron: Stock Availability       │                      │
└──────────────────┘                                     └──────────────────────┘
```

### Flow 1: Pushing Orders into NetSuite
* **Endpoint:** `POST https://{accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/salesOrder`
* **How it works:** Neuro maps its canonical order JSON into NetSuite's `salesOrder` format and tags each order with `externalId` (Neuro's order ID) to prevent duplicate orders on retries.
* **Key Fields Sent:**
  * `externalId` — Neuro's unique order reference
  * `entity` — Customer ID in NetSuite
  * `subsidiary` / `location` — Legal entity & fulfillment warehouse
  * `item.items[]` — Array of SKUs (`item.id`), `quantity`, and `rate`
  * Optional custom fields (`custbody_*`) via Neuro's field mapper

### Flow 2: Cron Job — Polling Dispatch, Courier & Tracking
* **Endpoint:** `POST https://{accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`
* **How it works:** Neuro runs a scheduled SuiteQL query filtering for Item Fulfillments (`ItemShip`) in **Shipped** status (`ItemShip:C`) modified since the last poll timestamp. Assuming full order fulfillment, Neuro reads header-level dispatch data and links it back to the original order via `externalId`.
* **Key Fields Retrieved:**
  * **Order Reference:** `SalesOrder.ExternalID` (Neuro Order ID) & `SalesOrder.TranID` (NetSuite Order #)
  * **Dispatch Status:** `Fulfillment.Status` (`ItemShip:C` = Shipped, distinguishing dispatched orders from *Picked* or *Packed*)
  * **Dispatch Date:** `Fulfillment.TranDate`
  * **Courier:** `BUILTIN.DF(Fulfillment.ShipMethod)`
  * **Tracking Number(s):** `BUILTIN.DF(Fulfillment.TrackingNumberList)` (or per-package via `ShipmentPackage` if Advanced Shipping is enabled)
  * **Tracking URL:** NetSuite does not store a standard tracking URL natively. Neuro either:
    1. Constructs the URL automatically using the **Courier + Tracking Number**, **or**
    2. Maps a customer-specific custom field (e.g., `custbody_tracking_url`) if their 3PL/WMS writes one into NetSuite.

### Flow 3: Cron Job — Polling Stock Fulfillment / Inventory Levels
* **Endpoint:** `POST https://{accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`
* **How it works:** Neuro queries NetSuite's `AggregateItemLocation` table incrementally using `LastQuantityAvailableChange` so only SKUs with changed stock levels are synced.
* **Key Fields Retrieved:**
  * `Item.ItemID` — SKU
  * `Location` — Warehouse / location
  * `QuantityAvailable` — Stock free to fulfill new orders
  * `QuantityOnHand` — Physical stock in warehouse
  * `QuantityCommitted` — Stock reserved for existing orders
  * `QuantityBackOrdered` — Backordered demand

---

## 3. Commercial & Implementation Considerations

1. **Flexible Field Mapping (Important for Enterprise Merchants):**
   Every NetSuite customer configures their account slightly differently (e.g., mandatory `subsidiary`, `department`, `class`, or custom `custbody_*` fields on Sales Orders). Including a configurable key-value field mapper in Neuro's NetSuite settings ensures compatibility without custom code per customer.
2. **ID Resolution Sync:**
   NetSuite requires internal numeric IDs (not just SKU strings) when creating orders. Neuro should run a lightweight metadata sync on connection (and periodically) to map SKUs, Warehouses (`Location`), and Shipping Methods (`ShipItem`) to their NetSuite internal IDs.
3. **Rate Limits & Scalability:**
   NetSuite enforces per-account concurrency limits (typically 5–15 concurrent REST requests depending on the customer's NetSuite tier). Using **batch SuiteQL queries** with incremental timestamps (`LastModifiedDate` / `LastQuantityAvailableChange`) keeps Neuro well within rate limits.
4. **Sandbox Support:**
   Customers will expect to test in a NetSuite Sandbox first. Neuro simply needs to handle NetSuite's sandbox URL convention (`123456_SB1` in auth headers → `123456-sb1` in the API hostname).

---

## 4. Summary

* **Feasibility:** High — standard REST + SuiteQL architecture, no third-party middleware or Oracle approval required.
* **Customer Friction:** Low — self-serve credential setup (5 keys for TBA, or M2M cert).
* **Capabilities Delivered:** JSON order push with idempotency (`externalId`), automated dispatch/courier/tracking polling, and incremental multi-location stock sync.

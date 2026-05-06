/**
 * SwiftBite — placed orders (localStorage) for history + tracking + partner portals demo.
 */
(function (global) {
  const KEY = "swiftbite_orders_v1";

  const ORDER_STATUS = {
    PENDING_RESTAURANT: "pending_restaurant",
    DECLINED: "declined",
    CANCELLED_BY_CUSTOMER: "cancelled_by_customer",
    PREPARING: "preparing",
    READY_FOR_PICKUP: "ready_for_pickup",
    PICKED_UP: "picked_up",
    DELIVERED: "delivered"
  };

  /** @type {Record<string, string>} */
  const STATUS_LABEL = {
    pending_restaurant: "Waiting for restaurant",
    declined: "Declined by restaurant",
    cancelled_by_customer: "Cancelled by you",
    preparing: "Approved · Preparing",
    ready_for_pickup: "Ready for rider",
    picked_up: "Out for delivery",
    delivered: "Delivered",
    placed: "Waiting for restaurant"
  };

  /** Customer-facing longer status (toasts & banners). */
  const STATUS_CUSTOMER_DETAIL = {
    pending_restaurant: "The restaurant manager is reviewing your order.",
    declined: "The restaurant could not take this order. You will not be charged in this demo.",
    cancelled_by_customer: "You cancelled before the restaurant started preparing your food.",
    preparing: "Your order was approved and the kitchen is preparing it.",
    ready_for_pickup: "Food is packed — a rider will collect it soon.",
    picked_up: "Your rider has picked up the order and is on the way.",
    delivered: "Delivered — enjoy your meal!",
    placed: "The restaurant manager is reviewing your order."
  };

  /** @typedef {{ restaurantId: string, itemId: string, name: string, unitPrice: number, quantity: number, extrasNote?: string }} OrderLine */

  /**
   * @typedef {{
   *   id: string,
   *   createdAt: number,
   *   restaurantId: string,
   *   restaurantName: string,
   *   lines: OrderLine[],
   *   addressLine: string,
   *   flatOrBlock: string,
   *   phone: string,
   *   instructions: string,
   *   subtotal: number,
   *   deliveryFee: number,
   *   tax: number,
   *   total: number,
   *   status: string,
   *   etaMinutes: number,
   *   statusUpdatedAt?: number,
   *   declineReason?: string,
   *   voucherCode?: string,
   *   discountAmount?: number,
   *   scheduledFor?: string,
   *   loyaltyPointsRedeemed?: number,
   *   loyaltyDiscountPkr?: number,
   *   groupOrderId?: string,
   *   restaurantRating?: { score: number, comment?: string },
   *   riderRating?: { score: number, comment?: string }
   * }} OrderRecord
   */

  function notifyChanged() {
    try {
      global.dispatchEvent(new CustomEvent("swiftbite_orders_changed"));
    } catch (_) {
      /* ignore */
    }
  }

  function emit(name, detail) {
    try {
      global.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (_) {
      /* ignore */
    }
  }

  /** @param {OrderRecord[]} list */
  function migrateLegacyStatuses(list) {
    let dirty = false;
    const next = list.map((o) => {
      /** @type {OrderRecord} */
      let row = { ...o };
      if (row.status === "placed") {
        dirty = true;
        row.status = ORDER_STATUS.PENDING_RESTAURANT;
      }
      if (typeof row.statusUpdatedAt !== "number") {
        dirty = true;
        row.statusUpdatedAt = row.createdAt || Date.now();
      }
      return row;
    });
    return { next, dirty };
  }

  function loadAll() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? parsed : [];
      const { next, dirty } = migrateLegacyStatuses(arr);
      if (dirty) global.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  }

  function saveAll(list) {
    global.localStorage.setItem(KEY, JSON.stringify(list));
    notifyChanged();
  }

  function uid() {
    return `SB-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  }

  /**
   * @param {Omit<OrderRecord, 'id'|'createdAt'|'status'|'etaMinutes'> & Partial<Pick<OrderRecord,'status'|'etaMinutes'>>} payload
   */
  function placeOrder(payload) {
    const now = Date.now();
    /** @type {OrderRecord} */
    const order = {
      id: uid(),
      createdAt: now,
      statusUpdatedAt: now,
      status: payload.status || ORDER_STATUS.PENDING_RESTAURANT,
      etaMinutes: typeof payload.etaMinutes === "number" ? payload.etaMinutes : 35,
      restaurantId: payload.restaurantId,
      restaurantName: payload.restaurantName,
      lines: payload.lines,
      addressLine: payload.addressLine,
      flatOrBlock: payload.flatOrBlock || "",
      phone: payload.phone || "",
      instructions: payload.instructions || "",
      subtotal: payload.subtotal,
      deliveryFee: payload.deliveryFee,
      tax: payload.tax,
      total: payload.total
    };
    if (payload.voucherCode) order.voucherCode = String(payload.voucherCode);
    if (typeof payload.discountAmount === "number" && payload.discountAmount > 0) order.discountAmount = payload.discountAmount;
    if (payload.scheduledFor) order.scheduledFor = String(payload.scheduledFor);
    if (typeof payload.loyaltyPointsRedeemed === "number") order.loyaltyPointsRedeemed = payload.loyaltyPointsRedeemed;
    if (typeof payload.loyaltyDiscountPkr === "number") order.loyaltyDiscountPkr = payload.loyaltyDiscountPkr;
    if (payload.groupOrderId) order.groupOrderId = String(payload.groupOrderId);
    const all = loadAll();
    all.unshift(order);
    saveAll(all.slice(0, 40));
    emit("swiftbite_order_placed", { order });
    return order;
  }

  function listOrders() {
    return loadAll();
  }

  /** @param {string} id */
  function getOrder(id) {
    return loadAll().find((o) => o.id === id) || null;
  }

  /**
   * @param {string} id
   * @param {string} status
   * @param {{ declineReason?: string } | undefined} meta
   */
  function updateStatus(id, status, meta) {
    const all = loadAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    const prevStatus = all[idx].status;
    /** @type {OrderRecord} */
    const row = { ...all[idx], status, statusUpdatedAt: Date.now() };
    if (meta && typeof meta.declineReason === "string" && meta.declineReason.trim()) {
      row.declineReason = meta.declineReason.trim();
    }
    all[idx] = row;
    saveAll(all);
    emit("swiftbite_order_status_changed", { orderId: id, status, prevStatus, order: row });
    if (status === ORDER_STATUS.DELIVERED && prevStatus !== ORDER_STATUS.DELIVERED) {
      emit("swiftbite_order_delivered", { order: row });
    }
    return all[idx];
  }

  /** @param {string} id @param {Partial<OrderRecord>} patch */
  function patchOrder(id, patch) {
    const all = loadAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch, statusUpdatedAt: Date.now() };
    saveAll(all);
    return all[idx];
  }

  /** @param {string} status */
  function statusLabel(status) {
    return STATUS_LABEL[status] || status;
  }

  /** @param {string} status */
  function customerStatusDetail(status) {
    return STATUS_CUSTOMER_DETAIL[status] || "";
  }

  global.SwiftBiteOrders = {
    STORAGE_KEY: KEY,
    ORDER_STATUS,
    statusLabel,
    customerStatusDetail,
    placeOrder,
    patchOrder,
    listOrders,
    getOrder,
    updateStatus
  };
})(window);

/**
 * SwiftBite — placed orders (localStorage) for history + tracking + partner portals demo.
 */
(function (global) {
  const KEY = "swiftbite_orders_v1";

  const ORDER_STATUS = {
    PENDING_RESTAURANT: "pending_restaurant",
    DECLINED: "declined",
    PREPARING: "preparing",
    READY_FOR_PICKUP: "ready_for_pickup",
    PICKED_UP: "picked_up",
    DELIVERED: "delivered"
  };

  /** @type {Record<string, string>} */
  const STATUS_LABEL = {
    pending_restaurant: "Awaiting approval",
    declined: "Declined",
    preparing: "Preparing",
    ready_for_pickup: "Ready for pickup",
    picked_up: "Out for delivery",
    delivered: "Delivered",
    placed: "Awaiting approval"
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
   *   etaMinutes: number
   * }} OrderRecord
   */

  function notifyChanged() {
    try {
      global.dispatchEvent(new CustomEvent("swiftbite_orders_changed"));
    } catch (_) {
      /* ignore */
    }
  }

  /** @param {OrderRecord[]} list */
  function migrateLegacyStatuses(list) {
    let dirty = false;
    const next = list.map((o) => {
      if (o.status === "placed") {
        dirty = true;
        return { ...o, status: ORDER_STATUS.PENDING_RESTAURANT };
      }
      return o;
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
    /** @type {OrderRecord} */
    const order = {
      id: uid(),
      createdAt: Date.now(),
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
    const all = loadAll();
    all.unshift(order);
    saveAll(all.slice(0, 40));
    return order;
  }

  function listOrders() {
    return loadAll();
  }

  /** @param {string} id */
  function getOrder(id) {
    return loadAll().find((o) => o.id === id) || null;
  }

  /** @param {string} id @param {string} status */
  function updateStatus(id, status) {
    const all = loadAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], status };
    saveAll(all);
    return all[idx];
  }

  /** @param {string} status */
  function statusLabel(status) {
    return STATUS_LABEL[status] || status;
  }

  global.SwiftBiteOrders = {
    ORDER_STATUS,
    statusLabel,
    placeOrder,
    listOrders,
    getOrder,
    updateStatus
  };
})(window);

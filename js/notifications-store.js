/**
 * SwiftBite — in-app notifications (localStorage demo).
 */
(function (global) {
  const KEY = "swiftbite_notifications_v1";
  const MAX = 60;

  /** @typedef {{ id: string, title: string, body: string, t: number, read: boolean }} N */

  function load() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function save(list) {
    global.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    try {
      global.dispatchEvent(new CustomEvent("swiftbite_notifications_changed"));
    } catch (_) {}
  }

  function push(title, body) {
    /** @type {N} */
    const n = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: String(title || "SwiftBite"),
      body: String(body || ""),
      t: Date.now(),
      read: false
    };
    const list = load();
    list.unshift(n);
    save(list);
  }

  function listAll() {
    return load();
  }

  function unreadCount() {
    return load().filter((x) => !x.read).length;
  }

  function markAllRead() {
    const list = load().map((x) => ({ ...x, read: true }));
    save(list);
  }

  function markRead(id) {
    const list = load().map((x) => (x.id === id ? { ...x, read: true } : x));
    save(list);
  }

  global.addEventListener("swiftbite_order_placed", (e) => {
    const o = e && e.detail && e.detail.order;
    if (o) push("Order sent", `${o.restaurantName} · ${o.id} — waiting for restaurant.`);
  });

  global.addEventListener("swiftbite_order_status_changed", (e) => {
    const d = e && e.detail;
    if (!d || !d.order) return;
    const lab = global.SwiftBiteOrders ? global.SwiftBiteOrders.statusLabel(d.status) : d.status;
    push("Order update", `${d.order.restaurantName} — ${lab}`);
  });

  global.SwiftBiteNotify = {
    push,
    listAll,
    unreadCount,
    markAllRead,
    markRead
  };
})(window);

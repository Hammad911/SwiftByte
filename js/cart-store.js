/**
 * SwiftBite — client-side cart (Phase 2). Persists to localStorage.
 */
(function (global) {
  const STORAGE_KEY = "swiftbite_cart_v1";

  /** @typedef {{ restaurantId: string, itemId: string, name: string, unitPrice: number, quantity: number, extrasNote?: string }} CartLine */

  /** @returns {CartLine[]} */
  function load() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** @param {CartLine[]} lines */
  function save(lines) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    notify();
  }

  const listeners = new Set();

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(getLines(), getTotals());
      } catch {
        /* ignore listener errors */
      }
    });
  }

  /** @returns {CartLine[]} */
  function getLines() {
    return load();
  }

  function getTotals() {
    const lines = load();
    let count = 0;
    let subtotal = 0;
    lines.forEach((l) => {
      const q = Math.max(1, Number(l.quantity) || 1);
      count += q;
      subtotal += (Number(l.unitPrice) || 0) * q;
    });
    return { count, subtotal };
  }

  function getActiveRestaurantId() {
    const lines = load();
    return lines.length ? lines[0].restaurantId : null;
  }

  /**
   * @param {string} restaurantId
   * @param {string} itemId
   * @param {number} qty integers ≥1; &lt;1 removes the line
   */
  function setLineQuantity(restaurantId, itemId, qty) {
    const lines = load();
    const idx = lines.findIndex((l) => l.restaurantId === restaurantId && l.itemId === itemId);
    if (idx < 0) return;
    const q = Number(qty);
    if (!(q >= 1)) {
      lines.splice(idx, 1);
      save(lines);
      return;
    }
    lines[idx].quantity = Math.min(99, Math.floor(q));
    save(lines);
  }

  /**
   * @param {Omit<CartLine, 'quantity'> & { quantity?: number }} line
   * @returns {boolean} false if cart holds another restaurant’s items
   */
  function upsertLine(line) {
    const lines = load();
    const rid = line.restaurantId;
    if (lines.length && lines[0].restaurantId !== rid) {
      return false;
    }
    const qty = Math.max(1, Number(line.quantity) || 1);
    const idx = lines.findIndex((l) => l.restaurantId === line.restaurantId && l.itemId === line.itemId);
    if (idx >= 0) {
      lines[idx].quantity = Math.min(99, (lines[idx].quantity || 1) + qty);
      lines[idx].unitPrice = Number(line.unitPrice) || lines[idx].unitPrice;
      lines[idx].name = line.name || lines[idx].name;
      if (line.extrasNote) lines[idx].extrasNote = line.extrasNote;
    } else {
      lines.push({
        restaurantId: line.restaurantId,
        itemId: line.itemId,
        name: line.name,
        unitPrice: Number(line.unitPrice) || 0,
        quantity: qty,
        extrasNote: line.extrasNote
      });
    }
    save(lines);
    return true;
  }

  /** @param {string} restaurantId @param {string} itemId */
  function removeLine(restaurantId, itemId) {
    const lines = load().filter((l) => !(l.restaurantId === restaurantId && l.itemId === itemId));
    save(lines);
  }

  function clear() {
    global.localStorage.removeItem(STORAGE_KEY);
    notify();
  }

  /**
   * Replace the entire cart (e.g. group-order import). Lines must share one restaurantId.
   * @param {CartLine[]} lines
   */
  function replaceLines(lines) {
    const next = Array.isArray(lines)
      ? lines.map((l) => ({
          restaurantId: String(l.restaurantId || ""),
          itemId: String(l.itemId || ""),
          name: String(l.name || "Item"),
          unitPrice: Number(l.unitPrice) || 0,
          quantity: Math.min(99, Math.max(1, Math.floor(Number(l.quantity) || 1))),
          extrasNote: l.extrasNote ? String(l.extrasNote) : undefined
        }))
      : [];
    const firstRid = next.length ? next[0].restaurantId : "";
    const normalized = firstRid ? next.filter((l) => l.restaurantId === firstRid && l.itemId) : [];
    save(normalized);
  }

  /** @param {(lines: CartLine[], totals: ReturnType<typeof getTotals>) => void} fn */
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  global.SwiftBiteCart = {
    getLines,
    getTotals,
    getActiveRestaurantId,
    setLineQuantity,
    upsertLine,
    removeLine,
    clear,
    replaceLines,
    subscribe
  };
})(window);

/**
 * SwiftBite — loyalty points (localStorage demo). Earn on delivered orders.
 */
(function (global) {
  const KEY = "swiftbite_loyalty_points_v1";

  function loadBalance() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const n = raw != null ? Number(raw) : NaN;
      if (!Number.isFinite(n)) {
        global.localStorage.setItem(KEY, "250");
        return 250;
      }
      return Math.max(0, Math.floor(n));
    } catch {
      return 0;
    }
  }

  function saveBalance(n) {
    global.localStorage.setItem(KEY, String(Math.max(0, Math.floor(n))));
    try {
      global.dispatchEvent(new CustomEvent("swiftbite_loyalty_changed"));
    } catch (_) {}
  }

  function getBalance() {
    return loadBalance();
  }

  function computeRedeemValue(pointsToUse, subtotalAfterVoucher) {
    const bal = loadBalance();
    const want = Math.max(0, Math.floor(Number(pointsToUse) || 0));
    const maxByOrder = Math.min(bal, want, Math.floor(Number(subtotalAfterVoucher) * 0.35), 400);
    return { points: maxByOrder, pkrOff: maxByOrder };
  }

  function applyRedeem(pointsUsed) {
    const bal = loadBalance();
    const use = Math.min(bal, Math.max(0, Math.floor(Number(pointsUsed) || 0)));
    saveBalance(bal - use);
    return use;
  }

  global.addEventListener("swiftbite_order_delivered", (e) => {
    const o = e && e.detail && e.detail.order;
    if (!o || o.loyaltyPointsEarned != null) return;
    const pts = Math.max(1, Math.floor((Number(o.total) || 0) / 180));
    saveBalance(loadBalance() + pts);
    try {
      if (global.SwiftBiteOrders && typeof global.SwiftBiteOrders.patchOrder === "function") {
        global.SwiftBiteOrders.patchOrder(o.id, { loyaltyPointsEarned: pts });
      }
    } catch (_) {}
  });

  global.SwiftBiteLoyalty = {
    getBalance,
    computeRedeemValue,
    applyRedeem
  };
})(window);

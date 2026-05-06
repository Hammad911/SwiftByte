/**
 * SwiftBite — demo vouchers (client-side).
 */
(function (global) {
  /**
   * @param {string} code
   * @param {number} subtotal
   * @param {string} [_restaurantId]
   */
  function validate(code, subtotal, _restaurantId) {
    const c = (code || "").trim().toUpperCase();
    const sub = Number(subtotal) || 0;
    if (!c) return { ok: false, discount: 0, message: "Enter a promo code." };
    if (c === "SWIFT10") {
      if (sub < 250) return { ok: false, discount: 0, message: "Min subtotal Rs. 250 for SWIFT10." };
      return { ok: true, discount: Math.round(sub * 0.1), message: "10% off applied." };
    }
    if (c === "PKR50") {
      if (sub < 400) return { ok: false, discount: 0, message: "Min subtotal Rs. 400 for PKR50." };
      return { ok: true, discount: 50, message: "Rs. 50 off applied." };
    }
    if (c === "FREEBIE") {
      if (sub < 500) return { ok: false, discount: 0, message: "Min subtotal Rs. 500." };
      return { ok: true, discount: Math.min(120, Math.round(sub * 0.08)), message: "Limited promo applied." };
    }
    return { ok: false, discount: 0, message: "Invalid or expired code." };
  }

  global.SwiftBiteVouchers = { validate };
})(window);

/**
 * SwiftBite — post-order ratings (localStorage).
 */
(function (global) {
  const KEY = "swiftbite_ratings_v1";

  function load() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(obj) {
    global.localStorage.setItem(KEY, JSON.stringify(obj));
  }

  /** @param {string} orderId @param {"restaurant"|"rider"} kind @param {number} score @param {string} [comment] */
  function saveRating(orderId, kind, score, comment) {
    const id = (orderId || "").trim();
    if (!id) return false;
    const s = Math.min(5, Math.max(1, Math.round(Number(score) || 0)));
    const row = load();
    if (!row[id]) row[id] = {};
    row[id][kind] = { score: s, comment: (comment || "").trim(), at: Date.now() };
    save(row);
    if (global.SwiftBiteNotify) {
      global.SwiftBiteNotify.push("Thanks!", `Your ${kind} rating was saved (demo).`);
    }
    return true;
  }

  function getForOrder(orderId) {
    const id = (orderId || "").trim();
    return load()[id] || null;
  }

  global.SwiftBiteRatings = {
    saveRating,
    getForOrder
  };
})(window);

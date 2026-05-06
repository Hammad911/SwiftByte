/**
 * SwiftBite — demo admin flags (approve/suspend) without real auth.
 */
(function (global) {
  const KEY = "swiftbite_admin_flags_v1";

  function load() {
    try {
      const raw = global.localStorage.getItem(KEY);
      const o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch {
      return {};
    }
  }

  function save(o) {
    global.localStorage.setItem(KEY, JSON.stringify(o));
  }

  /** @param {"restaurant"|"rider"} type @param {string} id */
  function isApproved(type, id) {
    const row = load();
    const k = `${type}:${id}`;
    if (row[k] === undefined) return true;
    return Boolean(row[k]);
  }

  /** @param {"restaurant"|"rider"} type @param {string} id @param {boolean} ok */
  function setApproved(type, id, ok) {
    const row = load();
    row[`${type}:${id}`] = Boolean(ok);
    save(row);
    try {
      global.dispatchEvent(new CustomEvent("swiftbite_admin_flags_changed"));
    } catch (_) {}
  }

  global.SwiftBiteAdminFlags = {
    isApproved,
    setApproved,
    load
  };
})(window);

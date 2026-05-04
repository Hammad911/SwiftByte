/**
 * SwiftBite — demo auth (localStorage only, no Firebase).
 */
(function (global) {
  const SESSION_KEY = "swiftbite_auth_demo_v1";

  /** @typedef {"customer"|"rider"|"restaurant_manager"} DemoRole */

  const VALID_ROLES = /** @type {const} */ (["customer", "rider", "restaurant_manager"]);

  /** @param {unknown} role */
  function normalizeRole(role) {
    const r = String(role || "").trim();
    return VALID_ROLES.includes(/** @type {DemoRole} */ (r)) ? /** @type {DemoRole} */ (r) : "customer";
  }

  /** @type {Set<(user: { uid: string, email: string | null, isAnonymous: boolean, role: DemoRole } | null) => void>} */
  const listeners = new Set();

  /** @returns {{ uid: string, email?: string | null, isAnonymous: boolean, role: DemoRole } | null} */
  function readSession() {
    try {
      const raw = global.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || typeof s.uid !== "string") return null;
      return {
        uid: s.uid,
        email: typeof s.email === "string" ? s.email : null,
        isAnonymous: Boolean(s.isAnonymous),
        role: normalizeRole(s.role)
      };
    } catch {
      return null;
    }
  }

  function writeSession(data) {
    if (!data) {
      global.localStorage.removeItem(SESSION_KEY);
    } else {
      global.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...data,
          role: normalizeRole(data.role)
        })
      );
    }
    notify();
  }

  function notify() {
    const user = getSessionUser();
    listeners.forEach((fn) => {
      try {
        fn(user);
      } catch {
        /* ignore */
      }
    });
  }

  /** @returns {{ uid: string, email: string | null, isAnonymous: boolean, role: DemoRole } | null} */
  function getSessionUser() {
    return readSession();
  }

  /** @returns {DemoRole} */
  function getRole() {
    const u = readSession();
    return u ? normalizeRole(u.role) : "customer";
  }

  /**
   * @param {string} email
   * @param {string} password
   * @param {{ role?: DemoRole }} [opts]
   */
  function signInWithEmail(email, password, opts) {
    return Promise.resolve().then(() => {
      const pw = String(password || "").trim();
      if (!pw) {
        throw Object.assign(new Error("Enter password."), { code: "auth/wrong-password" });
      }
      writeSession({
        uid: `demo-${String(email).replace(/[^\w]/g, "").slice(0, 24) || "user"}`,
        email: String(email).trim(),
        isAnonymous: false,
        role: normalizeRole(opts && opts.role)
      });
      return getSessionUser();
    });
  }

  /**
   * @param {string} email
   * @param {string} password
   * @param {{ role?: DemoRole }} [opts]
   */
  function signUpWithEmail(email, password, opts) {
    return Promise.resolve().then(() => {
      const pw = String(password || "").trim();
      if (pw.length < 6) {
        throw Object.assign(new Error("Password should be at least 6 characters."), { code: "auth/weak-password" });
      }
      writeSession({
        uid: `demo-${String(email).replace(/[^\w]/g, "").slice(0, 24) || "user"}`,
        email: String(email).trim(),
        isAnonymous: false,
        role: normalizeRole(opts && opts.role)
      });
      return getSessionUser();
    });
  }

  /** @param {{ role?: DemoRole }} [opts] */
  function continueAsGuest(opts) {
    return Promise.resolve().then(() => {
      writeSession({
        uid: `guest-${Date.now().toString(36)}`,
        email: null,
        isAnonymous: true,
        role: normalizeRole(opts && opts.role)
      });
      return getSessionUser();
    });
  }

  /** @returns {Promise<void>} */
  function signOutUser() {
    writeSession(null);
    return Promise.resolve();
  }

  /**
   * @param {(user: { uid: string, email: string | null, isAnonymous: boolean, role: DemoRole } | null) => void} callback
   * @returns {() => void}
   */
  function onAuth(callback) {
    listeners.add(callback);
    callback(getSessionUser());
    return () => listeners.delete(callback);
  }

  function currentUserLabel() {
    const u = getSessionUser();
    if (!u) return "Signed out";
    if (u.isAnonymous) return "Guest";
    return u.email || "Account";
  }

  global.SwiftBiteAuth = {
    VALID_ROLES,
    normalizeRole,
    signInWithEmail,
    signUpWithEmail,
    continueAsGuest,
    signOutUser,
    onAuth,
    getRole,
    currentUserLabel,
    authInstance: () => null
  };
})(window);

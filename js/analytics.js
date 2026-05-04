// SwiftBite — local demo analytics (no Firebase). KPI counters live in sessionStorage.
(function () {
  const STORAGE_KEY = "swiftbite_demo_kpis_v1";

  /** @type {Record<string, number>} */
  let metrics = {};

  function loadMetrics() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      metrics = raw ? JSON.parse(raw) : {};
      if (!metrics || typeof metrics !== "object") metrics = {};
    } catch {
      metrics = {};
    }
  }

  function saveMetrics() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    } catch {
      /* ignore quota */
    }
  }

  function sanitizeParams(obj) {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v === undefined || v === null) return;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
      }
    });
    return out;
  }

  function mapEventToKpiFields(eventName, params) {
    /** @type {string[]} */
    const fields = [];
    const p = params || {};
    switch (eventName) {
      case "login_success":
        fields.push("login_success");
        break;
      case "swiftbite_screen_view":
        if (p.screen_name === "login") fields.push("screen_login");
        if (p.screen_name === "dashboard") fields.push("screen_dashboard");
        if (p.screen_name === "restaurant") fields.push("screen_restaurant");
        if (p.screen_name === "food_item") fields.push("screen_food_item");
        if (p.screen_name === "analytics_dashboard") fields.push("screen_analytics");
        break;
      case "order_now_click":
        fields.push("order_now_clicks");
        break;
      case "nav_restaurants_tab":
        fields.push("nav_restaurant_tab");
        break;
      case "dashboard_open_restaurant":
        fields.push("dashboard_to_restaurant");
        break;
      case "menu_item_open":
        fields.push("menu_item_opens");
        break;
      case "menu_quick_add":
        fields.push("menu_quick_adds");
        break;
      case "add_to_cart":
        fields.push("add_to_cart");
        break;
      case "favorite_toggle":
        fields.push("favorite_toggles");
        break;
      case "back_navigation":
        fields.push("back_clicks");
        break;
      case "forgot_password_click":
        fields.push("forgot_password_clicks");
        break;
      case "signup_prompt_click":
        fields.push("signup_prompt_clicks");
        break;
      case "checkout_demo_click":
        fields.push("checkout_clicks");
        break;
      case "order_placed":
        fields.push("orders_placed");
        break;
      default:
        break;
    }
    return fields;
  }

  function bump(fields) {
    if (!fields.length) return;
    loadMetrics();
    fields.forEach((f) => {
      metrics[f] = (metrics[f] || 0) + 1;
    });
    saveMetrics();
  }

  /**
   * @param {string} eventName
   * @param {Record<string, string | number | boolean>} [params]
   */
  function track(eventName, params) {
    const p = sanitizeParams(params || {});
    bump(mapEventToKpiFields(eventName, p));
  }

  function screenNameFromPath() {
    const raw = (window.location.pathname.split("/").pop() || "").split("?")[0].toLowerCase();
    if (raw === "index.html" || raw === "") return "login";
    if (raw === "dashboard.html") return "dashboard";
    if (raw === "restaurant.html") return "restaurant";
    if (raw === "fooditem.html") return "food_item";
    if (raw === "analytics-dashboard.html") return "analytics_dashboard";
    if (raw === "order-confirmed.html") return "order_confirmed";
    if (raw === "tracking.html") return "tracking";
    if (raw === "orders.html") return "orders";
    if (raw === "signup.html") return "signup";
    if (raw === "cart.html") return "cart";
    if (raw === "search.html") return "search";
    if (raw === "profile.html") return "profile";
    return raw.replace(".html", "") || "unknown";
  }

  function trackPageView() {
    track("swiftbite_screen_view", { screen_name: screenNameFromPath() });
  }

  function getDemoSummary() {
    loadMetrics();
    return { ...metrics };
  }

  window.SwiftBiteAnalytics = {
    track,
    trackPageView,
    screenNameFromPath,
    getDemoSummary
  };
})();

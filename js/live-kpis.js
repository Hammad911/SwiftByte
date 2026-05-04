/**
 * SwiftBite — KPI widgets backed by SwiftBiteAnalytics demo counters (sessionStorage).
 */
(function (global) {
  const DEFAULT_FIELD_MAP = [
    ["login_success", "k-login_success"],
    ["screen_dashboard", "k-screen_dashboard"],
    ["screen_restaurant", "k-screen_restaurant"],
    ["screen_food_item", "k-screen_food_item"],
    ["order_now_clicks", "k-order_now_clicks"],
    ["add_to_cart", "k-add_to_cart"],
    ["menu_quick_adds", "k-menu_quick_adds"],
    ["menu_item_opens", "k-menu_item_opens"],
    ["favorite_toggles", "k-favorite_toggles"],
    ["back_clicks", "k-back_clicks"],
    ["orders_placed", "k-orders_placed"]
  ];

  function cellText(data, field) {
    const v = data[field];
    return typeof v === "number" ? String(v) : String(v || "0");
  }

  /**
   * @param {{
   *   fieldMap?: [string, string][],
   *   onStatus?: (kind: 'loading'|'ok'|'warn'|'err', message: string) => void,
   *   onData?: (data: object) => void
   * }} options
   * @returns {() => void} unsubscribe
   */
  function subscribeMetricsSummary(options) {
    const opts = options || {};
    const fieldMap = opts.fieldMap || DEFAULT_FIELD_MAP;
    const onStatus = typeof opts.onStatus === "function" ? opts.onStatus : function () {};

    function readSummary() {
      if (global.SwiftBiteAnalytics && typeof global.SwiftBiteAnalytics.getDemoSummary === "function") {
        return global.SwiftBiteAnalytics.getDemoSummary();
      }
      return {};
    }

    function paint() {
      const data = readSummary();
      fieldMap.forEach(([field, elemId]) => {
        const el = document.getElementById(elemId);
        if (!el) return;
        el.textContent = cellText(data, field);
        el.classList.remove("na");
      });
      if (opts.onData) opts.onData(data);
    }

    onStatus("ok", "Demo · this browser session");
    paint();
    const t = global.setInterval(paint, 700);
    return function () {
      global.clearInterval(t);
    };
  }

  global.SwiftBiteLiveKpis = {
    subscribeMetricsSummary,
    DEFAULT_FIELD_MAP
  };
})(window);

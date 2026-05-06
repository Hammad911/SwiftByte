/**
 * SwiftBite — role stats from localStorage orders (demo).
 */
(function () {
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pageFile() {
    return (window.location.pathname.split("/").pop() || "").split("?")[0].toLowerCase();
  }

  function formatRs(n) {
    const x = Math.round(Number(n) || 0);
    return `Rs. ${x.toLocaleString("en-PK")}`;
  }

  function statTile(label, value, sub) {
    const subHtml = sub ? `<div class="st-stat-sub">${escapeHtml(sub)}</div>` : "";
    return `<div class="st-stat-card"><div class="st-stat-label">${escapeHtml(label)}</div><div class="st-stat-value">${value}</div>${subHtml}</div>`;
  }

  function subscribeRefresh(render) {
    window.addEventListener("swiftbite_orders_changed", render);
    window.addEventListener("storage", (e) => {
      if (window.SwiftBiteOrders && e.key === window.SwiftBiteOrders.STORAGE_KEY) render();
    });
  }

  function initRiderStats() {
    const root = document.getElementById("stats-root");
    const Orders = window.SwiftBiteOrders;
    if (!root || !Orders) return;

    function render() {
      const all = Orders.listOrders();
      const delivered = all.filter((o) => o.status === Orders.ORDER_STATUS.DELIVERED);
      const out = all.filter((o) => o.status === Orders.ORDER_STATUS.PICKED_UP);
      const ready = all.filter((o) => o.status === Orders.ORDER_STATUS.READY_FOR_PICKUP);
      const revenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const avg = delivered.length ? Math.round(revenue / delivered.length) : 0;

      const recent = [...delivered]
        .sort((a, b) => (b.statusUpdatedAt || b.createdAt) - (a.statusUpdatedAt || a.createdAt))
        .slice(0, 6);

      let listHtml = "";
      if (recent.length) {
        listHtml = `<div class="st-section">Recent completed</div><ul class="st-list">`;
        recent.forEach((o) => {
          const t = new Date(o.statusUpdatedAt || o.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
          listHtml += `<li><span>${escapeHtml(o.restaurantName)} · ${formatRs(o.total)}</span><span class="st-list-meta">${escapeHtml(t)}</span></li>`;
        });
        listHtml += "</ul>";
      } else {
        listHtml = '<p class="st-empty">No completed deliveries on this device yet. Finish a trip in the rider hub.</p>';
      }

      root.innerHTML = `
        <p class="st-hint">Totals are based on orders stored in this browser (demo).</p>
        <div class="st-grid">
          ${statTile("Deliveries done", escapeHtml(String(delivered.length)), "Marked delivered")}
          ${statTile("On the road now", escapeHtml(String(out.length)), "Picked up, not dropped")}
          ${statTile("Batch ready", escapeHtml(String(ready.length)), "Waiting at restaurants")}
          ${statTile("Value delivered", escapeHtml(formatRs(revenue)), delivered.length ? `Avg ${formatRs(avg)}` : "—")}
        </div>
        ${listHtml}
      `;
    }

    render();
    subscribeRefresh(render);
  }

  function initRestaurantStats() {
    const root = document.getElementById("stats-root");
    const select = document.getElementById("rs-outlet");
    const Orders = window.SwiftBiteOrders;
    const Menu = window.SwiftBiteMenu;
    if (!root || !select || !Orders || !Menu) return;

    Menu.RESTAURANTS.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    });
    const params = new URLSearchParams(window.location.search);
    const q = params.get("r");
    if (q && Menu.RESTAURANTS.some((x) => x.id === q)) select.value = q;

    function sliceForOutlet() {
      const rid = select.value;
      return Orders.listOrders().filter((o) => o.restaurantId === rid);
    }

    function render() {
      const orders = sliceForOutlet();
      const delivered = orders.filter((o) => o.status === Orders.ORDER_STATUS.DELIVERED);
      const declined = orders.filter((o) => o.status === Orders.ORDER_STATUS.DECLINED);
      const cancelled = orders.filter((o) => o.status === Orders.ORDER_STATUS.CANCELLED_BY_CUSTOMER);
      const pending = orders.filter((o) => o.status === Orders.ORDER_STATUS.PENDING_RESTAURANT).length;
      const prep = orders.filter((o) => o.status === Orders.ORDER_STATUS.PREPARING).length;
      const ready = orders.filter((o) => o.status === Orders.ORDER_STATUS.READY_FOR_PICKUP).length;
      const out = orders.filter((o) => o.status === Orders.ORDER_STATUS.PICKED_UP).length;
      const active = prep + ready + out;

      const revenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);

      root.innerHTML = `
        <p class="st-hint">Figures for the selected outlet only · this device.</p>
        <div class="st-grid">
          ${statTile("Completed", escapeHtml(String(delivered.length)), "Served end-to-end")}
          ${statTile("Kitchen live", escapeHtml(String(active)), `${prep} prep · ${ready} ready · ${out} with rider`)}
          ${statTile("Awaiting approve", escapeHtml(String(pending)), "New requests")}
          ${statTile("Rejected", escapeHtml(String(declined.length)), "You declined")}
          ${statTile("Cust. cancelled", escapeHtml(String(cancelled.length)), "Before prep")}
          ${statTile("Revenue (done)", escapeHtml(formatRs(revenue)), delivered.length ? "Delivered orders only" : "—")}
        </div>
      `;
    }

    select.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("r", select.value);
      window.history.replaceState({}, "", url.toString());
      render();
    });

    render();
    subscribeRefresh(render);
  }

  function initCustomerStats() {
    const root = document.getElementById("stats-root");
    const Orders = window.SwiftBiteOrders;
    if (!root || !Orders) return;

    function render() {
      const all = Orders.listOrders();
      const byRest = /** @type {Record<string, { name: string, n: number }>} */ ({});
      all.forEach((o) => {
        if (!byRest[o.restaurantId]) byRest[o.restaurantId] = { name: o.restaurantName, n: 0 };
        byRest[o.restaurantId].n += 1;
      });
      let top = { name: "—", n: 0 };
      Object.keys(byRest).forEach((k) => {
        if (byRest[k].n > top.n) top = { name: byRest[k].name, n: byRest[k].n };
      });

      const delivered = all.filter((o) => o.status === Orders.ORDER_STATUS.DELIVERED);
      const declined = all.filter((o) => o.status === Orders.ORDER_STATUS.DECLINED);
      const cancelled = all.filter((o) => o.status === Orders.ORDER_STATUS.CANCELLED_BY_CUSTOMER);
      const inFlight = all.filter(
        (o) =>
          o.status !== Orders.ORDER_STATUS.DELIVERED &&
          o.status !== Orders.ORDER_STATUS.DECLINED &&
          o.status !== Orders.ORDER_STATUS.CANCELLED_BY_CUSTOMER
      ).length;

      const spent = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);

      let sessionHint = "";
      if (window.SwiftBiteAnalytics && typeof window.SwiftBiteAnalytics.getDemoSummary === "function") {
        const m = window.SwiftBiteAnalytics.getDemoSummary();
        const placed = m.orders_placed || 0;
        if (placed) {
          sessionHint = `<p class="st-hint">This browser session: <strong>${placed}</strong> checkout(s) logged in analytics.</p>`;
        }
      }

      root.innerHTML = `
        <p class="st-hint">Your order history on this device (guest or signed-in demo).</p>
        ${sessionHint}
        <div class="st-grid">
          ${statTile("Total orders", escapeHtml(String(all.length)), `${inFlight} in progress`)}
          ${statTile("Delivered", escapeHtml(String(delivered.length)), "Successfully finished")}
          ${statTile("Total spent", escapeHtml(formatRs(spent)), "On completed deliveries")}
          ${statTile("Top restaurant", escapeHtml(top.name), top.n ? `${top.n} orders` : "—")}
          ${statTile("Not completed", escapeHtml(String(declined.length + cancelled.length)), `${declined.length} rejected · ${cancelled.length} you cancelled`)}
        </div>
        <div class="st-section">Quick links</div>
        <a class="st-link-card" href="orders.html">Open full order history →</a>
      `;
    }

    render();
    subscribeRefresh(render);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const f = pageFile();
    if (f === "rider-stats.html") initRiderStats();
    else if (f === "restaurant-stats.html") initRestaurantStats();
    else if (f === "customer-stats.html") initCustomerStats();
  });
})();

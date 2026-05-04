/**
 * SwiftBite — restaurant partner & rider partner demo screens (local orders).
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
    const raw = (window.location.pathname.split("/").pop() || "").split("?")[0].toLowerCase();
    return raw;
  }

  function mapsSearchUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function formatRs(n) {
    const x = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(x)) return "Rs. —";
    return `Rs. ${Math.round(x)}`;
  }

  function pickupLine(order) {
    if (window.SwiftBiteMenu) {
      const r = window.SwiftBiteMenu.getRestaurant(order.restaurantId);
      if (r && r.pickupAddressLine) return r.pickupAddressLine;
    }
    return `${order.restaurantName} (pickup at restaurant)`;
  }

  function deliveryLines(order) {
    const bits = [order.addressLine, order.flatOrBlock].filter(Boolean);
    return bits.join(" · ") || "—";
  }

  /** @param {{ label: string, className?: string, disabled?: boolean, onClick?: () => void }} opts */
  function btn(opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `pp-btn ${opts.className || "pp-btn-secondary"}`;
    b.textContent = opts.label;
    if (opts.disabled) b.disabled = true;
    if (opts.onClick) b.addEventListener("click", opts.onClick);
    return b;
  }

  function sortForRestaurant(list) {
    const rank = {
      pending_restaurant: 0,
      preparing: 1,
      ready_for_pickup: 2,
      picked_up: 3,
      delivered: 4,
      declined: 5
    };
    return [...list].sort((a, b) => {
      const ra = rank[a.status] ?? 9;
      const rb = rank[b.status] ?? 9;
      if (ra !== rb) return ra - rb;
      return b.createdAt - a.createdAt;
    });
  }

  function initRestaurantPortal() {
    const root = document.getElementById("rp-root");
    const select = document.getElementById("rp-rest-select");
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
    const qRest = params.get("r");
    if (qRest && Menu.RESTAURANTS.some((x) => x.id === qRest)) select.value = qRest;

    function render() {
      const rid = select.value;
      let orders = Orders.listOrders().filter((o) => o.restaurantId === rid);
      orders = sortForRestaurant(orders);

      if (!orders.length) {
        root.innerHTML =
          '<p class="pp-empty">No orders for this kitchen yet. Place one from the customer app — it shows up here instantly.</p>';
        return;
      }

      root.innerHTML = "";
      orders.forEach((o) => {
        const card = document.createElement("div");
        card.className = "pp-order-card";

        const itemsText = o.lines
          .map((ln) => `${ln.quantity}× ${ln.name}${ln.extrasNote ? ` (${ln.extrasNote})` : ""}`)
          .join("\n");

        const statusCls = o.status === "delivered" || o.status === "declined" ? "pp-status pp-muted" : "pp-status";
        const actions = document.createElement("div");
        actions.className = "pp-actions";

        if (o.status === Orders.ORDER_STATUS.PENDING_RESTAURANT) {
          actions.appendChild(
            btn({
              label: "Accept order",
              className: "pp-btn-primary",
              onClick: () => {
                Orders.updateStatus(o.id, Orders.ORDER_STATUS.PREPARING);
                render();
              }
            })
          );
          actions.appendChild(
            btn({
              label: "Decline",
              className: "pp-btn-danger",
              onClick: () => {
                if (window.confirm("Decline this order? The customer will see it as declined.")) {
                  Orders.updateStatus(o.id, Orders.ORDER_STATUS.DECLINED);
                  render();
                }
              }
            })
          );
        } else if (o.status === Orders.ORDER_STATUS.PREPARING) {
          actions.appendChild(
            btn({
              label: "Mark ready for pickup",
              className: "pp-btn-primary",
              onClick: () => {
                Orders.updateStatus(o.id, Orders.ORDER_STATUS.READY_FOR_PICKUP);
                render();
              }
            })
          );
        } else if (o.status === Orders.ORDER_STATUS.READY_FOR_PICKUP) {
          actions.appendChild(
            btn({
              label: "Waiting for rider",
              className: "pp-btn-secondary",
              disabled: true
            })
          );
        } else if (o.status === Orders.ORDER_STATUS.PICKED_UP) {
          actions.appendChild(
            btn({
              label: "Out with rider",
              className: "pp-btn-secondary",
              disabled: true
            })
          );
        }

        card.innerHTML = `
          <div class="pp-order-head">
            <div>
              <strong>${escapeHtml(o.restaurantName)}</strong>
              <div class="pp-order-id">${escapeHtml(o.id)} · ${formatRs(o.total)}</div>
            </div>
            <span class="${statusCls}">${escapeHtml(Orders.statusLabel(o.status))}</span>
          </div>
          <div class="pp-lines">${escapeHtml(itemsText).replace(/\n/g, "<br>")}</div>
          <div class="pp-block-label">Deliver to</div>
          <div class="pp-address">${escapeHtml(deliveryLines(o))}</div>
          ${o.phone ? `<div class="pp-block-label">Customer phone</div><div class="pp-address">${escapeHtml(o.phone)}</div>` : ""}
          ${o.instructions ? `<div class="pp-block-label">Instructions</div><div class="pp-address">${escapeHtml(o.instructions)}</div>` : ""}
        `;

        if (actions.childNodes.length) card.appendChild(actions);
        root.appendChild(card);
      });
    }

    select.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("r", select.value);
      window.history.replaceState({}, "", url.toString());
      render();
    });

    window.addEventListener("swiftbite_orders_changed", render);
    render();
  }

  function initRiderPortal() {
    const pickupRoot = document.getElementById("rd-pickup-root");
    const dropRoot = document.getElementById("rd-drop-root");
    const Orders = window.SwiftBiteOrders;
    if (!pickupRoot || !dropRoot || !Orders) return;

    function render() {
      const all = Orders.listOrders();
      const pickup = all.filter((o) => o.status === Orders.ORDER_STATUS.READY_FOR_PICKUP).sort((a, b) => a.createdAt - b.createdAt);
      const dropping = all.filter((o) => o.status === Orders.ORDER_STATUS.PICKED_UP).sort((a, b) => a.createdAt - b.createdAt);

      if (!pickup.length) {
        pickupRoot.innerHTML = '<p class="pp-empty">No pickups waiting. Restaurants will queue orders marked “ready for pickup”.</p>';
      } else {
        pickupRoot.innerHTML = "";
        pickup.forEach((o) => {
          const card = document.createElement("div");
          card.className = "pp-order-card";
          const pk = pickupLine(o);
          const itemsShort = o.lines.map((ln) => `${ln.quantity}× ${ln.name}`).join(", ");

          card.innerHTML = `
            <div class="pp-order-head">
              <div>
                <strong>${escapeHtml(o.restaurantName)}</strong>
                <div class="pp-order-id">${escapeHtml(o.id)} · ${formatRs(o.total)}</div>
              </div>
              <span class="pp-status">${escapeHtml(Orders.statusLabel(o.status))}</span>
            </div>
            <div class="pp-block-label">Pickup location</div>
            <div class="pp-address">${escapeHtml(pk)}</div>
            <div class="pp-lines">${escapeHtml(itemsShort)}</div>
          `;

          const actions = document.createElement("div");
          actions.className = "pp-actions";
          actions.appendChild(
            btn({
              label: "Open in Maps",
              className: "pp-btn-maps",
              onClick: () => {
                window.open(mapsSearchUrl(pk), "_blank", "noopener,noreferrer");
              }
            })
          );
          actions.appendChild(
            btn({
              label: "Collected — start delivery",
              className: "pp-btn-primary",
              onClick: () => {
                Orders.updateStatus(o.id, Orders.ORDER_STATUS.PICKED_UP);
                render();
              }
            })
          );
          card.appendChild(actions);
          pickupRoot.appendChild(card);
        });
      }

      if (!dropping.length) {
        dropRoot.innerHTML = '<p class="pp-empty">Nothing out for delivery. After you collect from the restaurant, the drop-off appears here.</p>';
      } else {
        dropRoot.innerHTML = "";
        dropping.forEach((o) => {
          const card = document.createElement("div");
          card.className = "pp-order-card";
          const dropAddr = deliveryLines(o);
          const telHref = o.phone ? o.phone.replace(/[^\d+]/g, "") : "";

          card.innerHTML = `
            <div class="pp-order-head">
              <div>
                <strong>Drop-off</strong>
                <div class="pp-order-id">${escapeHtml(o.id)} · ${escapeHtml(o.restaurantName)}</div>
              </div>
              <span class="pp-status">${escapeHtml(Orders.statusLabel(o.status))}</span>
            </div>
            <div class="pp-block-label">Deliver to</div>
            <div class="pp-address">${escapeHtml(dropAddr)}</div>
            ${
              o.phone && telHref
                ? `<div class="pp-block-label">Customer phone</div><div class="pp-address"><a href="tel:${escapeHtml(telHref)}">${escapeHtml(o.phone)}</a></div>`
                : ""
            }
            ${o.instructions ? `<div class="pp-block-label">Instructions</div><div class="pp-address">${escapeHtml(o.instructions)}</div>` : ""}
          `;

          const actions = document.createElement("div");
          actions.className = "pp-actions";
          actions.appendChild(
            btn({
              label: "Navigate (Maps)",
              className: "pp-btn-maps",
              onClick: () => {
                window.open(mapsSearchUrl(`${dropAddr}`), "_blank", "noopener,noreferrer");
              }
            })
          );
          actions.appendChild(
            btn({
              label: "Mark delivered",
              className: "pp-btn-primary",
              onClick: () => {
                Orders.updateStatus(o.id, Orders.ORDER_STATUS.DELIVERED);
                render();
              }
            })
          );
          card.appendChild(actions);
          dropRoot.appendChild(card);
        });
      }
    }

    window.addEventListener("swiftbite_orders_changed", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const f = pageFile();
    if (f === "restaurant-portal.html") initRestaurantPortal();
    else if (f === "rider-portal.html") initRiderPortal();
  });
})();

// ==========================================
//  SwiftBite — app.js
//  Phases: prototype UI → core flows (auth, data, cart) → polish (analytics, KPI)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  function currentPageFile() {
    const raw = (window.location.pathname.split("/").pop() || "").split("?")[0].toLowerCase();
    return raw;
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  const file = currentPageFile();

  function readSelectedAuthRole() {
    const el = document.querySelector('input[name="sb-login-role"]:checked');
    const raw = el && el.value ? String(el.value) : "customer";
    if (window.SwiftBiteAuth && typeof window.SwiftBiteAuth.normalizeRole === "function") {
      return window.SwiftBiteAuth.normalizeRole(raw);
    }
    return raw === "rider" || raw === "restaurant_manager" ? raw : "customer";
  }

  /** @param {string} role */
  function authLandingHref(role) {
    if (role === "rider") return "rider-portal.html";
    if (role === "restaurant_manager") return "restaurant-portal.html";
    return "dashboard.html";
  }

  function isLoginPage() {
    const t = document.querySelector("h2.title");
    return Boolean(t && t.textContent.trim() === "Login");
  }

  function showToast(message) {
    const old = document.getElementById("sb-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "sb-toast";
    toast.textContent = message;
    toast.style.cssText = [
      "position:fixed",
      "bottom:30px",
      "left:50%",
      "transform:translateX(-50%)",
      "max-width:90vw",
      "background:#222",
      "color:#fff",
      "padding:10px 20px",
      "border-radius:20px",
      "font-size:13px",
      "font-family:'Poppins',sans-serif",
      "z-index:9999",
      "box-shadow:0 4px 15px rgba(0,0,0,0.3)",
      "opacity:0",
      "transition:opacity 0.3s"
    ].join(";");
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  window.SwiftBiteUI = { showToast };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function authErrorMessage(err) {
    const code = err && err.code ? String(err.code) : "";
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Email or password is incorrect.";
    }
    if (code === "auth/email-already-in-use") return "That email is already registered.";
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    if (code === "auth/invalid-email") return "Invalid email address.";
    if (code === "auth/network-request-failed") return "Network error. Check your connection.";
    return (err && err.message) || "Something went wrong. Try again.";
  }

  function syncCartBadge() {
    const el = document.getElementById("cart-badge");
    if (!el || !window.SwiftBiteCart) return;
    el.textContent = String(window.SwiftBiteCart.getTotals().count);
  }

  if (window.SwiftBiteCart) {
    window.SwiftBiteCart.subscribe(() => syncCartBadge());
    syncCartBadge();
  }

  const headerCart = document.getElementById("header-cart-btn");
  if (headerCart) {
    headerCart.style.cursor = "pointer";
    headerCart.addEventListener("click", () => {
      window.location.href = "cart.html";
    });
  }

  /* ── BACK BUTTON ─────────────────────────────────────────── */

  function navigateBack() {
    if (window.SwiftBiteAnalytics) {
      window.SwiftBiteAnalytics.track("back_navigation", {
        from_screen: window.SwiftBiteAnalytics.screenNameFromPath()
      });
    }

    const page = currentPageFile();

    if (window.history.length <= 1) {
      if (page === "fooditem.html") {
        const r = qs("r") || "taco-cubano";
        window.location.href = `restaurant.html?r=${encodeURIComponent(r)}`;
        return;
      }
      if (page === "restaurant.html") {
        window.location.href = "dashboard.html";
        return;
      }
      if (page === "cart.html" || page === "search.html" || page === "profile.html") {
        window.location.href = "dashboard.html";
        return;
      }
      if (page === "order-confirmed.html" || page === "tracking.html" || page === "orders.html") {
        window.location.href = "dashboard.html";
        return;
      }
      if (page === "signup.html") {
        window.location.href = "index.html";
        return;
      }
      if (page === "dashboard.html") {
        window.location.href = "index.html";
        return;
      }
      if (isLoginPage()) {
        showToast("Nothing to go back to");
        return;
      }
    }

    window.history.back();
  }

  function initScreenBackButton() {
    if (document.getElementById("sb-back-btn-styles") == null) {
      const style = document.createElement("style");
      style.id = "sb-back-btn-styles";
      style.textContent = `
        .sb-back-btn {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 100;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          color: #222;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          font-family: 'Poppins', sans-serif;
          padding: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .sb-back-btn:hover { transform: scale(1.05); box-shadow: 0 3px 14px rgba(0, 0, 0, 0.18); }
        .sb-back-btn:active { transform: scale(0.96); }
        .container.sb-has-back-btn {
          padding-top: 48px;
        }
      `;
      document.head.appendChild(style);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sb-back-btn";
    btn.setAttribute("aria-label", "Go back");
    btn.textContent = "\u2190";
    btn.addEventListener("click", navigateBack);

    const container = document.querySelector(".container");
    if (container) {
      if (!container.style.position) container.style.position = "relative";
      container.insertBefore(btn, container.firstChild);
      container.classList.add("sb-has-back-btn");
    } else {
      btn.style.position = "fixed";
      btn.style.top = "max(16px, env(safe-area-inset-top))";
      btn.style.left = "max(16px, env(safe-area-inset-left))";
      btn.style.zIndex = "10000";
      document.body.appendChild(btn);
    }
  }

  if (!(file === "index.html" && isLoginPage())) {
    initScreenBackButton();
  }

  /* ── LOGIN (index.html) ───────────────────────────────────── */

  const eyeBtn = document.querySelector(".eye");
  const passwordInput = document.querySelector("#login-password") || document.querySelector('input[type="password"]');

  if (eyeBtn && passwordInput) {
    eyeBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      eyeBtn.textContent = isHidden ? "\ud83d\ude48" : "\ud83d\udc41";
    });
  }

  const loginBtn = document.querySelector("#login-submit") || document.querySelector(".btn.primary-login");

  if (loginBtn && file === "index.html") {
    loginBtn.addEventListener("click", () => {
      const emailInput = document.querySelector("#login-email") || document.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value.trim() : "";

      if (!email || !password) {
        showToast("Please enter your email and password.");
        return;
      }
      if (!isValidEmail(email)) {
        showToast("Please enter a valid email address.");
        return;
      }

      loginBtn.textContent = "Logging in\u2026";
      loginBtn.disabled = true;

      if (!window.SwiftBiteAuth) {
        showToast("Could not load sign-in.");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
        return;
      }

      const role = readSelectedAuthRole();

      window.SwiftBiteAuth.signInWithEmail(email, password, { role })
        .then(() => {
          if (window.SwiftBiteAnalytics) {
            window.SwiftBiteAnalytics.track("login_success", { method: "email_password", role });
          }
          window.location.href = authLandingHref(role);
        })
        .catch((err) => {
          showToast(authErrorMessage(err));
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        });
    });
  }

  const guestBtn = document.getElementById("guest-btn");
  if (guestBtn && file === "index.html") {
    guestBtn.addEventListener("click", () => {
      guestBtn.disabled = true;
      if (!window.SwiftBiteAuth) {
        showToast("Could not load sign-in.");
        guestBtn.disabled = false;
        return;
      }
      const role = readSelectedAuthRole();
      window.SwiftBiteAuth.continueAsGuest({ role })
        .then(() => {
          if (window.SwiftBiteAnalytics) {
            window.SwiftBiteAnalytics.track("login_success", { method: "guest_anonymous", role });
          }
          window.location.href = authLandingHref(role);
        })
        .catch((err) => {
          showToast(authErrorMessage(err));
          guestBtn.disabled = false;
        });
    });
  }

  const forgotLink = document.querySelector(".forgot");
  if (forgotLink && file === "index.html") {
    forgotLink.addEventListener("click", () => {
      if (window.SwiftBiteAnalytics) window.SwiftBiteAnalytics.track("forgot_password_click");
      const emailInput = document.querySelector("#login-email") || document.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : "";
      if (!email || !isValidEmail(email)) {
        showToast("Enter your email above first.");
        return;
      }
      showToast("Demo mode — password reset is not connected. Use any password you remember locally.");
    });
  }

  const signupLink = document.querySelector(".signup span[data-go-signup]");
  if (signupLink) {
    signupLink.style.cursor = "pointer";
    signupLink.addEventListener("click", () => {
      if (window.SwiftBiteAnalytics) window.SwiftBiteAnalytics.track("signup_prompt_click");
      window.location.href = "signup.html";
    });
  }

  document.querySelectorAll(".social").forEach((btn) => {
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      if (window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("social_login_click", { provider: btn.textContent.trim() });
      }
      showToast(`${btn.textContent.trim()} \u2014 coming soon!`);
    });
  });

  /* ── SIGNUP (signup.html) ─────────────────────────────────── */

  const signupSubmit = document.getElementById("signup-submit");
  const signupPassword = document.getElementById("signup-password");
  const signupEye = document.querySelector(".signup-page .eye");

  if (signupEye && signupPassword) {
    signupEye.addEventListener("click", () => {
      const isHidden = signupPassword.type === "password";
      signupPassword.type = isHidden ? "text" : "password";
      signupEye.textContent = isHidden ? "\ud83d\ude48" : "\ud83d\udc41";
    });
  }

  if (signupSubmit && file === "signup.html") {
    signupSubmit.addEventListener("click", () => {
      const emailInput = document.getElementById("signup-email");
      const email = emailInput ? emailInput.value.trim() : "";
      const password = signupPassword ? signupPassword.value.trim() : "";

      if (!email || !password) {
        showToast("Enter email and password.");
        return;
      }
      if (!isValidEmail(email)) {
        showToast("Please enter a valid email address.");
        return;
      }

      signupSubmit.textContent = "Creating account\u2026";
      signupSubmit.disabled = true;

      if (!window.SwiftBiteAuth) {
        showToast("Could not load sign-in.");
        signupSubmit.disabled = false;
        signupSubmit.textContent = "Sign up";
        return;
      }

      const role = readSelectedAuthRole();

      window.SwiftBiteAuth.signUpWithEmail(email, password, { role })
        .then(() => {
          if (window.SwiftBiteAnalytics) {
            window.SwiftBiteAnalytics.track("login_success", { method: "email_signup", role });
          }
          window.location.href = authLandingHref(role);
        })
        .catch((err) => {
          showToast(authErrorMessage(err));
          signupSubmit.disabled = false;
          signupSubmit.textContent = "Sign up";
        });
    });
  }

  const goLogin = document.getElementById("go-login");
  if (goLogin) {
    goLogin.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  /* ── PROFILE ──────────────────────────────────────────────── */

  const profileEmailEl = document.getElementById("profile-email-line");
  const profileGuestEl = document.getElementById("profile-guest-line");
  const logoutBtn = document.getElementById("logout-btn");

  if ((profileEmailEl || profileGuestEl || logoutBtn) && window.SwiftBiteAuth) {
    window.SwiftBiteAuth.onAuth((user) => {
      if (profileGuestEl) profileGuestEl.style.display = user && user.isAnonymous ? "block" : "none";
      if (profileEmailEl) {
        profileEmailEl.style.display = user && !user.isAnonymous ? "block" : "none";
        if (user && !user.isAnonymous) profileEmailEl.textContent = user.email || "Signed in";
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.SwiftBiteAuth.signOutUser().then(() => {
          window.location.href = "index.html";
        });
      });
    }
  }

  /* ── SEARCH ───────────────────────────────────────────────── */

  function renderSearchPage() {
    if (file !== "search.html" || !window.SwiftBiteMenu) return;
    const root = document.getElementById("search-results");
    const input = document.getElementById("search-input");
    if (!root || !input) return;

    function paint(term) {
      const q = (term || "").trim().toLowerCase();
      root.innerHTML = "";
      window.SwiftBiteMenu.RESTAURANTS.filter((r) => {
        if (!q) return true;
        const blob = `${r.name} ${r.subtitle} ${r.cuisine || ""}`.toLowerCase();
        return blob.includes(q);
      }).forEach((r) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "search-row";
        row.innerHTML = `<strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.subtitle)}</span><span class="search-cuisine">${escapeHtml(r.cuisine)}</span>`;
        row.addEventListener("click", () => {
          window.location.href = `restaurant.html?r=${encodeURIComponent(r.id)}`;
        });
        root.appendChild(row);
      });
    }

    paint("");
    input.addEventListener("input", () => paint(input.value));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatRs(amount) {
    const n = Math.round(Number(amount) || 0);
    return `Rs. ${n.toLocaleString("en-PK")}`;
  }

  function injectModalStylesOnce() {
    if (document.getElementById("sb-modal-styles")) return;
    const st = document.createElement("style");
    st.id = "sb-modal-styles";
    st.textContent = `
      .sb-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .sb-modal {
        background: #fff;
        border-radius: 18px;
        padding: 18px;
        max-width: 300px;
        width: 100%;
        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
      }
      .sb-modal h3 { font-size: 16px; margin: 0 0 8px; color: #111; }
      .sb-modal p { font-size: 12px; color: #555; margin: 0 0 16px; line-height: 1.45; }
      .sb-modal-actions { display: flex; gap: 8px; }
      .sb-modal-actions button {
        flex: 1;
        border: none;
        padding: 10px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        font-size: 13px;
      }
      .sb-modal-cancel { background: #eee; color: #333; }
      .sb-modal-ok { background: #ff4d2e; color: #fff; }
    `;
    document.head.appendChild(st);
  }

  /**
   * @param {{ restaurantId: string, itemId: string, name: string, unitPrice: number, quantity?: number, extrasNote?: string }} payload
   * @param {string} restaurantLabel
   * @param {() => void} onDone optional toast analytics after success
   */
  function upsertCartLineOrSwitchRestaurant(payload, restaurantLabel, onDone) {
    if (!window.SwiftBiteCart) return;
    const ok = window.SwiftBiteCart.upsertLine(payload);
    if (ok) {
      syncCartBadge();
      if (typeof onDone === "function") onDone();
      return;
    }
    const activeId = window.SwiftBiteCart.getActiveRestaurantId();
    let prevName = "another restaurant";
    if (activeId && window.SwiftBiteMenu) {
      prevName = window.SwiftBiteMenu.getRestaurant(activeId).name;
    }
    injectModalStylesOnce();
    const overlay = document.createElement("div");
    overlay.className = "sb-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.innerHTML = `
      <div class="sb-modal">
        <h3>Replace basket?</h3>
        <p>Your basket has items from <strong>${escapeHtml(prevName)}</strong>.
        Switch to <strong>${escapeHtml(restaurantLabel)}</strong>? Your current basket will be cleared.</p>
        <div class="sb-modal-actions">
          <button type="button" class="sb-modal-cancel">Keep basket</button>
          <button type="button" class="sb-modal-ok">Switch restaurant</button>
        </div>
      </div>
    `;
    const cancel = overlay.querySelector(".sb-modal-cancel");
    const okBtn = overlay.querySelector(".sb-modal-ok");
    function close() {
      overlay.remove();
    }
    cancel.addEventListener("click", close);
    okBtn.addEventListener("click", () => {
      window.SwiftBiteCart.clear();
      window.SwiftBiteCart.upsertLine(payload);
      syncCartBadge();
      close();
      if (typeof onDone === "function") onDone();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.body.appendChild(overlay);
  }

  renderSearchPage();

  /* ── CART PAGE ────────────────────────────────────────────── */

  function renderCartPage() {
    if (file !== "cart.html" || !window.SwiftBiteCart || !window.SwiftBiteMenu || !window.SwiftBiteDelivery || !window.SwiftBiteOrders) return;

    const root = document.getElementById("cart-lines");
    const empty = document.getElementById("cart-empty");
    const checkoutPanel = document.getElementById("checkout-panel");
    const checkoutBtn = document.getElementById("checkout-btn");
    const chip = document.getElementById("cart-restaurant-chip");
    const warn = document.getElementById("cart-min-warning");

    const addrEl = document.getElementById("checkout-address");
    const flatEl = document.getElementById("checkout-flat");
    const phoneEl = document.getElementById("checkout-phone");
    const notesEl = document.getElementById("checkout-notes");

    const feeSub = document.getElementById("fee-subtotal");
    const feeDel = document.getElementById("fee-delivery");
    const feeTax = document.getElementById("fee-tax");
    const feeTot = document.getElementById("fee-total");

    const saved = window.SwiftBiteDelivery.get();
    if (addrEl) addrEl.value = saved.addressLine || "";
    if (flatEl) flatEl.value = saved.flatOrBlock || "";
    if (phoneEl) phoneEl.value = saved.phone || "";
    if (notesEl) notesEl.value = saved.instructions || "";

    function persistDeliveryFields() {
      window.SwiftBiteDelivery.set({
        addressLine: addrEl ? addrEl.value.trim() : "",
        flatOrBlock: flatEl ? flatEl.value.trim() : "",
        phone: phoneEl ? phoneEl.value.trim() : "",
        instructions: notesEl ? notesEl.value.trim() : ""
      });
    }

    ["change", "blur"].forEach((ev) => {
      [addrEl, flatEl, phoneEl, notesEl].forEach((el) => {
        if (el) el.addEventListener(ev, persistDeliveryFields);
      });
    });

    function computeTotals(lines, subtotal) {
      const rid = window.SwiftBiteCart.getActiveRestaurantId();
      const r = window.SwiftBiteMenu.getRestaurant(rid || "taco-cubano");
      const delivery = lines.length ? r.deliveryFeePkr : 0;
      const tax = lines.length ? Math.round(subtotal * (r.taxPercent / 100)) : 0;
      const total = subtotal + delivery + tax;
      return { r, delivery, tax, total };
    }

    function paintFees(lines, subtotal) {
      const { r, delivery, tax, total } = computeTotals(lines, subtotal);
      if (feeSub) feeSub.textContent = formatRs(subtotal);
      if (feeDel) feeDel.textContent = formatRs(delivery);
      if (feeTax) feeTax.textContent = `${formatRs(tax)} (${r.taxPercent}% tax)`;
      if (feeTot) feeTot.textContent = formatRs(total);

      if (chip) {
        if (!lines.length) {
          chip.style.display = "none";
          chip.textContent = "";
        } else {
          chip.style.display = "block";
          chip.textContent = `Ordering from · ${r.name}`;
        }
      }

      if (warn) {
        if (lines.length && subtotal < r.minOrderPkr) {
          warn.style.display = "block";
          warn.textContent = `Minimum order is ${formatRs(r.minOrderPkr)}. Add ${formatRs(r.minOrderPkr - subtotal)} more to place delivery.`;
        } else {
          warn.style.display = "none";
        }
      }

      if (checkoutPanel) checkoutPanel.style.display = lines.length ? "block" : "none";

      return { r, delivery, tax, total };
    }

    function paint() {
      const lines = window.SwiftBiteCart.getLines();
      const { subtotal } = window.SwiftBiteCart.getTotals();

      paintFees(lines, subtotal);

      if (!lines.length) {
        if (root) root.innerHTML = "";
        if (empty) empty.style.display = "block";
        return;
      }
      if (empty) empty.style.display = "none";
      if (!root) return;

      root.innerHTML = "";
      lines.forEach((line) => {
        const wrap = document.createElement("div");
        wrap.className = "cart-line";
        const extraHtml = line.extrasNote
          ? `<div class="cart-line-extra">${escapeHtml(line.extrasNote)}</div>`
          : "";
        wrap.innerHTML = `
          <div class="cart-line-body">
            <div class="cart-line-name">${escapeHtml(line.name)}</div>
            ${extraHtml}
            <div class="cart-line-controls">
              <div class="cart-qty">
                <button type="button" class="qty-step" data-d="-1" aria-label="Decrease">−</button>
                <span class="qty-num">${line.quantity}</span>
                <button type="button" class="qty-step" data-d="1" aria-label="Increase">+</button>
              </div>
              <div class="cart-line-price">${formatRs(line.unitPrice * line.quantity)}</div>
            </div>
          </div>
          <button type="button" class="cart-remove" aria-label="Remove">✕</button>
        `;

        wrap.querySelector(".cart-remove").addEventListener("click", () => {
          window.SwiftBiteCart.removeLine(line.restaurantId, line.itemId);
          paint();
          syncCartBadge();
        });

        wrap.querySelectorAll(".qty-step").forEach((btn) => {
          btn.addEventListener("click", () => {
            const delta = Number(btn.getAttribute("data-d"));
            const next = line.quantity + delta;
            window.SwiftBiteCart.setLineQuantity(line.restaurantId, line.itemId, next);
            paint();
            syncCartBadge();
          });
        });

        root.appendChild(wrap);
      });
    }

    paint();
    window.SwiftBiteCart.subscribe(() => paint());

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        persistDeliveryFields();
        const lines = window.SwiftBiteCart.getLines();
        const { subtotal } = window.SwiftBiteCart.getTotals();
        if (!lines.length) {
          showToast("Your basket is empty.");
          return;
        }

        const addressLine = addrEl ? addrEl.value.trim() : "";
        if (addressLine.length < 10) {
          showToast("Enter a full delivery address (building, street, area).");
          addrEl.focus();
          return;
        }

        const phone = phoneEl ? phoneEl.value.replace(/\s/g, "") : "";
        if (phone && phone.length < 10) {
          showToast("Enter a valid phone number or leave it blank.");
          phoneEl.focus();
          return;
        }

        const { r, delivery, tax, total } = computeTotals(lines, subtotal);
        if (subtotal < r.minOrderPkr) {
          showToast(`Minimum order for ${r.name} is ${formatRs(r.minOrderPkr)}.`);
          return;
        }

        const snapshot = JSON.parse(JSON.stringify(lines));

        const order = window.SwiftBiteOrders.placeOrder({
          restaurantId: r.id,
          restaurantName: r.name,
          lines: snapshot,
          addressLine,
          flatOrBlock: flatEl ? flatEl.value.trim() : "",
          phone,
          instructions: notesEl ? notesEl.value.trim() : "",
          subtotal,
          deliveryFee: delivery,
          tax,
          total,
          etaMinutes: r.etaMins
        });

        window.SwiftBiteCart.clear();
        syncCartBadge();

        if (window.SwiftBiteAnalytics) {
          window.SwiftBiteAnalytics.track("order_placed", {
            restaurant_id: r.id,
            item_count: snapshot.reduce((a, x) => a + x.quantity, 0),
            total_pkr: total
          });
        }

        window.location.href = `order-confirmed.html?id=${encodeURIComponent(order.id)}`;
      });
    }
  }

  renderCartPage();

  /* ── RESTAURANT (dynamic) ─────────────────────────────────── */

  function renderRestaurantPage() {
    if (file !== "restaurant.html" || !window.SwiftBiteMenu) return;
    const rId = qs("r") || "taco-cubano";
    const data = window.SwiftBiteMenu.getRestaurant(rId);

    const banner = document.getElementById("sb-rest-banner");
    const bannerTitle = document.getElementById("sb-rest-banner-title");
    const nameEl = document.getElementById("sb-rest-name");
    const subEl = document.getElementById("sb-rest-subtitle");
    const infoEl = document.getElementById("sb-rest-info");
    const root = document.getElementById("sb-menu-root");

    if (banner) {
      banner.className = `banner ${data.bannerClass}`;
    }
    if (bannerTitle) bannerTitle.innerHTML = data.bannerTitle;
    if (nameEl) nameEl.textContent = data.name;
    if (subEl) subEl.textContent = data.subtitle;
    if (infoEl) {
      infoEl.innerHTML = `${data.ratingLine}<br>${data.deliveryLine}<br><strong>${formatRs(data.deliveryFeePkr)} delivery</strong> · Min ${formatRs(data.minOrderPkr)}<br>${data.hoursLine}`;
    }
    if (!root) return;

    root.innerHTML = "";
    data.items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "menu-item";
      div.innerHTML = `
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description)}</p>
          <span class="price">Rs. ${item.price}</span>
        </div>
        <div class="food-img" style="background-image:url('${escapeHtml(item.image)}')"></div>
      `;

      div.addEventListener("click", () => {
        if (window.SwiftBiteAnalytics) {
          window.SwiftBiteAnalytics.track("menu_item_open", { item_name: item.name });
        }
        window.location.href = `foodItem.html?r=${encodeURIComponent(data.id)}&item=${encodeURIComponent(item.id)}`;
      });

      const col = div.querySelector("div");
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.textContent = "+ Add";
      addBtn.className = "add-btn";
      addBtn.style.cssText =
        "margin-top:6px;background:#ff4d2e;color:white;border:none;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;";
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        upsertCartLineOrSwitchRestaurant(
          {
            restaurantId: data.id,
            itemId: item.id,
            name: item.name,
            unitPrice: item.price,
            quantity: 1
          },
          data.name,
          () => {
            if (window.SwiftBiteAnalytics) {
              window.SwiftBiteAnalytics.track("menu_quick_add", { item_name: item.name });
            }
            showToast(`${item.name} added to cart \ud83d\uded2`);
          }
        );
      });
      col.appendChild(addBtn);
      root.appendChild(div);
    });
  }

  renderRestaurantPage();

  /* ── FOOD ITEM (dynamic + cart) ───────────────────────────── */

  function renderFoodItemPage() {
    if (file !== "fooditem.html" || !window.SwiftBiteMenu) return;
    const rId = qs("r") || "taco-cubano";
    const itemId = qs("item") || "";
    const restaurant = window.SwiftBiteMenu.getRestaurant(rId);
    const item = window.SwiftBiteMenu.getMenuItem(rId, itemId);

    const cleanName = item.name.replace(/^\d+\.\s*/, "");
    const titleEl = document.querySelector(".item-title");
    const descEl = document.querySelector(".item-desc");
    const hero = document.querySelector(".hero");
    if (titleEl) titleEl.textContent = cleanName;
    if (descEl) descEl.textContent = item.description;
    if (hero) hero.style.backgroundImage = `url('${item.image}')`;

    const BASE_PRICE = item.price;
    const qtyMinus = document.getElementById("qty-minus");
    const qtyPlus = document.getElementById("qty-plus");
    const qtyValue = document.getElementById("qty-value");
    const cartPrice = document.getElementById("cart-price");
    const cartBtn = document.getElementById("cart-btn");

    let qty = 1;

    function extrasSummary() {
      const boxes = Array.from(document.querySelectorAll("#extras-options input[type=checkbox]"));
      const labels = Array.from(document.querySelectorAll("#extras-options .option-row span:first-child"));
      const picked = [];
      boxes.forEach((box, i) => {
        if (box.checked && labels[i]) picked.push(labels[i].textContent.trim());
      });
      const spice = document.querySelector('#spice-options input[name="spice"]:checked');
      const spiceRow = spice && spice.closest ? spice.closest(".option-row") : null;
      const spiceLabel = spiceRow ? spiceRow.querySelector("span") : null;
      const spiceTxt = spiceLabel ? spiceLabel.textContent.trim() : "";
      const parts = [];
      if (picked.length) parts.push(`Extras: ${picked.join(", ")}`);
      if (spiceTxt) parts.push(`Spice: ${spiceTxt}`);
      return parts.join(" · ");
    }

    function updateUI() {
      if (qtyValue) qtyValue.textContent = String(qty);
      if (cartPrice) cartPrice.textContent = `Rs. ${BASE_PRICE * qty}`;
    }

    if (qtyMinus) {
      qtyMinus.addEventListener("click", () => {
        if (qty > 1) {
          qty -= 1;
          updateUI();
        }
      });
    }
    if (qtyPlus) {
      qtyPlus.addEventListener("click", () => {
        qty += 1;
        updateUI();
      });
    }

    updateUI();

    if (cartBtn) {
      cartBtn.addEventListener("click", () => {
        const note = extrasSummary();
        upsertCartLineOrSwitchRestaurant(
          {
            restaurantId: restaurant.id,
            itemId: item.id,
            name: cleanName,
            unitPrice: BASE_PRICE,
            quantity: qty,
            extrasNote: note || undefined
          },
          restaurant.name,
          () => {
            if (window.SwiftBiteAnalytics) {
              window.SwiftBiteAnalytics.track("add_to_cart", { item_name: cleanName, quantity: qty });
            }
            showToast(`${qty} \u00d7 ${cleanName} added to cart \ud83d\uded2`);
          }
        );
      });
    }
  }

  renderFoodItemPage();

  /* ── DASHBOARD ────────────────────────────────────────────── */

  const dots = document.querySelectorAll(".dots span");
  if (dots.length) {
    let current = 0;
    setInterval(() => {
      dots[current].classList.remove("active");
      current = (current + 1) % dots.length;
      dots[current].classList.add("active");
    }, 2500);
  }

  const orderNowBtn = document.querySelector(".banner button");
  if (orderNowBtn) {
    orderNowBtn.addEventListener("click", () => {
      if (window.SwiftBiteAnalytics) window.SwiftBiteAnalytics.track("order_now_click");
      window.location.href = "restaurant.html?r=taco-cubano";
    });
  }

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item, index) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      const pages = ["dashboard.html", "search.html", "search.html", null, "profile.html"];
      const target = pages[index];
      if (index === 1 && window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("nav_restaurants_tab");
      }
      if (target) {
        window.location.href = target;
      } else {
        showToast("Coming soon!");
      }
    });
  });

  document.querySelectorAll(".card[data-restaurant-id]").forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-restaurant-id") || "taco-cubano";
      if (window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("dashboard_open_restaurant", { source: "restaurant_card", restaurant_id: id });
      }
      window.location.href = `restaurant.html?r=${encodeURIComponent(id)}`;
    });
  });

  document.querySelectorAll(".popular-item[data-restaurant-id]").forEach((item) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-restaurant-id") || "taco-cubano";
      const itemId = item.getAttribute("data-item-id");
      if (window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("dashboard_open_restaurant", { source: "popular_item", restaurant_id: id });
      }
      if (itemId) {
        window.location.href = `foodItem.html?r=${encodeURIComponent(id)}&item=${encodeURIComponent(itemId)}`;
      } else {
        window.location.href = `restaurant.html?r=${encodeURIComponent(id)}`;
      }
    });
  });

  document.querySelectorAll(".section-header span").forEach((link) => {
    link.style.cursor = "pointer";
    link.addEventListener("click", () => {
      window.location.href = "search.html";
    });
  });

  window.toggleHeart = function toggleHeart(el) {
    el.classList.toggle("active");
    const saved = el.classList.contains("active");
    if (window.SwiftBiteAnalytics) {
      window.SwiftBiteAnalytics.track("favorite_toggle", { is_favorite: saved });
    }
    showToast(saved ? "Added to favourites \u2764\ufe0f" : "Removed from favourites");
  };

  document.querySelectorAll(".menu-item").forEach((item) => {
    if (file !== "restaurant.html") return;
    if (document.getElementById("sb-menu-root")) return;
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const itemName = item.querySelector("h4")?.textContent || "";
      if (window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("menu_item_open", { item_name: itemName });
      }
      window.location.href = "foodItem.html";
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add";
    addBtn.type = "button";
    addBtn.className = "add-btn";
    addBtn.style.cssText =
      "margin-top:6px;background:#ff4d2e;color:white;border:none;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = item.querySelector("h4")?.textContent || "Item";
      if (window.SwiftBiteAnalytics) {
        window.SwiftBiteAnalytics.track("menu_quick_add", { item_name: name });
      }
      showToast(`${name} added to cart \ud83d\uded2`);
    });
    item.querySelector("div")?.appendChild(addBtn);
  });

  /* ── ORDER CONFIRMED · TRACKING · ORDER HISTORY ─────────────── */

  function renderOrderConfirmedPage() {
    if (file !== "order-confirmed.html" || !window.SwiftBiteOrders) return;
    const id = qs("id");
    const order = id ? window.SwiftBiteOrders.getOrder(id) : null;
    const title = document.getElementById("oc-title");
    const meta = document.getElementById("oc-meta");
    const addr = document.getElementById("oc-address");
    const totalEl = document.getElementById("oc-total");
    const track = document.getElementById("oc-tracking");
    if (!title) return;
    if (!order) {
      title.textContent = "We couldn't find that order";
      if (meta) meta.textContent = "Open Order history from your profile or start a new basket.";
      if (track) track.style.display = "none";
      return;
    }
    title.textContent = "Order confirmed!";
    if (meta) {
      meta.textContent = `${order.restaurantName} · ETA ~${order.etaMinutes} min · ${order.id}`;
    }
    if (addr) {
      const bits = [order.addressLine, order.flatOrBlock, order.phone].filter(Boolean);
      addr.textContent = bits.join(" · ");
    }
    if (totalEl) totalEl.textContent = formatRs(order.total);
    if (track) {
      track.style.display = "inline-flex";
      track.href = `tracking.html?id=${encodeURIComponent(order.id)}`;
    }
  }

  function renderTrackingPage() {
    if (file !== "tracking.html" || !window.SwiftBiteOrders) return;
    const id = qs("id");
    const order = id ? window.SwiftBiteOrders.getOrder(id) : null;
    const root = document.getElementById("track-root");
    const title = document.getElementById("track-title");
    if (!root || !title) return;
    if (!order) {
      title.textContent = "Order not found";
      root.innerHTML = "<p class=\"sb-screen-sub\">Check Order history or return home.</p>";
      return;
    }
    title.textContent = order.restaurantName;

    if (order.status === "declined") {
      root.innerHTML =
        '<p class="sb-screen-sub">This order was declined by the restaurant. Start a new basket if you still want delivery.</p>';
      const sum = document.getElementById("track-summary");
      if (sum) sum.textContent = `${formatRs(order.total)} · ${order.id} · Declined`;
      return;
    }

    /** @type {Record<string, number>} */
    const phaseByStatus = {
      pending_restaurant: 0,
      preparing: 1,
      ready_for_pickup: 2,
      picked_up: 2,
      delivered: 3,
      placed: 0
    };
    let phase = phaseByStatus[order.status];
    if (typeof phase !== "number") phase = 0;

    const step0Desc =
      order.status === "pending_restaurant" || order.status === "placed"
        ? "Waiting for the restaurant to accept"
        : "Restaurant confirmed your order";

    const step2Desc =
      order.status === "picked_up"
        ? "Rider is heading to your address"
        : order.status === "ready_for_pickup"
          ? "Rider will collect from the restaurant"
          : "Rider will head your way once food is ready";

    const steps = [
      { label: "Order placed", desc: step0Desc },
      { label: "Preparing", desc: "Kitchen is packing your food" },
      { label: "On the way", desc: step2Desc },
      { label: "Delivered", desc: "Enjoy your meal!" }
    ];

    root.innerHTML = steps
      .map((s, i) => {
        let cls = "track-step";
        if (order.status === "delivered") cls += " done";
        else {
          if (i < phase) cls += " done";
          if (i === phase) cls += " active";
        }
        return `<div class="${cls}"><div class="track-dot"></div><div><strong>${escapeHtml(s.label)}</strong><span>${escapeHtml(s.desc)}</span></div></div>`;
      })
      .join("");

    const sum = document.getElementById("track-summary");
    if (sum) {
      sum.textContent = `${formatRs(order.total)} · ${order.id}`;
    }
  }

  function renderOrdersHistoryPage() {
    if (file !== "orders.html" || !window.SwiftBiteOrders) return;
    const root = document.getElementById("orders-list");
    if (!root) return;
    const orders = window.SwiftBiteOrders.listOrders();
    if (!orders.length) {
      root.innerHTML = "<p class=\"orders-empty\">No orders yet. Browse restaurants and place your first delivery.</p>";
      return;
    }
    root.innerHTML = "";
    orders.forEach((o) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "orders-row";
      const when = new Date(o.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(o.restaurantName)}</strong>
          <span>${escapeHtml(when)} · ${escapeHtml(o.id)} · ${escapeHtml(window.SwiftBiteOrders.statusLabel(o.status))}</span>
        </div>
        <div class="orders-row-price">${formatRs(o.total)}</div>
      `;
      row.addEventListener("click", () => {
        window.location.href = `tracking.html?id=${encodeURIComponent(o.id)}`;
      });
      root.appendChild(row);
    });
  }

  renderOrderConfirmedPage();
  renderTrackingPage();
  renderOrdersHistoryPage();

  if (window.SwiftBiteAnalytics && typeof window.SwiftBiteAnalytics.trackPageView === "function") {
    window.SwiftBiteAnalytics.trackPageView();
  }
});


(function () {
  "use strict";

  // =========================================================
  // STATE
  // =========================================================

  var CATEGORIES = [
    "All", "Electronics", "Fashion", "Home",
    "Books", "Sports", "Beauty"
  ];

  var state = {
    products: [],
    cart: JSON.parse(localStorage.getItem("bazaarly_cart") || "{}"),
    activeCat: "All",
    query: "",
    user: JSON.parse(localStorage.getItem("bazaarly_user") || "null"),
    loading: true,
    loadError: null
  };

  var loginGate = document.getElementById("loginGate");
  var storefrontApp = document.getElementById("storefrontApp");
  var productsLoaded = false;
  var sliderStarted = false;

  // =========================================================
  // HELPERS AND AUTHENTICATION
  // =========================================================

  function saveCart() {
    localStorage.setItem("bazaarly_cart", JSON.stringify(state.cart));
  }

  function saveAuth(token, user) {
    if (token) {
      localStorage.setItem("bazaarly_token", token);
    }
    if (user) {
      localStorage.setItem("bazaarly_user", JSON.stringify(user));
      state.user = user;
    }
  }

  function clearAuth() {
    localStorage.removeItem("bazaarly_token");
    localStorage.removeItem("bazaarly_user");
    state.user = null;
  }

  function showLoginPage() {
    if (loginGate) loginGate.hidden = false;
    if (storefrontApp) storefrontApp.hidden = true;
    closeDrawer();
    closeModal();
  }

  function showHomePage() {
    if (loginGate) loginGate.hidden = true;
    if (storefrontApp) storefrontApp.hidden = false;

    renderAccountNav();
    renderCart();

    if (!productsLoaded) {
      productsLoaded = true;
      loadProducts();
    }

    showSlide(0);

    if (!sliderStarted) {
      sliderStarted = true;
      startSlider();
    }
  }

  function logout() {
    if (!confirm("Log out of Bazaarly?")) return;

    clearAuth();
    showLoginPage();
    showToast("Logged out successfully");
  }

  function fmt(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN");
  }

  function starString(rating) {
    var full = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    var s = "";
    for (var i = 0; i < 5; i++) s += i < full ? "★" : "☆";
    return s;
  }

  function discountPct(price, mrp) {
    price = Number(price) || 0;
    mrp = Number(mrp) || 0;
    if (!mrp || mrp <= 0) return 0;
    return Math.max(0, Math.round(((mrp - price) / mrp) * 100));
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  // =========================================================
  // PRODUCT IMAGE MAP
  // =========================================================

  function getProductImage(p) {
    var name = (p.name || "").trim().toLowerCase();

    var imageMap = {
      "smartwatch with heart rate monitor": "images/watch.jpg",
      "65w fast charging power bank 20000mah": "images/power.jpg",
      "mechanical gaming keyboard rgb": "images/key.jpg",
      "men's cotton casual shirt": "images/shirt.jpg",
      "women's ethnic kurti set": "images/kurti.jpg",
      "running shoes, lightweight mesh": "images/shoe.jpg",
      "leather wallet for men": "images/wallet.jpg",
      "non-stick cookware set, 5 piece": "images/non.jpg",
      "led table lamp with usb port": "images/led.jpg",
      "memory foam pillow, set of 2": "images/pillow.jpg",
      "stainless steel water bottle 1l": "images/water.jpg",
      "atomic habits - paperback": "images/atomic.jpg",
      "the alchemist - paperback": "images/the.jpg",
      "data structures & algorithms guide": "images/data.jpg",
      "yoga mat, anti-slip 6mm": "images/mat.jpg",
      "adjustable dumbbell set 10kg": "images/dum.jpg",
      "cricket bat, kashmir willow": "images/bat.jpg",
      "vitamin c face serum": "images/serum.jpg",
      "herbal shampoo, 340ml": "images/herb.jpg"
    };

    if (imageMap[name]) return imageMap[name];
    if (p.image) return p.image;
    return null;
  }

  // =========================================================
  // CATEGORY SELECT + SUBNAV
  // =========================================================

  var catSelect = document.getElementById("catSelect");
  var subnav = document.getElementById("subnav");

  if (catSelect && subnav) {
    CATEGORIES.forEach(function (c) {
      if (c !== "All") {
        var opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        catSelect.appendChild(opt);
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = c;
      btn.dataset.cat = c;
      if (c === "All") btn.classList.add("active");

      btn.addEventListener("click", function () {
        state.activeCat = c;
        Array.prototype.forEach.call(subnav.children, function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        catSelect.value = c;
        loadProducts();
      });

      subnav.appendChild(btn);
    });

    catSelect.addEventListener("change", function () {
      state.activeCat = catSelect.value;
      Array.prototype.forEach.call(subnav.children, function (b) {
        b.classList.toggle("active", b.dataset.cat === catSelect.value);
      });
      loadProducts();
    });
  }

  // =========================================================
  // SEARCH
  // =========================================================

  var searchInput = document.getElementById("searchInput");
  var searchBtn = document.getElementById("searchBtn");

  function runSearch() {
    state.query = searchInput ? searchInput.value.trim() : "";
    loadProducts();
  }

  if (searchBtn) searchBtn.addEventListener("click", runSearch);

  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") runSearch();
    });
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  var grid = document.getElementById("productGrid");
  var resultsBar = document.getElementById("resultsBar");

  function loadProducts() {
    if (!grid) return;

    state.loading = true;
    state.loadError = null;
    renderProducts();

    api.getProducts(state.activeCat, state.query)
      .then(function (data) {
        state.products = Array.isArray(data) ? data :
          (data && Array.isArray(data.results) ? data.results : []);
        state.loading = false;
        renderProducts();
        renderCart();
      })
      .catch(function (err) {
        state.loading = false;
        state.loadError = err.message || "Unable to load products.";
        renderProducts();
      });
  }

  function renderProducts() {
    if (!grid) return;

    if (state.loading) {
      grid.innerHTML = '<div class="loading">Loading products…</div>';
      if (resultsBar) resultsBar.textContent = "";
      return;
    }

    if (state.loadError) {
      grid.innerHTML =
        '<div class="no-results">' +
        "Could not reach the backend.<br>" +
        "Make sure Django is running on localhost:8000.<br><br>" +
        '<span style="color:var(--price)">' +
        escapeHTML(state.loadError) + "</span></div>";
      if (resultsBar) resultsBar.textContent = "";
      return;
    }

    var list = state.products || [];

    if (resultsBar) {
      resultsBar.textContent =
        list.length + " results" +
        (state.query ? ' for "' + state.query + '"' : "") +
        (state.activeCat !== "All" ? " in " + state.activeCat : "");
    }

    grid.innerHTML = "";

    if (!list.length) {
      grid.innerHTML =
        '<div class="no-results">No products found. Try a different search or category.</div>';
      return;
    }

    list.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "card";

      var disc = discountPct(p.price, p.mrp);
      var inCart = !!state.cart[p.id];
      var productImage = getProductImage(p);
      var imageHTML = productImage
        ? '<img src="' + escapeHTML(productImage) + '" alt="' +
          escapeHTML(p.name || "Product") + '" loading="lazy" ' +
          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\';">' +
          '<span style="display:none;">' + escapeHTML(p.emoji || "🛍️") + "</span>"
        : "<span>" + escapeHTML(p.emoji || "🛍️") + "</span>";

      card.innerHTML =
        '<div class="card-img">' + imageHTML + "</div>" +
        '<div class="card-cat">' + escapeHTML(p.category || "") + "</div>" +
        '<div class="card-title">' + escapeHTML(p.name || "Product") + "</div>" +
        '<div class="rating"><span class="stars">' + starString(p.rating) +
        '</span><span>' + escapeHTML(p.rating || 0) + " (" +
        Number(p.reviews || 0).toLocaleString("en-IN") + ")</span></div>" +
        '<div class="price-row"><span class="price">' + fmt(p.price) +
        '</span><span class="price-mrp">' + fmt(p.mrp) +
        '</span><span class="discount">' + disc + "% off</span></div>" +
        '<div class="prime">FREE delivery ' +
        (Number(p.price) > 499 ? "tomorrow" : "in 3 days") + "</div>" +
        '<button type="button" class="add-btn' + (inCart ? " added" : "") +
        '" data-id="' + escapeHTML(p.id) + '">' +
        (inCart ? "✓ Added — " + state.cart[p.id] + " in cart" : "Add to cart") +
        "</button>";

      grid.appendChild(card);
    });

    Array.prototype.forEach.call(grid.querySelectorAll(".add-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        state.cart[id] = (Number(state.cart[id]) || 0) + 1;
        saveCart();
        renderProducts();
        renderCart();
        showToast("Added to cart");
      });
    });
  }

  // =========================================================
  // CART
  // =========================================================

  var overlay = document.getElementById("overlay");
  var drawer = document.getElementById("cartDrawer");
  var cartBody = document.getElementById("cartBody");
  var cartFoot = document.getElementById("cartFoot");
  var cartCount = document.getElementById("cartCount");
  var subtotalVal = document.getElementById("subtotalVal");

  function cartItems() {
    return Object.keys(state.cart).map(function (id) {
      var p = state.products.filter(function (x) {
        return String(x.id) === String(id);
      })[0];

      return p ? { product: p, qty: Number(state.cart[id]) || 0 } : null;
    }).filter(Boolean);
  }

  function renderCart() {
    if (!cartBody) return;

    var items = cartItems();
    var totalQty = Object.keys(state.cart).reduce(function (sum, id) {
      return sum + (Number(state.cart[id]) || 0);
    }, 0);

    if (cartCount) cartCount.textContent = totalQty;

    if (Object.keys(state.cart).length === 0) {
      cartBody.innerHTML =
        '<div class="cart-empty">Your cart is empty.<br>Browse products and add something you like.</div>';
      if (cartFoot) cartFoot.style.display = "none";
      if (subtotalVal) subtotalVal.textContent = fmt(0);
      return;
    }

    if (cartFoot) cartFoot.style.display = "block";
    cartBody.innerHTML = "";

    var subtotal = 0;

    items.forEach(function (item) {
      subtotal += Number(item.product.price) * item.qty;

      var row = document.createElement("div");
      row.className = "cart-row";

      var cartImage = getProductImage(item.product);
      var cartImageHTML = cartImage
        ? '<img src="' + escapeHTML(cartImage) + '" alt="' +
          escapeHTML(item.product.name) + '" loading="lazy" ' +
          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\';">' +
          '<span style="display:none;">' + escapeHTML(item.product.emoji || "🛍️") + "</span>"
        : "<span>" + escapeHTML(item.product.emoji || "🛍️") + "</span>";

      row.innerHTML =
        '<div class="cart-img">' + cartImageHTML + "</div>" +
        '<div class="cart-info"><div class="name">' +
        escapeHTML(item.product.name) + '</div><div class="qty-row">' +
        '<button type="button" class="qty-btn" data-act="dec" data-id="' +
        escapeHTML(item.product.id) + '">−</button><span>' + item.qty +
        '</span><button type="button" class="qty-btn" data-act="inc" data-id="' +
        escapeHTML(item.product.id) + '">+</button>' +
        '<button type="button" class="remove-btn" data-act="remove" data-id="' +
        escapeHTML(item.product.id) + '">Remove</button></div></div>' +
        '<div class="row-price">' + fmt(Number(item.product.price) * item.qty) + "</div>";

      cartBody.appendChild(row);
    });

    if (subtotalVal) subtotalVal.textContent = fmt(subtotal);

    Array.prototype.forEach.call(cartBody.querySelectorAll("[data-act]"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        var act = btn.dataset.act;

        if (act === "inc") {
          state.cart[id] = (Number(state.cart[id]) || 0) + 1;
        } else if (act === "dec") {
          state.cart[id] = (Number(state.cart[id]) || 0) - 1;
          if (state.cart[id] <= 0) delete state.cart[id];
        } else if (act === "remove") {
          delete state.cart[id];
        }

        saveCart();
        renderCart();
        renderProducts();
      });
    });
  }

  function openDrawer() {
    if (overlay) overlay.classList.add("open");
    if (drawer) drawer.classList.add("open");
  }

  function closeDrawer() {
    if (overlay) overlay.classList.remove("open");
    if (drawer) drawer.classList.remove("open");
  }

  var cartOpenBtn = document.getElementById("cartOpenBtn");
  var drawerClose = document.getElementById("drawerClose");

  if (cartOpenBtn) cartOpenBtn.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);

  // =========================================================
  // MODAL
  // =========================================================

  var modalWrap = document.getElementById("checkoutModalWrap");
  var modal = document.getElementById("checkoutModal");

  function closeModal() {
    if (modalWrap) modalWrap.classList.remove("open");
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  if (modalWrap) {
    modalWrap.addEventListener("click", function (e) {
      if (e.target === modalWrap) closeModal();
    });
  }

  // =========================================================
  // ACCOUNT NAVIGATION
  // =========================================================

  function renderAccountNav() {
    var el = document.getElementById("accountNav");
    if (!el) return;

    if (state.user) {
      var firstName = state.user.name ? state.user.name.split(" ")[0] : "User";
      el.innerHTML = "Hello, " + escapeHTML(firstName) + "<b>Account</b>";
      el.onclick = logout;
    } else {
      el.innerHTML = "Hello, sign in<b>Account &amp; Lists</b>";
      el.onclick = function () {
        openAuthModal("login");
      };
    }
  }

  // =========================================================
  // LOGIN / REGISTER MODAL FOR EXISTING ACCOUNT LINK
  // =========================================================

  function openAuthModal(mode) {
    mode = mode || "login";
    var isLogin = mode === "login";

    if (!modal || !modalWrap) return;

    modal.innerHTML =
      "<h2>" + (isLogin ? "Sign in" : "Create account") + "</h2>" +
      (isLogin ? "" :
        '<label for="authName">Full name</label>' +
        '<input id="authName" type="text" placeholder="Your name" autocomplete="name">') +
      '<label for="authEmail">Email</label>' +
      '<input id="authEmail" type="email" placeholder="you@example.com" autocomplete="email">' +
      '<label for="authPass">Password</label>' +
      '<input id="authPass" type="password" placeholder="At least 6 characters" autocomplete="' +
      (isLogin ? "current-password" : "new-password") + '">' +
      '<div class="field-error" id="authError"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn-secondary" id="authCancel">Cancel</button>' +
      '<button type="button" class="btn-primary" id="authSubmit">' +
      (isLogin ? "Sign in" : "Create account") + "</button></div>" +
      '<div class="auth-toggle">' +
      (isLogin
        ? 'New here? <a href="#" id="authSwitch">Create an account</a>'
        : 'Already have an account? <a href="#" id="authSwitch">Sign in</a>') +
      "</div>";

    modalWrap.classList.add("open");

    var nameInput = document.getElementById("authName");
    var emailInput = document.getElementById("authEmail");
    var passInput = document.getElementById("authPass");
    var errorEl = document.getElementById("authError");
    var submitBtn = document.getElementById("authSubmit");

    document.getElementById("authCancel").addEventListener("click", closeModal);

    document.getElementById("authSwitch").addEventListener("click", function (e) {
      e.preventDefault();
      openAuthModal(isLogin ? "register" : "login");
    });

    submitBtn.addEventListener("click", function () {
      var email = emailInput.value.trim();
      var pass = passInput.value;
      var name = nameInput ? nameInput.value.trim() : "";

      if (!email || !emailInput.checkValidity()) {
        errorEl.textContent = "Please enter a valid email address.";
        errorEl.style.display = "block";
        emailInput.focus();
        return;
      }

      if (!pass || pass.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        errorEl.style.display = "block";
        passInput.focus();
        return;
      }

      if (!isLogin && !name) {
        errorEl.textContent = "Please enter your name.";
        errorEl.style.display = "block";
        nameInput.focus();
        return;
      }

      errorEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = isLogin ? "Signing in…" : "Creating account…";

      var request = isLogin
        ? api.login(email, pass)
        : api.register(name, email, pass);

      request.then(function (data) {
        // Some register endpoints return a token immediately.
        // If not, sign in after registration.
        if (data && data.token && data.user) {
          saveAuth(data.token, data.user);
          closeModal();
          showHomePage();
          showToast(isLogin ? "Signed in" : "Account created");
          return;
        }

        if (!isLogin) {
          return api.login(email, pass).then(function (loginData) {
            if (!loginData || !loginData.token || !loginData.user) {
              throw new Error("Account created. Please sign in.");
            }
            saveAuth(loginData.token, loginData.user);
            closeModal();
            showHomePage();
            showToast("Account created");
          });
        }

        throw new Error("Login response did not contain a token and user.");
      }).catch(function (err) {
        errorEl.textContent = err.message || "Authentication failed.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? "Sign in" : "Create account";
      });
    });

    setTimeout(function () {
      if (nameInput) nameInput.focus();
      else emailInput.focus();
    }, 50);
  }

  // =========================================================
  // FIRST SCREEN LOGIN FORM
  // =========================================================

  var initialLoginForm = document.getElementById("initialLoginForm");
  var initialRegisterLink = document.getElementById("initialRegisterLink");
  var loginError = document.getElementById("loginError");
  var initialLoginBtn = document.getElementById("initialLoginBtn");

  if (initialLoginForm) {
    initialLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var emailInput = document.getElementById("loginEmail");
      var passwordInput = document.getElementById("loginPassword");

      var email = emailInput ? emailInput.value.trim() : "";
      var password = passwordInput ? passwordInput.value : "";

      if (loginError) {
        loginError.textContent = "";
        loginError.style.display = "none";
      }

      if (!email || !password) {
        if (loginError) {
          loginError.textContent = "Enter your email and password.";
          loginError.style.display = "block";
        }
        return;
      }

      if (initialLoginBtn) {
        initialLoginBtn.disabled = true;
        initialLoginBtn.textContent = "Signing in…";
      }

      api.login(email, password)
        .then(function (data) {
          if (!data || !data.token || !data.user) {
            throw new Error("Login response is missing token or user information.");
          }

          saveAuth(data.token, data.user);
          showHomePage();
          showToast("Welcome to Bazaarly!");
        })
        .catch(function (err) {
          if (loginError) {
            loginError.textContent = err.message || "Login failed. Check your details.";
            loginError.style.display = "block";
          }
        })
        .finally(function () {
          if (initialLoginBtn) {
            initialLoginBtn.disabled = false;
            initialLoginBtn.textContent = "Login";
          }
        });
    });
  }

  if (initialRegisterLink) {
    initialRegisterLink.addEventListener("click", function (e) {
      e.preventDefault();
      openAuthModal("register");
    });
  }

  // =========================================================
  // CHECKOUT
  // =========================================================

  function openCheckoutModal() {
    if (!state.user) {
      showToast("Please sign in first");
      showLoginPage();
      return;
    }

    var items = cartItems();

    if (!items.length) {
      showToast("Your cart is empty");
      return;
    }

    var subtotal = items.reduce(function (sum, i) {
      return sum + Number(i.product.price) * i.qty;
    }, 0);

    var delivery = subtotal >= 499 ? 0 : 49;
    var total = subtotal + delivery;

    modal.innerHTML =
      "<h2>Checkout</h2>" +
      items.map(function (i) {
        return '<div class="order-summary-line"><span>' +
          escapeHTML(i.product.name) + " × " + i.qty +
          "</span><span>" + fmt(Number(i.product.price) * i.qty) + "</span></div>";
      }).join("") +
      '<div class="order-summary-line"><span>Delivery</span><span>' +
      (delivery === 0 ? "FREE" : fmt(delivery)) + "</span></div>" +
      '<div class="order-summary-line" style="font-weight:700;color:var(--text);font-size:15px;border-top:1px solid var(--border);padding-top:8px;margin-top:6px;">' +
      "<span>Total</span><span>" + fmt(total) + "</span></div>" +
      '<label for="ckAddr">Delivery address</label>' +
      '<input id="ckAddr" type="text" placeholder="House no, street, city, pincode">' +
      '<div class="field-error" id="errAddr">Enter a delivery address</div>' +
      '<div class="modal-actions"><button type="button" class="btn-secondary" id="ckCancel">Cancel</button>' +
      '<button type="button" class="btn-primary" id="ckPlace">Place order</button></div>';

    modalWrap.classList.add("open");

    document.getElementById("ckCancel").addEventListener("click", closeModal);

    document.getElementById("ckAddr").addEventListener("input", function () {
      document.getElementById("errAddr").style.display = "none";
    });

    document.getElementById("ckPlace").addEventListener("click", function () {
      var addr = document.getElementById("ckAddr").value.trim();
      var errAddr = document.getElementById("errAddr");

      if (!addr) {
        errAddr.textContent = "Enter a delivery address";
        errAddr.style.display = "block";
        return;
      }

      var payload = items.map(function (i) {
        return { product_id: i.product.id, qty: i.qty };
      });

      var placeBtn = document.getElementById("ckPlace");
      placeBtn.disabled = true;
      placeBtn.textContent = "Placing order…";

      api.placeOrder(payload, addr)
        .then(function (data) {
          modal.innerHTML =
            '<div class="success-icon">✓</div>' +
            '<h2 style="text-align:center;">Order placed!</h2>' +
            '<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:6px;">Thanks for shopping with bazaarly.in</p>' +
            '<div class="order-id">Order ID: <b>' + escapeHTML(data.order_id) +
            "</b><br>Total: <b>" + fmt(data.total) + "</b></div>" +
            '<div class="modal-actions"><button type="button" class="btn-primary" id="ckDone" style="flex:1;">Continue shopping</button></div>';

          document.getElementById("ckDone").addEventListener("click", function () {
            state.cart = {};
            saveCart();
            renderCart();
            renderProducts();
            closeModal();
            closeDrawer();
          });
        })
        .catch(function (err) {
          errAddr.textContent = err.message || "Could not place order.";
          errAddr.style.display = "block";
          placeBtn.disabled = false;
          placeBtn.textContent = "Place order";
        });
    });
  }

  var checkoutBtn = document.getElementById("checkoutBtn");

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (Object.keys(state.cart).length === 0) return;
      openCheckoutModal();
    });
  }

  // =========================================================
  // TOAST
  // =========================================================

  var toast = document.getElementById("toast");
  var toastTimer;

  function showToast(msg) {
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2000);
  }

  // =========================================================
  // HERO SLIDER
  // =========================================================

  var heroSlides = document.querySelectorAll(".hero-slide");
  var heroDots = document.querySelectorAll(".dot");
  var nextBtn = document.getElementById("nextSlide");
  var prevBtn = document.getElementById("prevSlide");

  var currentSlide = 0;
  var sliderTimer = null;

  function showSlide(index) {
    if (!heroSlides.length) return;

    if (index >= heroSlides.length) index = 0;
    if (index < 0) index = heroSlides.length - 1;

    currentSlide = index;

    Array.prototype.forEach.call(heroSlides, function (slide, i) {
      slide.classList.toggle("active", i === currentSlide);
    });

    Array.prototype.forEach.call(heroDots, function (dot, i) {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startSlider() {
    clearInterval(sliderTimer);
    if (!heroSlides.length) return;

    sliderTimer = setInterval(function () {
      nextSlide();
    }, 4000);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      nextSlide();
      startSlider();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      prevSlide();
      startSlider();
    });
  }

  Array.prototype.forEach.call(heroDots, function (dot, index) {
    dot.addEventListener("click", function () {
      showSlide(index);
      startSlider();
    });
  });

  // =========================================================
  // SHOP NOW BUTTONS
  // =========================================================

  Array.prototype.forEach.call(document.querySelectorAll(".shop-now"), function (button) {
    button.addEventListener("click", function () {
      var category = button.dataset.category || "All";

      state.activeCat = category;
      state.query = "";

      if (searchInput) searchInput.value = "";
      if (catSelect) catSelect.value = category;

      if (subnav) {
        Array.prototype.forEach.call(subnav.children, function (b) {
          b.classList.toggle("active", b.dataset.cat === category);
        });
      }

      loadProducts();

      var mainSection = document.querySelector("main");
      if (mainSection) {
        window.scrollTo({
          top: mainSection.offsetTop,
          behavior: "smooth"
        });
      }
    });
  });

  // =========================================================
  // INITIALIZE: LOGIN FIRST
  // =========================================================

  renderAccountNav();

  var savedToken = localStorage.getItem("bazaarly_token");
  var savedUser = localStorage.getItem("bazaarly_user");

  if (savedToken && savedUser && state.user) {
    // Reopen the storefront when a previous login is saved.
    showHomePage();
  } else {
    clearAuth();
    showLoginPage();
  }

})();

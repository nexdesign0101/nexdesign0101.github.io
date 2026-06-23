// ==========================================
// CART — persisted in localStorage
// ==========================================
let cart = JSON.parse(localStorage.getItem("clickdash_cart")) || [];

const saveCart = () =>
  localStorage.setItem("clickdash_cart", JSON.stringify(cart));

// ==========================================
// DARK MODE
// ==========================================
const darkToggle = document.getElementById("dark-mode-toggle");

if (localStorage.getItem("clickdash_theme") === "dark") {
  document.body.classList.add("dark-mode");
  if (darkToggle) darkToggle.textContent = "☀️";
}

darkToggle?.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("clickdash_theme", isDark ? "dark" : "light");
});

// ==========================================
// MOBILE MENU && HUMBURGER TOGGLE
// ==========================================
const menuIcon = document.getElementById("menu-icon");
const menuCon  = document.getElementById("menu-con");

if (menuIcon && menuCon) {
  menuIcon.addEventListener("click", () => menuCon.classList.toggle("active"));
  menuCon.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => menuCon.classList.remove("active"))
  );
}

// ==========================================
// ADD TO CART (works on any product page)
// ==========================================
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("add-to-cart")) return;

  const card  = e.target.closest(".product-card");
  const title = card.querySelector("h3").innerText;
  const price = parseFloat(
    card.querySelector(".price").innerText.replace(/[$,]/g, "")
  );
  const imgSrc = card.querySelector("img").getAttribute("src");

  const existing = cart.find((i) => i.title === title);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ title, price, imgSrc, quantity: 1 });
  }

  saveCart();
  alert(`${title} has been added to your cart!`);
});

// ==========================================
// SEARCH BAR — redirect to search.html
// ==========================================
document.querySelector(".search-container")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = e.currentTarget.querySelector(".search-input").value.trim();
  if (query) window.location.href = `search.html?q=${encodeURIComponent(query)}`;
});

// ==========================================
// PRODUCT DATABASE
// ==========================================
const clickdashDB = [
  { title: "Ergonomic Mesh Chair",       price: 185.00, category: "Office",       image: "images/office.jpg" },
  { title: "Premium Leather Journal",    price:  28.00, category: "Office",       image: "images/office.jpg" },
  { title: "ClickDash Pro Phone",        price: 799.00, category: "Electronics",  image: "images/electronics.jpg" },
  { title: "Noise-Canceling Headphones", price: 199.00, category: "Electronics",  image: "images/electronics.jpg" },
  { title: "Classic Denim Jacket",       price:  59.99, category: "Fashion",      image: "images/fashion.png" },
  { title: "Pro-Run Sneakers",           price:  89.00, category: "Fashion",      image: "images/fashion.png" },
  { title: "Essential Cotton Tee",       price:  19.50, category: "Fashion",      image: "images/fashion.png" },
  { title: "Luxury Leather Tote",        price: 120.00, category: "Fashion",      image: "images/fashion.png" },
  { title: "Ceramic Planter Set",        price:  34.99, category: "Home",         image: "images/home-garden.jpg" },
  { title: "Smart Robot Vacuum",         price: 249.00, category: "Home",         image: "images/home-garden.jpg" },
  { title: "Woven Patio Chair",          price:  85.00, category: "Home",         image: "images/home-garden.jpg" },
  { title: "Smart LED Bulb (4-Pack)",    price:  29.99, category: "Home",         image: "images/home-garden.jpg" },
  { title: "Premium Non-Slip Yoga Mat",  price:  45.00, category: "Sports",       image: "images/sports.jpg" },
  { title: "Adjustable Dumbbell Set",    price: 120.00, category: "Sports",       image: "images/sports.jpg" },
  { title: "Classic Building Blocks",    price:  25.00, category: "Toys",         image: "images/toys.jpg" },
  { title: "Remote Control Race Car",    price:  45.00, category: "Toys",         image: "images/toys.jpg" },
];

// ==========================================
// SEARCH & FILTER PAGE
// ==========================================
const searchGrid = document.getElementById("search-results-grid");

if (searchGrid) {
  const searchTitle = document.getElementById("search-title");
  const query = new URLSearchParams(window.location.search).get("q");

  const renderProducts = (products) => {
    searchGrid.innerHTML = products.length
      ? products.map((p) => `
          <div class="product-card">
            <div class="img-container">
              <img src="${p.image}" alt="${p.title}" />
            </div>
            <div class="product-info">
              <h3>${p.title}</h3>
              <p class="price">$${p.price.toFixed(2)}</p>
              <button class="add-to-cart">Add to Cart</button>
            </div>
          </div>`).join("")
      : "<p style='grid-column:1/-1;text-align:center;font-size:1.2rem;'>No products found.</p>";
  };

  if (query) {
    const q = query.toLowerCase();
    searchTitle.innerText = `Results for "${query}"`;
    renderProducts(
      clickdashDB.filter(
        (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
    );
  } else {
    searchTitle.innerText = "All Products";
    renderProducts(clickdashDB);
  }

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filter = e.target.getAttribute("data-filter");
      searchTitle.innerText = filter === "all" ? "All Products" : `${filter} Products`;
      renderProducts(
        filter === "all" ? clickdashDB : clickdashDB.filter((p) => p.category === filter)
      );
    });
  });
}

// ==========================================
// CART PAGE
// ==========================================
const cartContainer = document.getElementById("cart-container");

if (cartContainer) {
  const SHIPPING = 5.0;
  const PROMOS = {
    SAVE10:   { type: "percent",  value: 0.1 },
    MINUS5:   { type: "fixed",    value: 5.0 },
    FREESHIP: { type: "shipping", value: 0   },
  };

  let currentPromo = JSON.parse(localStorage.getItem("clickdash_promo")) || null;

  // Cache DOM refs used in every render
  const subtotalEl    = document.getElementById("subtotal-amount");
  const grandTotalEl  = document.getElementById("grand-total");
  const discountRow   = document.getElementById("discount-row");
  const shippingRow   = document.getElementById("shipping-row");
  const shippingAmtEl = document.querySelector("#shipping-row span:nth-child(2)");
  const discountAmtEl = document.getElementById("discount-amount");
  const promoNameEl   = document.getElementById("applied-promo-name");
  const promoMsgEl    = document.getElementById("promo-message");

  function renderCart() {
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
      cartContainer.innerHTML =
        "<p style='color:#666;font-size:1.2rem;'>Your cart is currently empty.</p>";
      if (subtotalEl)   subtotalEl.textContent  = "$0.00";
      if (grandTotalEl) grandTotalEl.textContent = "$0.00";
      shippingRow.style.display = "none";
      discountRow.style.display = "none";
      return;
    }

    // Render items & tally subtotal
    let subtotal = 0;
    cart.forEach((item, i) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      cartContainer.insertAdjacentHTML("beforeend", `
        <div class="cart-item" data-index="${i}">
          <div class="item-details">
            <img src="${item.imgSrc}" alt="${item.title}"/>
            <div class="item-info">
              <h3>${item.title}</h3>
              <p class="price">$${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="item-actions">
            <div class="quantity-control">
              <input type="number" value="${item.quantity}" min="1" class="qty-input">
            </div>
            <div class="item-total">$${lineTotal.toFixed(2)}</div>
            <button class="del-button">Remove</button>
          </div>
        </div>`);
    });

    // Apply promo
    let discount = 0;
    let shipping = SHIPPING;
    shippingRow.style.display = "flex";

    const promo = currentPromo && PROMOS[currentPromo];
    if (promo) {
      if (promo.type === "percent")  discount = Math.min(subtotal * promo.value, subtotal);
      if (promo.type === "fixed")    discount = Math.min(promo.value, subtotal);
      if (promo.type === "shipping") shipping = 0;
    }

    // Update totals
    if (subtotalEl) subtotalEl.textContent = "$" + subtotal.toFixed(2);

    if (promo) {
      promoMsgEl.style.cssText = "display:block;color:#28a745;";
      promoMsgEl.textContent   = `Promo '${currentPromo}' applied!`;

      if (promo.type === "shipping") {
        discountRow.style.display = "none";
        shippingAmtEl.textContent = "FREE";
      } else {
        discountRow.style.display = "flex";
        promoNameEl.textContent   = currentPromo;
        discountAmtEl.textContent = "-$" + discount.toFixed(2);
        shippingAmtEl.textContent = "$"  + shipping.toFixed(2);
      }
    } else {
      discountRow.style.display = "none";
      shippingAmtEl.textContent = "$" + SHIPPING.toFixed(2);
    }

    if (grandTotalEl)
      grandTotalEl.textContent = "$" + (subtotal - discount + shipping).toFixed(2);
  }

  renderCart();

  // Promo code
  document.getElementById("apply-promo-btn")?.addEventListener("click", () => {
    const promoInput = document.getElementById("promo-input");
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
      currentPromo = null;
      localStorage.removeItem("clickdash_promo");
      promoMsgEl.style.display = "none";
    } else if (PROMOS[code]) {
      currentPromo = code;
      localStorage.setItem("clickdash_promo", JSON.stringify(code));
    } else {
      promoMsgEl.style.cssText = "display:block;color:#ff4d4d;";
      promoMsgEl.textContent   = "Invalid promo code.";
      return;
    }

    renderCart();
  });

  // Quantity change
  cartContainer.addEventListener("input", (e) => {
    if (!e.target.classList.contains("qty-input")) return;
    const idx = e.target.closest(".cart-item").getAttribute("data-index");
    cart[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
    saveCart();
    renderCart();
  });

  // Remove item
  cartContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("del-button")) return;
    const itemDiv = e.target.closest(".cart-item");
    itemDiv.classList.add("removing");
    setTimeout(() => {
      cart.splice(itemDiv.getAttribute("data-index"), 1);
      saveCart();
      renderCart();
    }, 300);
  });
}

// ==========================================
// TRACKING PAGE
// ==========================================
const orderIdEl = document.getElementById("order-id");

if (orderIdEl) {
  orderIdEl.innerText = `#CD-${Math.floor(100000 + Math.random() * 900000)}`;

  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 3);

  const arrivalEl = document.getElementById("arrival-date");
  if (arrivalEl)
    arrivalEl.innerText = delivery.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

  localStorage.removeItem("clickdash_cart");
  cart = [];
}

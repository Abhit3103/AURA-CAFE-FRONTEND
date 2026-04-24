const API = "https://aura-cafe-full-stack-webapp-production.up.railway.app/api";


// App State
let menuItems = [];

// App State
let cart = [];
let orders = [];

// DOM Elements
const elements = {
    loader: document.getElementById('loader'),
    navbar: document.getElementById('navbar'),
    menuContainer: document.getElementById('menuContainer'),
    cartBtn: document.getElementById('cartBtn'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartOverlay: document.getElementById('cartOverlay'),
    closeCart: document.getElementById('closeCart'),
    cartBadge: document.getElementById('cartBadge'),
    cartContent: document.getElementById('cartContent'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartFooter: document.getElementById('cartFooter'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
    orderType: document.getElementById('orderType'),
    dynamicFieldLabel: document.getElementById('dynamicFieldLabel'),
    dynamicFieldInput: document.getElementById('dynamicFieldInput'),
    
    // View Switcher
    mainView: document.getElementById('mainView'),
    adminView: document.getElementById('adminView'),
    hero: document.getElementById('hero'),

    // Admin Stats
    adminTotalSales: document.getElementById('adminTotalSales'),
    adminTotalOrdersCount: document.getElementById('adminTotalOrdersCount'),
    adminOrdersTable: document.getElementById('adminOrdersTable')
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await initMenu();
    initScrollReveal();
    
    // Auth UI Update
    const token = localStorage.getItem('jwtToken');
    const userName = localStorage.getItem('userName');
    const authNavLink = document.getElementById('authNavLink');
    if (authNavLink) {
        if (token && userName) {
            authNavLink.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="user" class="w-4 h-4"></i> ${userName.split(' ')[0]} (Logout)</span>`;
            authNavLink.href = "#";
            authNavLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userPhone');
                window.location.reload();
            });
        }
    }
    
    // Artificial 1-second loading screen for premium feel
    setTimeout(() => {
        elements.loader.style.opacity = '0';
        setTimeout(() => {
            elements.loader.style.display = 'none';
        }, 700);
    }, 1000);

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            elements.navbar.classList.add('bg-white/90', 'backdrop-blur-lg', 'shadow-sm', 'py-3');
            elements.navbar.classList.remove('py-4');
        } else {
            elements.navbar.classList.remove('bg-white/90', 'backdrop-blur-lg', 'shadow-sm', 'py-3');
            elements.navbar.classList.add('py-4');
        }
    });

    // Cart Events
    elements.cartBtn.addEventListener('click', toggleCart);
    elements.closeCart.addEventListener('click', toggleCart);
    elements.cartOverlay.addEventListener('click', toggleCart);
    elements.checkoutBtn.addEventListener('click', processCheckout);

    // Order Type Change Event
    if (elements.orderType) {
        elements.orderType.addEventListener('change', (e) => {
            if (e.target.value === 'cod') {
                elements.dynamicFieldLabel.textContent = 'Delivery Address';
                elements.dynamicFieldInput.placeholder = 'Enter full address';
            } else {
                elements.dynamicFieldLabel.textContent = 'Seat Number';
                elements.dynamicFieldInput.placeholder = 'Enter table/seat number';
            }
        });
    }
});

// Render Menu
async function initMenu() {
    try {
        const url = `${API}/menu`;
        console.log("API Call:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fallback to mock data");
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Empty menu, using fallback");
        menuItems = data;
    } catch(err) {
        console.warn("Using fallback Indian Cafe menu:", err);
        menuItems = [
            {
                id: 1,
                name: "Authentic Masala Chai",
                price: 150,
                description: "Traditional Indian spiced tea brewed with fresh ginger, crushed cardamom, and milk.",
                image: "images/masala_chai.jpg"
            },
            {
                id: 2,
                name: "Samosa Chaat",
                price: 250,
                description: "Crispy samosas crushed and topped with sweetened yogurt, tangy tamarind, and mint chutneys.",
                image: "images/samosa_chaat.jpg"
            },
            {
                id: 3,
                name: "Mango Lassi",
                price: 180,
                description: "A velvety smooth, sweet yogurt drink blended with premium Alphonso mango pulp.",
                image: "images/mango_lassi.jpg"
            },
            {
                id: 4,
                name: "Paneer Tikka Croissant",
                price: 220,
                description: "A lovely fusion of a buttery French croissant stuffed with spicy, smoky paneer tikka.",
                image: "images/paneer_tikka_croissant.jpg"
            },
            {
                id: 5,
                name: "Madras Filter Coffee",
                price: 120,
                description: "Rich and frothy South Indian coffee brewed with chicory for that authentic strong taste.",
                image: "images/madras_coffee.jpg"
            },
            {
                id: 6,
                name: "Bombay Vada Pav",
                price: 150,
                description: "The classic Mumbai street food: a spicy potato dumpling in a soft toasted bun with garlic chutney.",
                image: "images/vada_pav.jpg"
            }
        ];
    }

    elements.menuContainer.innerHTML = menuItems.map((item, index) => `
        <div class="glass-card rounded-2xl overflow-hidden group reveal-on-scroll" style="transition-delay: ${index * 100}ms">
            <div class="menu-img-wrapper">
                <img src="${item.image}" alt="${item.name}"
                     onload="this.classList.add('loaded'); this.parentElement.classList.add('img-ready');"
                     onerror="this.style.display='none'; this.parentElement.classList.add('img-ready');">
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-serif text-xl text-cafe-800">${item.name}</h3>
                    <span class="font-medium text-cafe-900">₹${item.price.toFixed(2)}</span>
                </div>
                <p class="text-cafe-900/60 text-sm mb-6 line-clamp-2">${item.description}</p>
                <button onclick="addToCart(${item.id})" class="w-full py-3 rounded-full border border-cafe-200 text-cafe-800 font-medium tracking-wide text-sm uppercase hover:bg-cafe-800 hover:text-white transition-all duration-300">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Scroll Reveal
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}

// Cart Logic
function toggleCart() {
    const isClosed = elements.cartSidebar.classList.contains('translate-x-full');
    if (isClosed) {
        elements.cartSidebar.classList.remove('translate-x-full');
        elements.cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
        updateCartUI();
    } else {
        elements.cartSidebar.classList.add('translate-x-full');
        elements.cartOverlay.classList.add('opacity-0', 'pointer-events-none');
    }
}

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    updateCartBadge();
    showToast(`${item.name} added to cart`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    updateCartBadge();
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
        updateCartBadge();
    }
}

function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartBadge.textContent = count;
    
    if (count > 0) {
        elements.cartBadge.classList.remove('opacity-0', 'scale-0');
    } else {
        elements.cartBadge.classList.add('opacity-0', 'scale-0');
    }
}

function updateCartUI() {
    const emptyState = document.querySelector('.empty-cart-state');
    
    if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        elements.cartItemsContainer.classList.add('hidden');
        elements.cartFooter.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        elements.cartItemsContainer.classList.remove('hidden');
        elements.cartFooter.classList.remove('hidden');
        
        elements.cartItemsContainer.innerHTML = cart.map(item => `
            <div class="flex gap-4 items-center bg-white/40 p-3 rounded-xl">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium text-sm text-cafe-800">${item.name}</h4>
                    <span class="text-cafe-900/60 text-sm">₹${item.price.toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-2 border border-cafe-200 rounded-full py-1 px-2 bg-white/50">
                    <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center hover:text-cafe-400 transition-colors">
                        <i data-lucide="minus" class="w-3 h-3"></i>
                    </button>
                    <span class="text-sm w-4 text-center font-medium">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center hover:text-cafe-400 transition-colors">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Add 10% tax for realism
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    elements.cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    elements.cartTotal.textContent = `₹${total.toFixed(2)}`;
}

async function processCheckout() {
    if (cart.length === 0) return;

    // Check if user is theoretically logged in
    const token = localStorage.getItem('jwtToken');
    // Not blocking checkout on token since it's a mock frontend mostly, but if we wanted to:
    // if (!token) { showToast("Please log in first"); return; }
    
    // User info
    const name = localStorage.getItem('userName') || "Guest";
    const email = localStorage.getItem('userEmail') || "guest@example.com";
    const phone = localStorage.getItem('userPhone') || "No phone";

    // Order Details
    const order_type = elements.orderType ? elements.orderType.value : "Unknown";
    const address_or_seat = elements.dynamicFieldInput ? elements.dynamicFieldInput.value.trim() : "";
    
    if (elements.dynamicFieldInput && !address_or_seat) {
        showToast(order_type === 'cod' ? 'Please enter your delivery address' : 'Please enter your seat number');
        return;
    }

    elements.checkoutBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...`;
    lucide.createIcons();

    try {
        const placeOrderPayload = cart.map(item => ({ item_id: item.id, quantity: item.quantity }));
        
        const payload = { 
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            order_type: order_type,
            address: order_type === 'cod' ? address_or_seat : null,
            seat_number: order_type === 'dine-in' ? address_or_seat : null,
            items: placeOrderPayload 
        };

        const headers = { "Content-Type": "application/json" };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = `${API}/orders`;
        console.log("API Call:", url);
        const res = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log("Order placed:", data);

        // Clear cart
        cart = [];
        updateCartBadge();
        updateCartUI();
        if(elements.dynamicFieldInput) elements.dynamicFieldInput.value = "";
        toggleCart();
        if (isAdminView) updateAdminDashboard();
        
        showToast('Order placed successfully!');
    } catch (err) {
        console.error("Error placing order:", err);
        showToast('Failed to place order.');
    }

    elements.checkoutBtn.innerHTML = `Place Order <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>`;
    lucide.createIcons();
}

// Toast
let toastTimeout;
function showToast(msg) {
    clearTimeout(toastTimeout);
    elements.toastMsg.textContent = msg;
    elements.toast.classList.remove('translate-y-20', 'opacity-0');
    
    toastTimeout = setTimeout(() => {
        elements.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// View Management (Store vs Admin)
let isAdminView = false;
function toggleAdmin() {
    isAdminView = !isAdminView;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (isAdminView) {
        updateAdminDashboard();
        elements.mainView.classList.add('opacity-0');
        setTimeout(() => {
            elements.mainView.classList.add('hidden');
            elements.adminView.classList.remove('hidden');
            // Allow display block to render before triggering opacity transition
            setTimeout(() => {
                elements.adminView.classList.remove('opacity-0');
            }, 50);
        }, 500);
    } else {
        elements.adminView.classList.add('opacity-0');
        setTimeout(() => {
            elements.adminView.classList.add('hidden');
            elements.mainView.classList.remove('hidden');
            setTimeout(() => {
                elements.mainView.classList.remove('opacity-0');
            }, 50);
        }, 500);
    }
}

//              Admin Dashboard Logic
async function updateAdminDashboard() {
    try {
        const url = `${API}/orders`;
        console.log("API Call:", url);
        const res = await fetch(url);
        orders = await res.json();
        console.log("Orders:", orders);
    } catch (err) {
        console.error("Failed to load orders:", err);
    }

    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    elements.adminTotalSales.textContent = `₹${totalSales.toFixed(2)}`;
    elements.adminTotalOrdersCount.textContent = orders.length;

    if (orders.length === 0) {
        elements.adminOrdersTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-cafe-900/50 bg-white/20">No orders yet today.</td>
            </tr>
        `;
        return;
    }

    elements.adminOrdersTable.innerHTML = [...orders].reverse().map(order => {
        // Handle varying order structures from backend safely
        const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : (order.items || 0);
        const orderTotal = order.total || 0;
        const status = order.status || 'Preparing';
        const time = order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const orderType = order.order_type || 'Unknown';
        const location = order.address || order.seat_number || 'N/A';
        const cName = order.customer_name || 'Guest';
        const cEmail = order.customer_email || 'N/A';
        const cPhone = order.customer_phone || 'N/A';

        return `
        <tr class="hover:bg-white/30 transition-colors border-b border-white/20">
            <td class="px-6 py-4 font-medium text-cafe-800">
                <div class="font-bold">#${order.id || ''}</div>
                <div class="text-xs text-cafe-900/60">${time}</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-medium">${cName}</div>
                <div class="text-xs text-cafe-900/60">${cEmail} <br> ${cPhone}</div>
            </td>
            <td class="px-6 py-4 max-w-[150px]">
                <div class="text-xs uppercase tracking-widest font-semibold ${orderType === 'cod' ? 'text-blue-600' : 'text-purple-600'}">${orderType}</div>
                <div class="text-sm truncate" title="${location}">${location}</div>
            </td>
            <td class="px-6 py-4">${itemsCount} items</td>
            <td class="px-6 py-4 font-medium">₹${orderTotal.toFixed(2)}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cafe-400/20 text-cafe-800">
                    <span class="w-1.5 h-1.5 rounded-full bg-cafe-800"></span> ${status}
                </span>
            </td>
        </tr>
        `;
    }).join('');
}
//      Admin Login Logic
async function handleAdminLogin(event) {
    event.preventDefault();

    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('adminLoginBtn');
    const errorMsg = document.getElementById('adminLoginError');

    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return;

    loginBtn.innerHTML = `<i class="ph ph-spinner animate-spin text-lg"></i> Authenticating...`;
    loginBtn.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        const url = `${API}/admin/login`;
        console.log("API Call:", url);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            localStorage.setItem("admin", "true");

            // ✅ FIXED
            window.location.href = "admin.html";

        } else {
            errorMsg.classList.remove('hidden');
            resetLoginBtn(loginBtn);
        }

    } catch (err) {
        console.error("Login check failed:", err);
        errorMsg.querySelector('span').textContent = "Network error. Please try again.";
        errorMsg.classList.remove('hidden');
        resetLoginBtn(loginBtn);
    }
    function resetLoginBtn(btn) {
    btn.innerHTML = `Login <i class="ph ph-arrow-right"></i>`;
    btn.disabled = false;
}
}
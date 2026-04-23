/**
 * ============================================================
 * AURA CAFE — AI Chatbot Widget  (chatbot.js)
 * ============================================================
 * Connects to FastAPI endpoint: POST /api/chat
 * Fallback: smart local keyword matching when backend is down
 *
 * Features:
 *  - Floating toggle button with smooth open/close animation
 *  - Typing indicator (1-2 s) before bot replies
 *  - Quick-reply chips below the welcome message
 *  - Auto-scroll to latest message
 *  - Enter-key to send
 *  - Timestamps on every message
 *  - Disable input/send while waiting for response
 *  - Context-aware local fallback replies (menu, combos, order)
 *  - Mobile responsive
 * ============================================================
 */

/* ──────────────────────────────────────────────────────────
   CONFIG
────────────────────────────────────────────────────────── */

/** Base URL for your FastAPI backend. Change this if deployed. */
const CHATBOT_API_BASE = "http://127.0.0.1:8000";

/** Full endpoint for the chatbot */
const CHATBOT_ENDPOINT = `${CHATBOT_API_BASE}/api/chat`;

/**
 * Minimum time (ms) to show the typing indicator.
 * Makes the bot feel more natural — not instant.
 */
const TYPING_DELAY_MS = 1400;

/* ──────────────────────────────────────────────────────────
   MENU KNOWLEDGE BASE  (used in local fallback)
   Keep this in sync with app.js menuItems / your actual menu
────────────────────────────────────────────────────────── */

const MENU_KNOWLEDGE = {
  drinks: [
    { name: "Authentic Masala Chai",    price: 150 },
    { name: "Mango Lassi",              price: 180 },
    { name: "Madras Filter Coffee",     price: 120 },
  ],
  snacks: [
    { name: "Samosa Chaat",             price: 250 },
    { name: "Bombay Vada Pav",          price: 150 },
  ],
  meals: [
    { name: "Paneer Tikka Croissant",   price: 220 },
  ],
  combos: [
    { name: "Chai + Vada Pav",          price: 270, saving: 30 },
    { name: "Filter Coffee + Croissant", price: 320, saving: 20 },
    { name: "Mango Lassi + Samosa Chaat", price: 400, saving: 30 },
  ],
};

/* ──────────────────────────────────────────────────────────
   LOCAL FALLBACK RESPONSE ENGINE
   Returns a friendly string based on simple keyword matching.
   Used when the FastAPI backend is unreachable.
────────────────────────────────────────────────────────── */

/**
 * Generates a smart local response for common user intents.
 * @param {string} message — raw user input
 * @returns {string} — HTML-safe reply text
 */
function localFallbackResponse(message) {
  const m = message.toLowerCase().trim();

  /* ── Greetings ── */
  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|namaste|hola)/.test(m)) {
    return "Namaste! 🙏 Welcome back to Aura Cafe. I'm your virtual barista — here to help you explore our menu, suggest delicious combos, or check on your order. What can I brew for you today?";
  }

  /* ── Full menu listing ── */
  if (/\b(menu|full menu|show menu|what.*have|what.*serve|available|items|list)\b/.test(m)) {
    const drinks = MENU_KNOWLEDGE.drinks.map(d => `☕ ${d.name} — ₹${d.price}`).join("\n");
    const snacks = MENU_KNOWLEDGE.snacks.map(s => `🍟 ${s.name} — ₹${s.price}`).join("\n");
    const meals  = MENU_KNOWLEDGE.meals.map(ml => `🥐 ${ml.name} — ₹${ml.price}`).join("\n");
    return `Here's what we're serving today! 🌟\n\n**Drinks:**\n${drinks}\n\n**Snacks:**\n${snacks}\n\n**Meals:**\n${meals}\n\nWant to know more about any item, or shall I suggest a combo? 😊`;
  }

  /* ── Combos ── */
  if (/\b(combo|combos|deal|deals|bundle|pair|together|save)\b/.test(m)) {
    const list = MENU_KNOWLEDGE.combos.map(c => `🎉 ${c.name} — ₹${c.price} (save ₹${c.saving})`).join("\n");
    return `Here are our value combos — great for a complete cafe experience! 🤩\n\n${list}\n\nPick a combo and I'll help you add it to your cart! 🛒`;
  }

  /* ── Recommendations ── */
  if (/\b(recommend|suggest|popular|best|favourite|favorite|top|what should|try)\b/.test(m)) {
    return "Great choice to ask! Here are our crowd favourites 🏆\n\n☕ **Madras Filter Coffee** (₹120) — A strong, frothy South Indian classic.\n🍟 **Samosa Chaat** (₹250) — Everyone's guilty pleasure!\n🥐 **Paneer Tikka Croissant** (₹220) — Our signature fusion item.\n\nFor the best value, go for the **Chai + Vada Pav** combo at just ₹270! 😍";
  }

  /* ── Drinks category ── */
  if (/\b(drink|drinks|beverage|beverages|tea|coffee|chai|lassi|juice)\b/.test(m)) {
    const list = MENU_KNOWLEDGE.drinks.map(d => `☕ ${d.name} — ₹${d.price}`).join("\n");
    return `Our drinks menu is full of warmth and flavour! ☕\n\n${list}\n\nAny of these catch your eye? I can tell you more!`;
  }

  /* ── Snacks category ── */
  if (/\b(snack|snacks|bite|bites|chaat|vada|samosa|pav|food)\b/.test(m)) {
    const list = MENU_KNOWLEDGE.snacks.map(s => `🍟 ${s.name} — ₹${s.price}`).join("\n");
    return `For snacks, we've got some Mumbai-style street food magic! 🌶️\n\n${list}\n\nPair any snack with a chai or lassi for the full experience!`;
  }

  /* ── Order tracking / status ── */
  if (/\b(order|track|status|where.*order|my order|delivery|how long|time|wait)\b/.test(m)) {
    return "📦 To track your order, please check the email confirmation we sent you, or speak to our staff at the counter. For delivery orders, our average time is **25–35 minutes**. Dine-in orders are usually ready in **10–15 minutes**.\n\nIs there anything else I can help you with?";
  }

  /* ── Pricing ── */
  if (/\b(price|cost|how much|cheap|affordable|expensive|budget)\b/.test(m)) {
    return "Our menu is designed to be accessible for everyone! 💛\n\n🍵 Drinks start from just **₹120**\n🍟 Snacks from **₹150**\n🥐 Meals from **₹220**\n\nOur combos offer the best value — starting at **₹270**. Want to see the full menu?";
  }

  /* ── Vegetarian / vegan ── */
  if (/\b(veg|vegetarian|vegan|plant.based|non.veg|egg|meat|chicken)\b/.test(m)) {
    return "Great news — our entire menu at Aura Cafe is **100% vegetarian** 🌿🙌 Every item is crafted with fresh, plant-based ingredients. We also have vegan-friendly options — just ask our staff for details!";
  }

  /* ── Thanking ── */
  if (/\b(thanks|thank you|thx|ty|great|awesome|perfect|wonderful)\b/.test(m)) {
    return "You're so welcome! 😊 It's our pleasure to serve you. Feel free to ask me anything else — I'm always here. Enjoy your visit to Aura Cafe! ☕✨";
  }

  /* ── Goodbye ── */
  if (/\b(bye|goodbye|see you|cya|later|exit|close)\b/.test(m)) {
    return "Goodbye! 👋 Hope to see you again soon at Aura Cafe. Have a wonderful day, and don't forget — life's too short for bad coffee! ☕😄";
  }

  /* ── Default fallback ── */
  return `I'm not quite sure I understood that 😅 — but I'm here to help! Try asking me:\n\n• "Show me the menu"\n• "What are your combos?"\n• "Recommend something for me"\n• "Track my order"\n\nOr just type freely — I'll do my best! 😊`;
}

/* ──────────────────────────────────────────────────────────
   UTILITY — Format timestamp
────────────────────────────────────────────────────────── */

/**
 * Returns a human-readable time string, e.g. "10:35 AM"
 * @param {Date} [date]
 * @returns {string}
 */
function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ──────────────────────────────────────────────────────────
   CHATBOT CLASS
────────────────────────────────────────────────────────── */

class AuraChatbot {
  constructor() {
    /* DOM refs */
    this.toggleBtn   = document.getElementById("chatbotToggle");
    this.window      = document.getElementById("chatbotWindow");
    this.messagesEl  = document.getElementById("chatbotMessages");
    this.typingEl    = document.getElementById("chatbotTyping");
    this.inputEl     = document.getElementById("chatbotInput");
    this.sendBtn     = document.getElementById("chatbotSend");
    this.closeBtn    = document.getElementById("chatbotClose");
    this.unreadBadge = document.getElementById("chatbotUnread");

    /* State */
    this.isOpen       = false;   // Whether the chat window is visible
    this.isWaiting    = false;   // Whether we are waiting for bot response
    this.unreadCount  = 0;       // Messages received while window is closed
    this.hasGreeted   = false;   // Track if we've sent the welcome message

    /* Bind and init */
    this._bindEvents();
    // Delay auto-greet slightly so user notices the button first
    setTimeout(() => this._showGreeting(), 2000);
  }

  /* ──────────────────────────────────
     EVENT BINDING
  ────────────────────────────────── */

  _bindEvents() {
    /* Toggle open/close */
    this.toggleBtn.addEventListener("click", () => this.toggle());
    this.closeBtn.addEventListener("click",  () => this.close());

    /* Send on button click */
    this.sendBtn.addEventListener("click", () => this._handleSend());

    /* Send on Enter key (Shift+Enter = new line if we ever allow it) */
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    /* Enable/disable send button based on input content */
    this.inputEl.addEventListener("input", () => {
      this.sendBtn.disabled = this.inputEl.value.trim() === "" || this.isWaiting;
    });
  }

  /* ──────────────────────────────────
     OPEN / CLOSE / TOGGLE
  ────────────────────────────────── */

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    /* Show window with animation */
    this.window.classList.add("is-open");
    this.toggleBtn.classList.add("is-open");

    /* Hide unread badge */
    this._clearUnread();

    /* Focus the input field after animation settles */
    setTimeout(() => this.inputEl.focus(), 320);

    /* Scroll messages to bottom */
    this._scrollToBottom();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.window.classList.remove("is-open");
    this.toggleBtn.classList.remove("is-open");
  }

  /* ──────────────────────────────────
     GREETING & QUICK REPLIES
  ────────────────────────────────── */

  _showGreeting() {
    if (this.hasGreeted) return;
    this.hasGreeted = true;

    const greetText = "Hi! 👋 I'm your Aura Cafe assistant. I can help you choose food, suggest combos, or track your order 😊";

    /* Render bot bubble (no typing delay for greeting) */
    this._appendMessage("bot", greetText);

    /* Render quick-reply chips below the greeting */
    this._appendQuickReplies([
      "📋 Show menu",
      "✨ Recommend something",
      "📦 Track my order",
      "🎉 Today's combos",
    ]);

    /* Increment unread if window is closed */
    if (!this.isOpen) {
      this._incrementUnread();
    }
  }

  /* ──────────────────────────────────
     SEND MESSAGE HANDLER
  ────────────────────────────────── */

  async _handleSend() {
    const text = this.inputEl.value.trim();
    if (!text || this.isWaiting) return;

    /* Clear input & disable controls */
    this.inputEl.value = "";
    this._setWaiting(true);

    /* Render user's message immediately */
    this._appendMessage("user", text);

    /* Show typing indicator */
    this._showTyping();

    /* Fetch bot reply */
    const reply = await this._fetchBotReply(text);

    /* Hide typing indicator, show reply */
    this._hideTyping();
    this._appendMessage("bot", reply);

    /* Re-enable controls */
    this._setWaiting(false);

    /* Increment unread if the user closed the window mid-conversation */
    if (!this.isOpen) {
      this._incrementUnread();
    }

    /* Focus input again for quick follow-up */
    this.inputEl.focus();
  }

  /* ──────────────────────────────────
     API CALL  →  FastAPI /api/chat
  ────────────────────────────────── */

  /**
   * Sends message to FastAPI, falls back to local engine on error.
   * @param {string} userMessage
   * @returns {Promise<string>} bot reply text
   */
  async _fetchBotReply(userMessage) {
    /* We wait at least TYPING_DELAY_MS for a more natural feel */
    const [apiResult] = await Promise.allSettled([
      this._callAPI(userMessage),
      new Promise(resolve => setTimeout(resolve, TYPING_DELAY_MS)),
    ]);

    if (apiResult.status === "fulfilled" && apiResult.value) {
      return apiResult.value;
    }

    /* API failed / not running — use smart local fallback */
    console.warn("[AuraChatbot] Backend unreachable. Using local fallback.");
    return localFallbackResponse(userMessage);
  }

  /**
   * Makes the actual POST request to the FastAPI endpoint.
   * @param {string} message
   * @returns {Promise<string|null>}
   */
  async _callAPI(message) {
    try {
      const res = await fetch(CHATBOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      if (!res.ok) {
        console.error(`[AuraChatbot] API error: ${res.status} ${res.statusText}`);
        return null;
      }

      const data = await res.json();

      /* Support both { reply: "..." } and { message: "..." } shapes */
      return data.reply || data.message || null;
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[AuraChatbot] Fetch failed:", err);
      }
      return null;
    }
  }

  /* ──────────────────────────────────
     DOM HELPERS
  ────────────────────────────────── */

  /**
   * Appends a chat message bubble to the messages area.
   * @param {"user"|"bot"} role
   * @param {string} text
   */
  _appendMessage(role, text) {
    /* Outer wrapper */
    const wrapper = document.createElement("div");
    wrapper.className = `chatbot-msg ${role}`;

    /* Bubble */
    const bubble = document.createElement("div");
    bubble.className = "chatbot-bubble";

    /* Render simple markdown-like formatting */
    bubble.innerHTML = this._renderText(text);

    /* Timestamp */
    const ts = document.createElement("span");
    ts.className = "chatbot-timestamp";
    ts.textContent = formatTime();

    wrapper.appendChild(bubble);
    wrapper.appendChild(ts);
    this.messagesEl.appendChild(wrapper);

    this._scrollToBottom();
  }

  /**
   * Renders quick-reply chip buttons.
   * @param {string[]} chips — array of chip labels
   */
  _appendQuickReplies(chips) {
    const container = document.createElement("div");
    container.className = "chatbot-quick-replies";
    container.id = "chatbotChips"; // so we can remove them after one use

    chips.forEach(label => {
      const btn = document.createElement("button");
      btn.className = "chatbot-chip";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        /* Remove quick replies after first use to keep chat clean */
        const existing = document.getElementById("chatbotChips");
        if (existing) existing.remove();

        /* Treat chip click as user sending that message */
        this.inputEl.value = label.replace(/^[\p{Emoji}\s]+/u, "").trim();
        this._handleSend();
      });
      container.appendChild(btn);
    });

    this.messagesEl.appendChild(container);
    this._scrollToBottom();
  }

  /**
   * Shows the animated typing indicator.
   */
  _showTyping() {
    this.typingEl.style.display = "flex";
    this._scrollToBottom();
  }

  /**
   * Hides the typing indicator.
   */
  _hideTyping() {
    this.typingEl.style.display = "none";
  }

  /**
   * Enables or disables the input + send button.
   * @param {boolean} waiting
   */
  _setWaiting(waiting) {
    this.isWaiting = waiting;
    this.inputEl.disabled  = waiting;
    this.sendBtn.disabled  = waiting;
    this.inputEl.placeholder = waiting
      ? "Cafe assistant is typing…"
      : "What would you like to have today?";
  }

  /**
   * Smoothly scrolls the messages container to the bottom.
   */
  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }

  /* ── Unread badge ── */

  _incrementUnread() {
    this.unreadCount += 1;
    this.unreadBadge.textContent = this.unreadCount;
    this.unreadBadge.classList.remove("hidden");
  }

  _clearUnread() {
    this.unreadCount = 0;
    this.unreadBadge.classList.add("hidden");
  }

  /* ──────────────────────────────────
     TEXT RENDERER
     Converts simple **bold** and \n into HTML.
  ────────────────────────────────── */

  /**
   * Converts plain text with basic markdown-like formatting to safe HTML.
   * @param {string} text
   * @returns {string} HTML string
   */
  _renderText(text) {
    /* Escape HTML first to prevent XSS */
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      /* **bold** */
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      /* *italic* */
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      /* newlines → <br> */
      .replace(/\n/g, "<br>");
  }
}

/* ──────────────────────────────────────────────────────────
   BOOTSTRAP — initialise when DOM is ready
────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Expose the chatbot instance globally so other scripts
   * (e.g. app.js) can call `window.auraChatbot.open()` if needed.
   */
  window.auraChatbot = new AuraChatbot();

  /* Initial state: send button disabled until user types */
  const sendBtn = document.getElementById("chatbotSend");
  if (sendBtn) sendBtn.disabled = true;
});

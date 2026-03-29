import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// ─── APP CONSTANTS ───────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "1031994809087-ribigpmso5umf5bt4f1eofdj4vor2rk4.apps.googleusercontent.com";
const ADMIN_EMAILS = ["thestdychannelonly@gmail.com", "pythonwitharsh@gmail.com"];

const UPI_APPS = [
  { id: "gpay",    name: "Google Pay",  color: "#4285F4", icon: "💳" },
  { id: "phonepe", name: "PhonePe",     color: "#5F259F", icon: "📱" },
  { id: "paytm",   name: "Paytm",       color: "#E0278A", icon: "💰" },
  { id: "bhim",    name: "BHIM UPI",    color: "#1A8838", icon: "🏦" },
];

const MENU = [
  { id:1,  category:"Starters",  name:"Paneer Tikka",         price:220, emoji:"🧀", desc:"Marinated cottage cheese, tandoor-grilled" },
  { id:2,  category:"Starters",  name:"Veg Spring Rolls",     price:160, emoji:"🥢", desc:"Crispy rolls with mixed veggies" },
  { id:3,  category:"Starters",  name:"Chicken Wings",        price:280, emoji:"🍗", desc:"Spiced, smoky, served with dip" },
  { id:4,  category:"Mains",     name:"Dal Makhani",          price:240, emoji:"🍲", desc:"Slow-cooked black lentils, butter & cream" },
  { id:5,  category:"Mains",     name:"Butter Chicken",       price:320, emoji:"🍛", desc:"Classic tomato-cream curry" },
  { id:6,  category:"Mains",     name:"Paneer Butter Masala", price:290, emoji:"🫕", desc:"Cottage cheese in rich gravy" },
  { id:7,  category:"Mains",     name:"Chicken Biryani",      price:360, emoji:"🍚", desc:"Fragrant basmati, slow-dum cooked" },
  { id:8,  category:"Breads",    name:"Butter Naan",          price:50,  emoji:"🫓", desc:"Soft tandoor-baked bread" },
  { id:9,  category:"Breads",    name:"Garlic Roti",          price:45,  emoji:"🥙", desc:"Whole wheat, garlic butter" },
  { id:10, category:"Breads",    name:"Paratha",              price:60,  emoji:"🥞", desc:"Layered, flaky whole wheat" },
  { id:11, category:"Drinks",    name:"Mango Lassi",          price:90,  emoji:"🥭", desc:"Thick, sweet, chilled" },
  { id:12, category:"Drinks",    name:"Masala Chai",          price:40,  emoji:"☕", desc:"Spiced milk tea" },
  { id:13, category:"Drinks",    name:"Fresh Lime Soda",      price:70,  emoji:"🍋", desc:"Sweet or salted, your choice" },
  { id:14, category:"Desserts",  name:"Gulab Jamun",          price:80,  emoji:"🟤", desc:"Warm, syrup-soaked dumplings" },
  { id:15, category:"Desserts",  name:"Kulfi",                price:100, emoji:"🍦", desc:"Traditional Indian ice cream" },
];

const CATEGORIES   = ["All", ...Array.from(new Set(MENU.map(i => i.category)))];
const STATUS_FLOW  = ["Received", "Preparing", "Ready"];
const STATUS_COLOR = { Received:"#60a5fa", Preparing:"#f59e0b", Ready:"#34d399" };
const TABLES       = Array.from({ length:20 }, (_, i) => i + 1);

// ─── THEME CONTEXT ───────────────────────────────────────────────────────────
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("bs_theme") || "dark");
  useEffect(() => {
    localStorage.setItem("bs_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  return useContext(ThemeContext);
}

// ─── FIREBASE CONTEXT (Optional) ─────────────────────────────────────────────
const FirebaseContext = createContext();

function FirebaseProvider({ children }) {
  const [db, setDb] = useState(null);
  const [ready, setReady] = useState(!IS_FIREBASE_CONFIGURED);

  useEffect(() => {
    if (!IS_FIREBASE_CONFIGURED) return;
    import("firebase/app").then(() => {
      import("firebase/firestore").then(() => {
        if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
        setDb(window.firebase.firestore());
        setReady(true);
      });
    }).catch(() => setReady(true));
  }, []);

  return (
    <FirebaseContext.Provider value={{ db, ready, isConfigured: IS_FIREBASE_CONFIGURED }}>
      {children}
    </FirebaseContext.Provider>
  );
}

function useFirebase() {
  return useContext(FirebaseContext);
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
function genId() { return "ORD-" + Math.random().toString(36).slice(2,6).toUpperCase(); }

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  }).replace(",", " ·");
}

// ─── PERSISTENT STORAGE ────────────────────────────────────────────────────
function loadOrders() {
  try { return JSON.parse(localStorage.getItem("bs_orders") || "[]"); } catch { return []; }
}
function persistOrders(orders) {
  try { localStorage.setItem("bs_orders", JSON.stringify(orders)); } catch {}
}
function loadRatings() {
  try { return JSON.parse(localStorage.getItem("bs_ratings") || "{}"); } catch { return {}; }
}
function persistRatings(ratings) {
  try { localStorage.setItem("bs_ratings", JSON.stringify(ratings)); } catch {}
}
function loadAuth() {
  try { return JSON.parse(localStorage.getItem("bs_auth") || "null"); } catch { return null; }
}
function persistAuth(auth) {
  try {
    if (auth) localStorage.setItem("bs_auth", JSON.stringify(auth));
    else localStorage.removeItem("bs_auth");
  } catch {}
}
function loadOrderHistory() {
  try { return JSON.parse(localStorage.getItem("bs_order_history") || "[]"); } catch { return []; }
}
function persistOrderHistory(history) {
  try { localStorage.setItem("bs_order_history", JSON.stringify(history)); } catch {}
}

// ─── USER PROFILES (for history, coupons, rewards) ───────────────────────────
function loadUsers() {
  try { return JSON.parse(localStorage.getItem("bs_users") || "{}"); } catch { return {}; }
}
function persistUsers(users) {
  try { localStorage.setItem("bs_users", JSON.stringify(users)); } catch {}
}

function getUserProfile(email) {
  const users = loadUsers();
  return users[email] || null;
}

function updateUserProfile(email, updates) {
  const users = loadUsers();
  users[email] = { ...users[email], ...updates };
  persistUsers(users);
}

function createUserProfile(user) {
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
  if (isAdmin) return null; // Don't create profile for admins

  const profile = {
    name: user.name,
    email: user.email,
    picture: user.picture,
    joinedAt: Date.now(),
    ordersCount: 0,
    totalSpent: 0,
    coupons: ["WELCOME10"], // Welcome coupon
    redeemedCoupons: [],
    rewardPoints: 0,
  };

  const users = loadUsers();
  if (!users[user.email]) {
    users[user.email] = profile;
    persistUsers(users);
  }

  return profile;
}

// ─── SHARED IN-MEMORY STORE ────────────────────────────────────────────────
let _orders   = loadOrders();
let _ratings  = loadRatings();
let _listeners = [];

function saveOrders(o) {
  _orders = [...o];
  persistOrders(_orders);
  _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} }));
}
function saveRating(itemId, stars) {
  if (!_ratings[itemId]) _ratings[itemId] = [];
  _ratings[itemId] = [..._ratings[itemId], stars];
  persistRatings(_ratings);
  _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} }));
}
function subscribeStore(fn) {
  _listeners.push(fn);
  fn({ orders:[..._orders], ratings:{..._ratings} });
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function setupCrossTabSync() {
  window.addEventListener("storage", (e) => {
    if (e.key === "bs_orders")   { try { _orders = JSON.parse(e.newValue || "[]"); } catch {} }
    if (e.key === "bs_ratings")  { try { _ratings = JSON.parse(e.newValue || "{}"); } catch {} }
    _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} }));
  });
  setInterval(() => {
    try {
      const o = JSON.parse(localStorage.getItem("bs_orders") || "[]");
      const r = JSON.parse(localStorage.getItem("bs_ratings") || "{}");
      const changed = JSON.stringify(o) !== JSON.stringify(_orders) || JSON.stringify(r) !== JSON.stringify(_ratings);
      if (changed) { _orders = o; _ratings = r; _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} })); }
    } catch {}
  }, 800);
}
setupCrossTabSync();

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#0d0d0f; --bg2:#141417; --bg3:#1c1c21; --bg4:#242429;
    --line:rgba(255,255,255,0.07); --line2:rgba(255,255,255,0.04);
    --text:#e8e6e3; --text2:#9b9893; --text3:#5c5a57;
    --accent:#c8a97e; --accent2:#a07850;
    --blue:#60a5fa; --amber:#f59e0b; --green:#34d399; --red:#f87171;
    --r:8px; --r2:4px;
  }
  [data-theme="light"] {
    --bg:#f5f5f0; --bg2:#ffffff; --bg3:#f0f0eb; --bg4:#e8e8e3;
    --line:rgba(0,0,0,0.08); --line2:rgba(0,0,0,0.04);
    --text:#1a1a1a; --text2:#4a4a4a; --text3:#8a8a8a;
  }

  html,body { background:var(--bg); color:var(--text); }
  body { font-family:'DM Sans',sans-serif; min-height:100vh; -webkit-font-smoothing:antialiased; }
  button { cursor:pointer; font-family:inherit; }
  a { color:var(--accent); text-decoration:none; }
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-thumb { background:var(--bg4); border-radius:2px; }
  :focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

  /* Theme Toggle */
  .theme-toggle { padding:8px; border:1px solid var(--line); background:var(--bg3); border-radius:var(--r2); font-size:16px; transition:all 0.2s; }
  .theme-toggle:hover { border-color:var(--accent); background:var(--bg4); }

  /* Auth */
  .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--bg); }
  .auth-card { width:100%; max-width:400px; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:48px 40px 40px; position:relative; }
  .auth-card::before { content:''; position:absolute; top:0; left:40px; right:40px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .auth-brand { text-align:center; margin-bottom:32px; }
  .auth-brand-name { font-family:'DM Serif Display',serif; font-size:36px; color:var(--text); letter-spacing:0.02em; line-height:1; }
  .auth-brand-name em { font-style:italic; color:var(--accent); }
  .auth-tagline { font-size:11px; letter-spacing:0.18em; color:var(--text3); text-transform:uppercase; margin-top:10px; }
  .auth-subtitle { text-align:center; font-size:13px; color:var(--text3); margin-bottom:32px; line-height:1.8; }
  .google-btn { width:100%; padding:14px 18px; border:1px solid var(--line); background:var(--bg3); color:var(--text2); border-radius:var(--r2); font-size:14px; font-weight:500; display:flex; align-items:center; justify-content:center; gap:12px; transition:border-color 0.2s,background 0.2s; }
  .google-btn:hover:not(:disabled) { border-color:var(--accent); background:var(--bg4); color:var(--text); }
  .google-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .auth-note { font-size:11px; color:var(--text3); text-align:center; margin-top:24px; line-height:1.7; }
  .auth-error { margin-top:12px; font-size:12px; color:var(--red); background:rgba(248,113,113,0.07); padding:10px 14px; border-radius:var(--r2); border:1px solid rgba(248,113,113,0.2); text-align:center; }
  .auth-loader { display:inline-block; width:16px; height:16px; border:2px solid var(--text3); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Nav */
  .top-nav { background:var(--bg2); border-bottom:1px solid var(--line); height:56px; padding:0 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; gap:12px; }
  .nav-brand { font-family:'DM Serif Display',serif; font-size:20px; color:var(--text); flex-shrink:0; }
  .nav-brand em { font-style:italic; color:var(--accent); }
  .nav-right { display:flex; align-items:center; gap:8px; min-width:0; }
  .nav-role { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; padding:4px 10px; border-radius:20px; border:1px solid; white-space:nowrap; flex-shrink:0; }
  .nav-role.admin { border-color:rgba(200,169,126,0.35); color:var(--accent); background:rgba(200,169,126,0.08); }
  .nav-role.customer { border-color:var(--line); color:var(--text3); }
  .nav-user { display:flex; align-items:center; gap:7px; min-width:0; max-width:160px; }
  .nav-avatar { width:28px; height:28px; border-radius:50%; flex-shrink:0; object-fit:cover; border:1px solid var(--line); }
  .nav-avatar-init { width:28px; height:28px; border-radius:50%; flex-shrink:0; background:var(--bg4); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:var(--text2); }
  .nav-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--text2); }
  .nav-signout { padding:5px 12px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:11px; letter-spacing:0.06em; transition:all 0.18s; white-space:nowrap; flex-shrink:0; }
  .nav-signout:hover { border-color:var(--red); color:var(--red); }
  .nav-btn { padding:6px 14px; border:1px solid var(--accent); background:rgba(200,169,126,0.1); color:var(--accent); border-radius:var(--r2); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; display:flex; align-items:center; gap:6px; }
  .nav-btn:hover { background:var(--accent); color:var(--bg); border-color:var(--accent); }

  /* Customer Menu */
  .menu-page { max-width:500px; margin:0 auto; padding-bottom:150px; }
  .table-hero { margin:18px 14px 0; background:var(--bg3); border:1px solid var(--line); border-radius:var(--r); padding:18px 22px; display:flex; align-items:center; gap:14px; cursor:pointer; position:relative; overflow:hidden; transition:border-color 0.2s; }
  .table-hero:hover { border-color:var(--accent); }
  .table-hero-num { font-family:'DM Serif Display',serif; font-size:48px; color:var(--accent); line-height:1; }
  .table-hero-label { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--text3); margin-bottom:3px; }
  .table-hero-hint { font-size:12px; color:var(--text2); }
  .table-hero-chevron { margin-left:auto; color:var(--text3); font-size:20px; }
  .table-prompt { margin:18px 14px 0; padding:14px 18px; border:1px dashed var(--bg4); border-radius:var(--r); cursor:pointer; display:flex; align-items:center; gap:12px; background:var(--bg2); transition:border-color 0.2s; }
  .table-prompt:hover { border-color:var(--accent); }
  .table-prompt-text { flex:1; font-size:13px; color:var(--text3); }
  .table-prompt-cta { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent); font-weight:500; }
  .cat-strip { display:flex; gap:6px; padding:18px 14px 0; overflow-x:auto; scrollbar-width:none; }
  .cat-strip::-webkit-scrollbar { display:none; }
  .cat-pill { white-space:nowrap; padding:6px 16px; border:1px solid var(--line); background:transparent; color:var(--text3); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; font-weight:500; flex-shrink:0; border-radius:20px; transition:all 0.2s; }
  .cat-pill.on { background:var(--accent); border-color:var(--accent); color:var(--bg); }
  .menu-group { padding:22px 14px 0; }
  .menu-group-label { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--text3); margin-bottom:12px; display:flex; align-items:center; gap:10px; }
  .menu-group-label::after { content:''; flex:1; height:1px; background:var(--line2); }
  .menu-list { display:flex; flex-direction:column; gap:2px; }
  .menu-item { background:var(--bg2); padding:14px 18px; display:flex; align-items:center; gap:12px; transition:background 0.15s; border-radius:var(--r); border:1px solid transparent; }
  .menu-item:hover { background:var(--bg3); border-color:var(--line); }
  .menu-item-emoji { font-size:26px; width:40px; text-align:center; flex-shrink:0; }
  .menu-item-body { flex:1; min-width:0; }
  .menu-item-name { font-size:14px; font-weight:500; color:var(--text); margin-bottom:2px; }
  .menu-item-desc { font-size:11px; color:var(--text3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .menu-item-price { font-family:'DM Serif Display',serif; font-size:16px; color:var(--accent); margin-top:4px; }
  .item-ctrl { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .item-btn { width:28px; height:28px; border-radius:50%; border:1px solid var(--line); background:var(--bg3); color:var(--text); font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; line-height:1; }
  .item-btn:hover { border-color:var(--accent); color:var(--accent); }
  .item-qty { font-size:14px; font-weight:500; min-width:16px; text-align:center; color:var(--text); }
  .item-add { padding:6px 16px; border-radius:var(--r2); border:1px solid var(--line); background:transparent; color:var(--text2); font-size:11px; letter-spacing:0.06em; font-weight:500; transition:all 0.18s; text-transform:uppercase; }
  .item-add:hover { border-color:var(--accent); color:var(--accent); }
  .cart-bar { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:500px; padding:12px 14px 26px; background:var(--bg2); border-top:1px solid var(--line); z-index:50; }
  .cart-bar-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .cart-bar-count { font-size:12px; color:var(--text3); }
  .cart-bar-count strong { color:var(--text); font-weight:600; }
  .cart-total { font-family:'DM Serif Display',serif; font-size:20px; color:var(--text); }
  .cart-discount { font-size:11px; color:var(--green); margin-left:6px; }
  .cart-place { width:100%; padding:13px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-size:14px; font-weight:600; letter-spacing:0.04em; transition:background 0.2s,transform 0.1s; }
  .cart-place:hover { background:var(--accent2); color:#fff; }
  .cart-place:active { transform:scale(0.99); }
  .cart-place:disabled { opacity:0.6; cursor:not-allowed; }
  .live-insights { margin:18px 14px 0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .insight-card { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:14px 16px; min-width:0; }
  .insight-label { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--text3); margin-bottom:8px; }
  .insight-value { font-family:'DM Serif Display',serif; font-size:24px; color:var(--accent); line-height:1; }
  .insight-sub { font-size:11px; color:var(--text3); margin-top:6px; line-height:1.5; }
  .live-panel { margin:18px 14px 0; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); overflow:hidden; }
  .live-panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid var(--line2); }
  .live-panel-title { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--text2); }
  .live-panel-status { font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--green); display:flex; align-items:center; gap:6px; }
  .live-panel-status::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.7s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:.3;} }
  .live-panel-body { padding:16px 18px; display:flex; flex-direction:column; gap:12px; }
  .live-order-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--line2); }
  .live-order-row:last-child { padding-bottom:0; border-bottom:none; }
  .live-order-main { min-width:0; }
  .live-order-id { font-size:13px; color:var(--text); font-weight:600; margin-bottom:4px; }
  .live-order-meta { font-size:11px; color:var(--text3); }
  .live-order-badge { font-size:10px; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; border-radius:20px; border:1px solid; white-space:nowrap; }
  .live-order-badge.Received { color:var(--blue); border-color:rgba(96,165,250,0.35); background:rgba(96,165,250,0.08); }
  .live-order-badge.Preparing { color:var(--amber); border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.08); }
  .live-order-badge.Ready { color:var(--green); border-color:rgba(52,211,153,0.35); background:rgba(52,211,153,0.08); }
  .live-empty { padding:8px 0 2px; font-size:12px; color:var(--text3); line-height:1.7; }
  .timeline { margin-top:16px; background:var(--bg3); border:1px solid var(--line); border-radius:var(--r); padding:14px 16px; }
  .timeline-title { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--text3); margin-bottom:10px; }
  .timeline-list { display:flex; flex-direction:column; gap:10px; }
  .timeline-row { display:flex; align-items:flex-start; gap:10px; }
  .timeline-dot { width:9px; height:9px; border-radius:50%; margin-top:4px; flex-shrink:0; background:var(--bg4); border:1px solid var(--line); }
  .timeline-dot.active { background:var(--accent); border-color:transparent; }
  .timeline-content { min-width:0; }
  .timeline-label { font-size:12px; color:var(--text2); }
  .timeline-meta { font-size:10px; color:var(--text3); margin-top:3px; line-height:1.5; }

  /* Order History */
  .history-page { max-width:500px; margin:0 auto; padding:18px 14px; }
  .history-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .history-title { font-family:'DM Serif Display',serif; font-size:24px; color:var(--text); }
  .history-back { padding:8px 16px; border:1px solid var(--line); background:transparent; color:var(--text2); border-radius:var(--r2); font-size:12px; display:flex; align-items:center; gap:6px; transition:all 0.18s; }
  .history-back:hover { border-color:var(--accent); color:var(--accent); }
  .history-empty { text-align:center; padding:60px 20px; }
  .history-empty-icon { font-size:48px; opacity:0.2; margin-bottom:16px; }
  .history-empty-text { font-size:14px; color:var(--text3); }
  .history-list { display:flex; flex-direction:column; gap:12px; }
  .history-card { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:16px 18px; }
  .history-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
  .history-card-id { font-family:'DM Serif Display',serif; font-size:18px; color:var(--accent); }
  .history-card-meta { font-size:11px; color:var(--text3); margin-top:2px; }
  .history-card-status { font-size:10px; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; border-radius:20px; border:1px solid; }
  .history-card-items { border-top:1px solid var(--line2); padding-top:10px; display:flex; flex-direction:column; gap:5px; }
  .history-item { display:flex; justify-content:space-between; font-size:12px; }
  .history-item-name { color:var(--text2); }
  .history-item-qty { color:var(--text); font-weight:500; }
  .history-card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid var(--line2); }
  .history-reorder-btn { padding:6px 14px; border:1px solid var(--line); background:transparent; color:var(--text2); border-radius:var(--r2); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.18s; }
  .history-reorder-btn:hover { border-color:var(--accent); color:var(--accent); }

  /* Coupons */
  .coupon-banner { margin:18px 14px 0; background:linear-gradient(135deg,rgba(200,169,126,0.15),rgba(200,169,126,0.05)); border:1px solid rgba(200,169,126,0.3); border-radius:var(--r); padding:16px 18px; }
  .coupon-banner-title { font-size:12px; font-weight:600; color:var(--accent); margin-bottom:8px; display:flex; align-items:center; gap:6px; }
  .coupon-list { display:flex; flex-direction:column; gap:8px; }
  .coupon-chip { background:var(--bg3); border:1px dashed rgba(200,169,126,0.4); border-radius:var(--r2); padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .coupon-chip.used { opacity:0.5; border-style:dashed; border-color:var(--line); }
  .coupon-info { flex:1; min-width:0; }
  .coupon-code { font-family:'DM Serif Display',serif; font-size:16px; color:var(--accent); }
  .coupon-desc { font-size:11px; color:var(--text3); margin-top:2px; }
  .coupon-badge { font-size:9px; letter-spacing:0.1em; text-transform:uppercase; padding:3px 8px; border-radius:10px; background:rgba(52,211,153,0.1); color:var(--green); border:1px solid rgba(52,211,153,0.3); white-space:nowrap; }
  .coupon-badge.used { background:rgba(92,90,87,0.1); color:var(--text3); border-color:var(--line); }
  .coupon-input-wrap { display:flex; gap:8px; margin-top:12px; }
  .coupon-input { flex:1; padding:10px 14px; background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); color:var(--text); font-size:13px; font-family:inherit; }
  .coupon-input::placeholder { color:var(--text3); }
  .coupon-input:focus { border-color:var(--accent); outline:none; }
  .coupon-apply-btn { padding:10px 16px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-size:12px; font-weight:600; font-family:inherit; transition:background 0.2s; white-space:nowrap; }
  .coupon-apply-btn:hover { background:var(--accent2); }
  .coupon-apply-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .coupon-success { font-size:11px; color:var(--green); margin-top:6px; display:flex; align-items:center; gap:4px; }
  .coupon-error { font-size:11px; color:var(--red); margin-top:6px; }

  /* Confirm Page */
  .confirm-page { max-width:500px; margin:0 auto; padding:48px 20px 40px; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .confirm-seal { font-size:56px; margin-bottom:20px; animation:sealIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes sealIn { from{transform:scale(0.3) rotate(-8deg);opacity:0;}to{transform:scale(1) rotate(0);opacity:1;} }
  .confirm-title { font-family:'DM Serif Display',serif; font-size:34px; color:var(--text); margin-bottom:8px; }
  .confirm-sub { font-size:13px; color:var(--text2); margin-bottom:32px; line-height:1.7; }
  .confirm-receipt { width:100%; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:24px; text-align:left; margin-bottom:20px; position:relative; }
  .confirm-receipt::before { content:''; position:absolute; top:0; left:24px; right:24px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .receipt-id { font-family:'DM Serif Display',serif; font-size:26px; color:var(--accent); margin-bottom:4px; }
  .receipt-meta { font-size:12px; color:var(--text3); margin-bottom:3px; }
  .receipt-datetime { font-size:11px; color:var(--text3); opacity:0.6; margin-bottom:18px; }
  .receipt-items { border-top:1px solid var(--line2); padding-top:14px; display:flex; flex-direction:column; gap:7px; }
  .receipt-row { display:flex; justify-content:space-between; font-size:13px; }
  .receipt-row .lbl { color:var(--text2); }
  .receipt-row .val { font-weight:500; color:var(--text); }
  .receipt-discount { display:flex; justify-content:space-between; font-size:13px; color:var(--green); }
  .receipt-total { display:flex; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid var(--line); }
  .receipt-total .lbl { color:var(--text3); font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; align-self:center; }
  .receipt-total .val { font-family:'DM Serif Display',serif; font-size:22px; color:var(--accent); }
  .status-track-label { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--text3); margin:18px 0 10px; font-weight:500; }
  .status-track { display:flex; gap:3px; width:100%; }
  .status-step { flex:1; padding:8px 4px; text-align:center; font-size:10px; letter-spacing:0.08em; font-weight:500; text-transform:uppercase; transition:all 0.35s; border:1px solid var(--line); border-radius:var(--r2); }
  .status-step.done { background:var(--bg3); color:var(--text3); border-color:transparent; }
  .status-step.current { background:var(--accent); color:var(--bg); border-color:transparent; }
  .status-step.pending { background:transparent; color:var(--text3); }
  .ready-banner { margin-top:18px; width:100%; background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.25); border-radius:var(--r); padding:16px 18px; display:flex; align-items:center; gap:12px; animation:fadeUp 0.4s ease; }
  .ready-banner-icon { font-size:24px; flex-shrink:0; }
  .ready-banner-title { font-family:'DM Serif Display',serif; font-size:18px; color:var(--green); margin-bottom:2px; }
  .ready-banner-sub { font-size:12px; color:var(--text2); line-height:1.5; }
  .receipt-actions { display:flex; gap:8px; width:100%; margin-top:16px; }
  .receipt-btn { flex:1; padding:11px; border:1px solid var(--line); background:transparent; color:var(--text2); border-radius:var(--r2); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px; }
  .receipt-btn:hover { border-color:var(--text2); color:var(--text); }
  .receipt-btn.primary { background:var(--accent); color:var(--bg); border-color:var(--accent); }
  .receipt-btn.primary:hover { background:var(--accent2); }
  .more-btn { padding:11px 32px; border-radius:var(--r2); border:1px solid var(--line); background:transparent; color:var(--text2); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; margin-top:8px; }
  .more-btn:hover { border-color:var(--text2); color:var(--text); }

  /* Payment Modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .modal-box { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:32px; max-width:400px; width:100%; text-align:center; animation:modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.1); position:relative; max-height:90vh; overflow-y:auto; }
  .modal-box::before { content:''; position:absolute; top:0; left:32px; right:32px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  @keyframes modalIn { from{opacity:0;transform:translateY(14px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }
  .modal-close { position:absolute; top:12px; right:12px; width:28px; height:28px; border:1px solid var(--line); background:var(--bg3); color:var(--text3); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.18s; }
  .modal-close:hover { border-color:var(--red); color:var(--red); }
  .modal-title { font-family:'DM Serif Display',serif; font-size:26px; color:var(--text); margin-bottom:8px; }
  .modal-sub { font-size:12px; color:var(--text3); margin-bottom:22px; line-height:1.6; }
  .modal-amount { font-family:'DM Serif Display',serif; font-size:42px; color:var(--accent); margin-bottom:20px; }
  .modal-discount { font-size:14px; color:var(--green); margin-bottom:10px; }
  .upi-apps { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:16px; }
  .upi-app { padding:14px 10px; border:1px solid var(--line); background:var(--bg3); border-radius:var(--r2); cursor:pointer; transition:all 0.18s; display:flex; flex-direction:column; align-items:center; gap:6px; }
  .upi-app:hover { border-color:var(--accent); background:var(--bg4); }
  .upi-app.selected { border-color:var(--accent); background:rgba(200,169,126,0.1); }
  .upi-app-icon { font-size:28px; }
  .upi-app-name { font-size:11px; color:var(--text2); font-weight:500; }
  .cash-btn { width:100%; padding:14px; background:var(--green); color:#000; border:none; border-radius:var(--r2); font-size:13px; font-weight:600; transition:all 0.2s; margin-top:8px; }
  .cash-btn:hover { opacity:0.9; }
  .cash-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .pay-btn { width:100%; padding:14px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-size:14px; font-weight:600; transition:all 0.2s; margin-top:12px; }
  .pay-btn:hover { background:var(--accent2); }
  .pay-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .qr-section { margin:16px 0; }
  .qr-code { background:#fff; padding:16px; border-radius:var(--r); display:inline-block; }
  .qr-placeholder { width:150px; height:150px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; color:#999; gap:4px; }
  .qr-amount { font-size:18px; color:var(--text); margin-top:12px; }
  .qr-amount .original { text-decoration:line-through; color:var(--text3); font-size:14px; margin-right:8px; }
  .qr-note { font-size:11px; color:var(--text3); margin-top:8px; line-height:1.6; }
  .payment-success { padding:20px 0; }
  .payment-success-icon { font-size:64px; margin-bottom:16px; }
  .payment-success-title { font-family:'DM Serif Display',serif; font-size:28px; color:var(--green); margin-bottom:8px; }

  /* QR Scanner */
  .qr-scanner-wrap { position:relative; margin:16px 0; }
  .qr-video { width:100%; max-width:280px; border-radius:var(--r); border:2px solid var(--accent); }
  .qr-overlay { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:180px; height:180px; border:3px solid var(--accent); border-radius:12px; box-shadow:0 0 0 9999px rgba(0,0,0,0.5); pointer-events:none; }
  .qr-instructions { font-size:12px; color:var(--text3); margin-top:12px; }
  .qr-error { font-size:12px; color:var(--red); margin:12px 0; }

  /* Rating Popup */
  .rating-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .rating-box { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:32px 28px; max-width:380px; width:100%; text-align:center; animation:modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.1); position:relative; }
  .rating-box::before { content:''; position:absolute; top:0; left:28px; right:28px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .rating-title { font-family:'DM Serif Display',serif; font-size:24px; color:var(--text); margin-bottom:6px; }
  .rating-sub { font-size:12px; color:var(--text3); margin-bottom:8px; line-height:1.6; }
  .rating-order-id { font-size:11px; color:var(--accent); letter-spacing:0.08em; margin-bottom:22px; }
  .rating-items { display:flex; flex-direction:column; gap:14px; margin-bottom:22px; text-align:left; }
  .rating-item { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .rating-item-name { font-size:13px; color:var(--text2); flex:1; }
  .stars { display:flex; gap:3px; }
  .star { font-size:22px; cursor:pointer; transition:transform 0.1s; line-height:1; color:var(--bg4); user-select:none; }
  .star:hover { transform:scale(1.15); }
  .star.lit { color:#f59e0b; }
  .rating-submit { width:100%; padding:12px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-size:14px; font-weight:600; transition:background 0.2s; }
  .rating-submit:hover { background:var(--accent2); color:#fff; }
  .rating-skip { width:100%; padding:9px; background:transparent; border:none; color:var(--text3); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; margin-top:8px; transition:color 0.18s; }
  .rating-skip:hover { color:var(--text2); }

  /* Table Modal */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
  .modal-box-sm { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:32px; max-width:340px; width:100%; text-align:center; position:relative; animation:modalIn 0.28s cubic-bezier(0.175,0.885,0.32,1.1); max-height:90vh; overflow-y:auto; }
  .modal-box-sm::before { content:''; position:absolute; top:0; left:32px; right:32px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .table-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-bottom:18px; }
  .table-chip { aspect-ratio:1; border:1px solid var(--line); border-radius:var(--r2); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:all 0.18s; background:var(--bg3); }
  .table-chip:hover { border-color:var(--accent); background:var(--bg4); }
  .table-chip .num { font-family:'DM Serif Display',serif; font-size:20px; color:var(--accent); }
  .table-chip .lbl { font-size:8px; letter-spacing:0.12em; text-transform:uppercase; color:var(--text3); }
  .scan-qr-btn { width:100%; padding:14px; border:1px dashed var(--accent); background:rgba(200,169,126,0.06); border-radius:var(--r2); color:var(--accent); font-size:12px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; margin-bottom:14px; cursor:pointer; }
  .scan-qr-btn:hover { background:rgba(200,169,126,0.12); }
  .modal-cancel { width:100%; padding:10px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:11px; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; }
  .modal-cancel:hover { border-color:var(--text3); color:var(--text2); }

  /* Toast */
  .toast { position:fixed; bottom:150px; left:50%; transform:translateX(-50%); background:var(--bg3); border:1px solid var(--line); color:var(--text); padding:8px 20px; border-radius:20px; font-size:11px; letter-spacing:0.08em; z-index:400; animation:toastIn 0.25s ease; pointer-events:none; white-space:nowrap; text-transform:uppercase; }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(6px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }

  /* Push Notification */
  .notification-banner { position:fixed; top:70px; left:50%; transform:translateX(-50%); background:var(--green); color:#000; padding:12px 20px; border-radius:var(--r); font-size:13px; font-weight:500; z-index:350; animation:slideDown 0.3s ease; display:flex; align-items:center; gap:10px; box-shadow:0 4px 20px rgba(52,211,153,0.3); }
  @keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-20px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
  .notification-icon { font-size:20px; }
  .notification-close { background:none; border:none; color:inherit; font-size:16px; cursor:pointer; padding:4px; margin-left:8px; opacity:0.7; }
  .notification-close:hover { opacity:1; }

  /* Admin */
  .admin-page { padding:24px 20px; max-width:1060px; margin:0 auto; }
  .admin-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; padding-bottom:22px; border-bottom:1px solid var(--line); }
  .admin-heading { font-family:'DM Serif Display',serif; font-size:30px; color:var(--text); }
  .admin-date { font-size:11px; color:var(--text3); margin-top:5px; letter-spacing:0.06em; }
  .live-pill { display:flex; align-items:center; gap:6px; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--green); font-weight:600; padding:5px 12px; border-radius:20px; border:1px solid rgba(52,211,153,0.25); background:rgba(52,211,153,0.06); }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.6s infinite; }
  .kpi-strip { display:flex; gap:10px; margin-bottom:22px; flex-wrap:wrap; }
  .kpi-card { flex:1; min-width:80px; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:16px 18px; }
  .kpi-val { font-family:'DM Serif Display',serif; font-size:30px; font-weight:300; line-height:1; margin-bottom:5px; }
  .kpi-label { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--text3); }
  .admin-tabs { display:flex; gap:4px; background:var(--bg2); border-radius:var(--r); padding:4px; width:fit-content; margin-bottom:24px; border:1px solid var(--line); }
  .admin-tab { padding:7px 18px; border-radius:var(--r2); border:none; background:transparent; color:var(--text3); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:500; transition:all 0.18s; }
  .admin-tab.on { background:var(--bg4); color:var(--text); }
  .filter-row { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
  .filter-btn { padding:6px 16px; border-radius:20px; border:1px solid var(--line); background:transparent; color:var(--text3); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; font-weight:500; transition:all 0.18s; }
  .filter-btn.on { border-color:var(--accent); background:rgba(200,169,126,0.08); color:var(--accent); }
  .orders-grid { display:grid; gap:10px; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); }
  .order-tile { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); overflow:hidden; transition:border-color 0.2s; }
  .order-tile:hover { border-color:rgba(255,255,255,0.12); }
  .tile-accent { height:2px; }
  .tile-body { padding:16px 18px; }
  .tile-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
  .tile-id { font-family:'DM Serif Display',serif; font-size:18px; color:var(--accent); }
  .tile-meta { font-size:11px; color:var(--text3); margin-top:2px; }
  .tile-user { font-size:11px; color:var(--text3); margin-top:4px; display:flex; align-items:center; gap:6px; }
  .tile-user img { width:20px; height:20px; border-radius:50%; border:1px solid var(--line); }
  .tile-table-badge { font-size:10px; letter-spacing:0.08em; text-transform:uppercase; background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); padding:3px 9px; color:var(--text2); font-weight:500; white-space:nowrap; }
  .tile-items { margin-bottom:12px; border-top:1px solid var(--line2); border-bottom:1px solid var(--line2); padding:9px 0; display:flex; flex-direction:column; gap:5px; }
  .tile-item { display:flex; justify-content:space-between; font-size:12px; }
  .tile-item .n { color:var(--text2); }
  .tile-item .q { font-weight:600; color:var(--text); font-size:11px; }
  .tile-footer { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .tile-total { font-size:12px; color:var(--text3); }
  .tile-total strong { font-family:'DM Serif Display',serif; font-size:16px; color:var(--accent); font-weight:400; }
  .tile-discount { font-size:11px; color:var(--green); margin-left:6px; }
  .status-btns { display:flex; gap:4px; }
  .status-btn { flex:1; padding:7px 4px; text-align:center; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; font-weight:500; border:1px solid var(--line); border-radius:var(--r2); background:transparent; color:var(--text3); transition:all 0.15s; }
  .status-btn:hover:not(.sb-active) { border-color:var(--text3); color:var(--text2); }
  .status-btn.sb-active-Received { background:rgba(96,165,250,0.1); border-color:rgba(96,165,250,0.4); color:var(--blue); }
  .status-btn.sb-active-Preparing { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.4); color:var(--amber); }
  .status-btn.sb-active-Ready { background:rgba(52,211,153,0.08); border-color:rgba(52,211,153,0.3); color:var(--green); }
  .mark-ready-btn { width:100%; margin-top:9px; padding:10px; background:var(--bg3); color:var(--text2); border:1px solid var(--line); border-radius:var(--r2); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:600; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.2s; }
  .mark-ready-btn:hover:not(.is-ready) { background:var(--green); color:var(--bg); border-color:transparent; }
  .mark-ready-btn.is-ready { background:rgba(52,211,153,0.08); color:var(--green); border-color:rgba(52,211,153,0.3); cursor:default; }
  .tile-actions { display:flex; gap:6px; margin-top:10px; }
  .tile-action-btn { flex:1; padding:8px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.18s; }
  .tile-action-btn:hover { border-color:var(--text3); color:var(--text2); }
  .empty-admin { text-align:center; padding:72px 20px; }
  .empty-admin-icon { font-size:36px; opacity:0.12; margin-bottom:18px; }
  .empty-admin-title { font-family:'DM Serif Display',serif; font-size:22px; color:var(--text2); margin-bottom:8px; }
  .empty-admin-text { font-size:13px; color:var(--text3); line-height:1.6; }
  .clear-btn { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; padding:4px 10px; border-radius:var(--r2); border:1px solid var(--line); background:transparent; color:var(--text3); cursor:pointer; margin-top:5px; transition:all 0.2s; }
  .clear-btn:hover { border-color:var(--text3); color:var(--text2); }
  .kitchen-mode-btn { padding:6px 14px; border:1px solid var(--accent); background:rgba(200,169,126,0.1); color:var(--accent); border-radius:var(--r2); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; display:flex; align-items:center; gap:6px; }
  .kitchen-mode-btn:hover { background:var(--accent); color:var(--bg); border-color:var(--accent); }

  /* Kitchen Display Mode */
  .kitchen-display { position:fixed; inset:0; background:var(--bg); z-index:500; padding:20px; overflow:auto; }
  .kitchen-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--line); flex-wrap:wrap; gap:12px; }
  .kitchen-title { font-family:'DM Serif Display',serif; font-size:28px; color:var(--text); }
  .kitchen-exit { padding:10px 20px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:12px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; }
  .kitchen-exit:hover { border-color:var(--red); color:var(--red); }
  .kitchen-stats { display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .kitchen-stat { flex:1; min-width:100px; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:20px; text-align:center; }
  .kitchen-stat-num { font-family:'DM Serif Display',serif; font-size:48px; line-height:1; }
  .kitchen-stat-num.blue { color:var(--blue); }
  .kitchen-stat-num.amber { color:var(--amber); }
  .kitchen-stat-num.green { color:var(--green); }
  .kitchen-stat-label { font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--text3); margin-top:8px; }
  .kitchen-orders { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
  .kitchen-card { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); overflow:hidden; animation:popIn 0.3s ease; }
  .kitchen-card.preparing { border-color:var(--amber); border-width:2px; }
  .kitchen-card.ready { border-color:var(--green); border-width:2px; }
  @keyframes popIn { from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);} }
  .kitchen-card-head { padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line2); }
  .kitchen-card-id { font-family:'DM Serif Display',serif; font-size:28px; color:var(--accent); }
  .kitchen-card-table { font-size:14px; color:var(--text2); margin-top:4px; }
  .kitchen-card-time { font-size:11px; color:var(--text3); margin-top:2px; }
  .kitchen-card-status { font-size:12px; letter-spacing:0.12em; text-transform:uppercase; padding:6px 14px; border-radius:20px; font-weight:600; }
  .kitchen-card-status.Received { background:rgba(96,165,250,0.15); color:var(--blue); }
  .kitchen-card-status.Preparing { background:rgba(245,158,11,0.15); color:var(--amber); }
  .kitchen-card-status.Ready { background:rgba(52,211,153,0.15); color:var(--green); }
  .kitchen-card-body { padding:16px 20px; }
  .kitchen-card-items { display:flex; flex-direction:column; gap:8px; }
  .kitchen-item { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--line2); }
  .kitchen-item:last-child { border-bottom:none; }
  .kitchen-item-qty { font-family:'DM Serif Display',serif; font-size:24px; color:var(--accent); min-width:40px; }
  .kitchen-item-name { font-size:16px; color:var(--text); font-weight:500; }
  .kitchen-card-total { font-size:14px; color:var(--text3); margin-top:10px; padding-top:10px; border-top:1px solid var(--line2); }
  .kitchen-card-total strong { font-family:'DM Serif Display',serif; font-size:18px; color:var(--accent); }
  .kitchen-card-actions { padding:12px 20px; background:var(--bg3); display:flex; gap:8px; }
  .kitchen-action { flex:1; padding:12px; border:1px solid var(--line); background:transparent; color:var(--text2); border-radius:var(--r2); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; font-weight:600; transition:all 0.18s; cursor:pointer; }
  .kitchen-action:hover { border-color:var(--accent); color:var(--accent); }
  .kitchen-action.preparing { background:rgba(245,158,11,0.1); color:var(--amber); border-color:var(--amber); }
  .kitchen-action.ready { background:rgba(52,211,153,0.1); color:var(--green); border-color:var(--green); }
  .kitchen-empty { text-align:center; padding:80px 20px; }
  .kitchen-empty-icon { font-size:64px; opacity:0.15; margin-bottom:20px; }
  .kitchen-empty-title { font-family:'DM Serif Display',serif; font-size:28px; color:var(--text3); }
  .kitchen-empty-sub { font-size:14px; color:var(--text3); margin-top:8px; }

  /* Analytics */
  .analytics-section-title { font-family:'DM Serif Display',serif; font-size:20px; color:var(--text); margin-bottom:16px; }
  .analytics-empty { text-align:center; padding:60px 20px; color:var(--text3); font-size:13px; }
  .analytics-list { display:flex; flex-direction:column; gap:8px; }
  .analytics-row { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:14px 18px; display:flex; align-items:center; gap:12px; }
  .analytics-rank { font-family:'DM Serif Display',serif; font-size:18px; color:var(--text3); min-width:26px; text-align:center; }
  .analytics-emoji { font-size:22px; flex-shrink:0; }
  .analytics-info { flex:1; min-width:0; }
  .analytics-name { font-size:13px; font-weight:500; color:var(--text); margin-bottom:6px; }
  .analytics-bar-wrap { height:4px; background:var(--bg4); border-radius:2px; overflow:hidden; }
  .analytics-bar { height:100%; border-radius:2px; background:var(--accent); transition:width 0.6s ease; }
  .analytics-right { text-align:right; flex-shrink:0; }
  .analytics-count { font-family:'DM Serif Display',serif; font-size:20px; color:var(--accent); line-height:1; }
  .analytics-count-label { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--text3); margin-top:2px; }
  .analytics-stars { font-size:11px; color:#f59e0b; }
  .analytics-rating-val { font-size:10px; color:var(--text3); }

  /* Users Admin Tab */
  .users-list { display:flex; flex-direction:column; gap:8px; }
  .user-card { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:14px 18px; display:flex; align-items:center; gap:12px; }
  .user-card-avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--line); flex-shrink:0; }
  .user-card-avatar-init { width:40px; height:40px; border-radius:50%; background:var(--bg4); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:600; color:var(--text2); flex-shrink:0; }
  .user-card-info { flex:1; min-width:0; }
  .user-card-name { font-size:14px; font-weight:500; color:var(--text); }
  .user-card-email { font-size:11px; color:var(--text3); margin-top:2px; }
  .user-card-stats { display:flex; gap:16px; margin-top:6px; }
  .user-card-stat { font-size:10px; color:var(--text3); }
  .user-card-stat strong { color:var(--text); }
  .user-card-role { font-size:10px; letter-spacing:0.08em; text-transform:uppercase; padding:3px 10px; border-radius:10px; border:1px solid var(--line); color:var(--text3); }
  .user-card-role.admin { border-color:rgba(200,169,126,0.35); color:var(--accent); background:rgba(200,169,126,0.08); }

  /* Print Styles */
  @media print {
    body * { visibility:hidden; }
    .print-area, .print-area * { visibility:visible; }
    .print-area { position:absolute; left:0; top:0; width:80mm; padding:10mm; background:#fff !important; color:#000 !important; }
    .print-brand { font-family:serif; font-size:22px; font-weight:bold; text-align:center; border-bottom:1px dashed #000; padding-bottom:8px; margin-bottom:12px; }
    .print-id { font-family:serif; font-size:20px; font-weight:bold; }
    .print-meta { font-size:11px; color:#666; margin:4px 0; }
    .print-items { border-top:1px dashed #000; border-bottom:1px dashed #000; padding:8px 0; margin:10px 0; }
    .print-item { display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; }
    .print-discount { color:#008000; font-size:12px; }
    .print-total { font-size:16px; font-weight:bold; display:flex; justify-content:space-between; margin-top:10px; }
    .print-footer { margin-top:20px; text-align:center; font-size:10px; color:#666; }
    .no-print { display:none !important; }
  }

  /* Animations */
  .fade-up { animation:fadeUp 0.3s ease; }
  .pop-in  { animation:popIn  0.35s cubic-bezier(0.175,0.885,0.32,1.1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
  @keyframes popIn  { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }

  @media(max-width:480px) {
    .kpi-strip { gap:8px; }
    .kpi-card  { padding:12px; }
    .kpi-val   { font-size:24px; }
    .orders-grid { grid-template-columns:1fr; }
    .nav-user  { display:none; }
    .kitchen-orders { grid-template-columns:1fr; }
    .kitchen-stats { flex-wrap:wrap; }
  }
`;

// ─── GOOGLE GIS ─────────────────────────────────────────────────────────────
function useGIS() {
  const [ready, setReady] = useState(!!window.google?.accounts);
  useEffect(() => {
    if (window.google?.accounts) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  const signIn = useCallback((onSuccess, onError) => {
    if (!window.google?.accounts?.id) { onError("Google Sign-In not loaded."); return; }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try {
          const p = JSON.parse(atob(resp.credential.split(".")[1]));
          onSuccess({ name:p.name, email:p.email, picture:p.picture });
        } catch { onError("Could not read sign-in response."); }
      },
      ux_mode: "popup",
    });
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        const el = document.getElementById("g-btn-slot");
        if (el) { el.innerHTML = ""; window.google.accounts.id.renderButton(el, { theme:"filled_black", size:"large", width:300 }); }
      }
    });
  }, []);

  return { ready, signIn };
}

// ─── QR CODE SCANNER ─────────────────────────────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream = null;
    let animId = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanLoop();
        }
      } catch {
        setError("Camera access denied. Please allow camera permission or enter table manually.");
        setScanning(false);
      }
    };

    const scanLoop = () => {
      if (!videoRef.current || !scanning) return;
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        try {
          if (window.jsQR) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              const match = code.data.match(/BISTRO:TABLE:(\d+)/) || code.data.match(/table[_\s-]*(\d+)/i) || code.data.match(/\b(\d+)\b/);
              if (match) {
                const tableNum = parseInt(match[1]);
                if (tableNum >= 1 && tableNum <= 20) { onScan(tableNum); return; }
              }
              setError("Invalid QR code. Please scan the restaurant's table QR code.");
              setScanning(false);
              return;
            }
          }
        } catch {}
      }
      animId = requestAnimationFrame(scanLoop);
    };

    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (animId) cancelAnimationFrame(animId);
    };
  }, [onScan, scanning]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box-sm" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="qr-title">
        <button className="modal-close" onClick={onClose} aria-label="Close scanner">×</button>
        <div className="modal-title" id="qr-title">Scan Table QR Code</div>
        <p className="modal-sub">Point your camera at the QR code on your table.</p>
        {error ? (
          <div className="qr-error" role="alert">{error}</div>
        ) : (
          <div className="qr-scanner-wrap">
            <video ref={videoRef} className="qr-video" playsInline muted aria-label="Camera feed for QR scanning"/>
            <div className="qr-overlay" aria-hidden="true"/>
          </div>
        )}
        <p className="qr-instructions">
          QR codes are on each table. Format: <code style={{fontSize:10,background:"var(--bg3)",padding:"2px 6px",borderRadius:3}}>BISTRO:TABLE:5</code>
        </p>
        <button className="modal-cancel" onClick={onClose}>Enter Manually Instead</button>
      </div>
    </div>
  );
}

// ─── PRINT RECEIPT ──────────────────────────────────────────────────────────
function PrintReceipt({ order }) {
  return (
    <div className="print-area" style={{ display: "none" }}>
      <div className="print-brand">🍽️ BistroSpice</div>
      <div className="print-id">{order.id}</div>
      <div className="print-meta">Table {order.table} · {fmtDateTime(order.timestamp)}</div>
      <div className="print-meta">Customer: {order.userName} · {order.userEmail}</div>
      <div className="print-items">
        {order.items.map((i, idx) => (
          <div key={idx} className="print-item">
            <span>{i.qty}× {i.name}</span>
            <span>₹{i.price * i.qty}</span>
          </div>
        ))}
      </div>
      {order.discount > 0 && (
        <div className="print-discount">Discount: -₹{order.discount}</div>
      )}
      <div className="print-total">
        <span>TOTAL</span><span>₹{order.total}</span>
      </div>
      {order.payment && (
        <div className="print-meta" style={{marginTop:8}}>
          Paid via: {order.payment.method === 'cash' ? 'Cash' : 'UPI'}
        </div>
      )}
      <div className="print-footer">Thank you for dining with us! BistroSpice — Where flavor meets tradition</div>
    </div>
  );
}

// ─── PAYMENT MODAL ──────────────────────────────────────────────────────────
function PaymentModal({ total, discount, appliedCoupon, onPaymentComplete, onClose }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [step, setStep] = useState("select");
  const [loading, setLoading] = useState(false);
  const finalAmount = total - discount;
  const upiId = "bistrospice@upi";

  const handleCash = () => {
    setLoading(true);
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onPaymentComplete("cash", null), 1500);
    }, 800);
  };

  const handleUPI = () => {
    if (!selectedApp) return;
    setStep("qr");
  };

  const handleQRPaid = () => {
    setLoading(true);
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onPaymentComplete("upi", selectedApp), 1500);
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <div className="payment-success">
            <div className="payment-success-icon">✅</div>
            <div className="payment-success-title">Payment Successful!</div>
            <p className="modal-sub">Your payment has been received.<br/>Redirecting to order confirmation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div className="modal-title">Verifying Payment...</div>
            <p className="modal-sub">Please wait while we verify your payment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="payment-title">
        <button className="modal-close" onClick={onClose} aria-label="Close payment">×</button>

        {step === "select" && (
          <>
            <div className="modal-title" id="payment-title">Choose Payment Method</div>
            <p className="modal-sub">Select how you'd like to pay</p>
            {discount > 0 && (
              <div className="modal-discount">🎉 ₹{discount} off with {appliedCoupon}</div>
            )}
            <div className="modal-amount">
              {discount > 0 && <span style={{fontSize:24,textDecoration:"line-through",color:"var(--text3)",marginRight:12}}>₹{total}</span>}
              ₹{finalAmount}
            </div>
            <div className="upi-apps" role="radiogroup" aria-label="UPI payment apps">
              {UPI_APPS.map(app => (
                <button key={app.id} className={`upi-app ${selectedApp === app.id ? "selected" : ""}`}
                  onClick={() => setSelectedApp(app.id)} role="radio" aria-checked={selectedApp === app.id}>
                  <span className="upi-app-icon">{app.icon}</span>
                  <span className="upi-app-name">{app.name}</span>
                </button>
              ))}
            </div>
            <button className="pay-btn" onClick={handleUPI} disabled={!selectedApp}>Pay with UPI</button>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0", color:"var(--text3)", fontSize:11 }}>
              <div style={{ flex:1, height:1, background:"var(--line)" }} />
              <span>OR</span>
              <div style={{ flex:1, height:1, background:"var(--line)" }} />
            </div>
            <button className="cash-btn" onClick={handleCash} disabled={loading}>💵 Pay by Cash</button>
          </>
        )}

        {step === "qr" && (
          <>
            <div className="modal-title">Scan to Pay</div>
            <p className="modal-sub">Use any UPI app to scan the QR code below</p>
            <div className="qr-section">
              <div className="qr-code">
                <div className="qr-placeholder">
                  📱
                  <span>QR Code</span>
                  <span>₹{finalAmount}</span>
                </div>
              </div>
              <div className="qr-amount">
                {discount > 0 && <span className="original">₹{total}</span>}
                ₹{finalAmount}
              </div>
              <div className="qr-note">UPI ID: {upiId}<br/>Or pay to: BistroSpice</div>
            </div>
            <button className="pay-btn" onClick={handleQRPaid} disabled={loading}>
              {loading ? "Verifying..." : "I've Paid ✓"}
            </button>
            <button className="modal-cancel" onClick={() => setStep("select")}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN (SIGN IN REQUIRED) ──────────────────────────────────────────
function AuthScreen({ onGoogle }) {
  const { ready, signIn } = useGIS();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setError("");
    setLoading(true);
    signIn(
      (user) => { setLoading(false); onGoogle(user); },
      (err) => { setLoading(false); setError(err || "Sign-in failed. Please try again."); }
    );
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="auth-brand">
          <div className="auth-brand-name">Bistro<em>Spice</em></div>
          <div className="auth-tagline">Table Ordering System</div>
        </div>

        <p className="auth-subtitle">
          Sign in to order food at your table.<br/>
          Your order history and rewards will be saved.
        </p>

        <div id="g-btn-slot" style={{ display: "flex", justifyContent: "center", minHeight: 48, marginBottom: 8 }} />

        <button
          className="google-btn"
          onClick={handleSignIn}
          disabled={!ready || loading}
        >
          {loading ? (
            <>
              <span className="auth-loader" />
              Signing in...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              {ready ? "Sign in with Google" : "Loading..."}
            </>
          )}
        </button>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <p className="auth-note">
          Your account will be recognized on return visits.<br/>
          Contact the manager if you need admin access.
        </p>
      </div>
    </div>
  );
}

// ─── TABLE MODAL ─────────────────────────────────────────────────────────────
function TableModal({ onSelect, onClose, onScanQR }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box-sm" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="table-title">
        <div className="modal-title" id="table-title">Select Table</div>
        <p className="modal-sub">Tap your table number or scan the QR code.</p>
        <button className="scan-qr-btn" onClick={onScanQR} aria-label="Scan QR code">
          📷 Scan Table QR Code
        </button>
        <div className="table-grid" role="radiogroup" aria-label="Table numbers">
          {TABLES.map(t => (
            <div key={t} className="table-chip" onClick={() => onSelect(t)}
              onKeyDown={e => e.key === "Enter" && onSelect(t)} role="radio" aria-checked="false" tabIndex={0}>
              <span className="num">{t}</span>
              <span className="lbl">Table</span>
            </div>
          ))}
        </div>
        <button className="modal-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast" role="status" aria-live="polite">{msg}</div>;
}

// ─── PUSH NOTIFICATION BANNER ─────────────────────────────────────────────────
function NotificationBanner({ message, onClose }) {
  return (
    <div className="notification-banner" role="alert" aria-live="assertive">
      <span className="notification-icon">🔔</span>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose} aria-label="Dismiss notification">×</button>
    </div>
  );
}

// ─── STAR RATING POPUP ───────────────────────────────────────────────────────
function RatingPopup({ order, onSubmit, onSkip }) {
  const [ratings, setRatings] = useState({});
  const [hovered, setHovered] = useState({});
  const setItemRating = (id, s) => setRatings(r => ({...r, [id]: s}));

  const handleSubmit = () => {
    Object.entries(ratings).forEach(([id, s]) => saveRating(+id, s));
    onSubmit();
  };

  return (
    <div className="rating-overlay" role="dialog" aria-labelledby="rating-title">
      <div className="rating-box">
        <div className="rating-title" id="rating-title">How was your meal?</div>
        <p className="rating-sub">Rate the items you ordered.</p>
        <div className="rating-order-id">{order.id} · Table {order.table}</div>
        <div className="rating-items" role="group" aria-label="Rate each item">
          {order.items.map(item => {
            const cur = ratings[item.id] || 0;
            const hov = hovered[item.id] || 0;
            const show = hov || cur;
            return (
              <div key={item.id} className="rating-item">
                <span className="rating-item-name">{item.name}</span>
                <div className="stars" role="radiogroup" aria-label={`Rate ${item.name}`}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`star ${show >= s ? "lit" : ""}`}
                      onMouseEnter={() => setHovered(h => ({...h, [item.id]: s}))}
                      onMouseLeave={() => setHovered(h => ({...h, [item.id]: 0}))}
                      onClick={() => setItemRating(item.id, s)}
                      onKeyDown={e => e.key === "Enter" && setItemRating(item.id, s)}
                      role="radio" aria-checked={show >= s}
                      aria-label={`${s} star${s !== 1 ? "s" : ""}`} tabIndex={0}>★</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button className="rating-submit" onClick={handleSubmit}>Submit Ratings</button>
        <button className="rating-skip" onClick={onSkip}>Skip</button>
      </div>
    </div>
  );
}

// ─── COUPON BANNER ───────────────────────────────────────────────────────────
function CouponBanner({ userProfile, onApplyCoupon, appliedCoupon, couponError, couponSuccess }) {
  const [input, setInput] = useState("");

  const handleApply = () => {
    if (input.trim()) {
      onApplyCoupon(input.trim().toUpperCase());
    }
  };

  if (!userProfile) return null;

  const availableCoupons = userProfile.coupons || [];
  const redeemedCoupons = userProfile.redeemedCoupons || [];

  return (
    <div className="coupon-banner fade-up">
      <div className="coupon-banner-title">🎫 Your Coupons</div>
      
      {availableCoupons.length > 0 ? (
        <div className="coupon-list">
          {availableCoupons.map(code => (
            <div key={code} className="coupon-chip">
              <div className="coupon-info">
                <div className="coupon-code">{code}</div>
                <div className="coupon-desc">
                  {code === "WELCOME10" ? "10% off on your first order" : "Discount coupon"}
                </div>
              </div>
              {appliedCoupon === code && (
                <span className="coupon-badge">Applied</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{fontSize:"12px",color:"var(--text3)",marginBottom:"12px"}}>
          No coupons available yet. Keep ordering to earn more!
        </p>
      )}

      <div className="coupon-input-wrap">
        <input
          type="text"
          className="coupon-input"
          placeholder="Enter coupon code"
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleApply()}
        />
        <button 
          className="coupon-apply-btn" 
          onClick={handleApply}
          disabled={!input.trim() || appliedCoupon}
        >
          Apply
        </button>
      </div>

      {couponSuccess && (
        <div className="coupon-success">✓ {couponSuccess}</div>
      )}
      {couponError && (
        <div className="coupon-error">{couponError}</div>
      )}
    </div>
  );
}

// ─── ORDER HISTORY VIEW ───────────────────────────────────────────────────────
function OrderHistoryView({ onReorder, onBack }) {
  const history = loadOrderHistory();

  return (
    <div className="history-page fade-up">
      <div className="history-header">
        <button className="history-back" onClick={onBack} aria-label="Back to menu">← Back</button>
        <h1 className="history-title">Your Orders</h1>
        <div style={{ width: 70 }}/>
      </div>

      {!history.length ? (
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          <p className="history-empty-text">No order history yet.<br/>Your past orders will appear here.</p>
        </div>
      ) : (
        <div className="history-list" role="list" aria-label="Order history">
          {[...history].sort((a, b) => b.timestamp - a.timestamp).map(order => (
            <div key={order.id} className="history-card" role="listitem">
              <div className="history-card-header">
                <div>
                  <div className="history-card-id">{order.id}</div>
                  <div className="history-card-meta">Table {order.table} · {fmtDateTime(order.timestamp)}</div>
                </div>
                <div className={`history-card-status ${order.status}`} aria-label={`Status: ${order.status}`}
                  style={{
                    color: order.status === "Ready" ? "var(--green)" : order.status === "Preparing" ? "var(--amber)" : "var(--blue)",
                    borderColor: order.status === "Ready" ? "rgba(52,211,153,0.35)" : order.status === "Preparing" ? "rgba(245,158,11,0.35)" : "rgba(96,165,250,0.35)",
                    background: order.status === "Ready" ? "rgba(52,211,153,0.08)" : order.status === "Preparing" ? "rgba(245,158,11,0.08)" : "rgba(96,165,250,0.08)",
                  }}>
                  {order.status}
                </div>
              </div>
              <div className="history-card-items">
                {order.items.map(item => (
                  <div key={item.id} className="history-item">
                    <span className="history-item-name">{item.name}</span>
                    <span className="history-item-qty">×{item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="history-card-footer">
                <div style={{fontSize:12,color:"var(--text3)"}}>
                  Total: <strong style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"var(--accent)",fontWeight:400}}>₹{order.total}</strong>
                  {order.discount > 0 && <span style={{color:"var(--green)",marginLeft:6}}>(-₹{order.discount})</span>}
                </div>
                <button className="history-reorder-btn" onClick={() => onReorder(order)} aria-label={`Reorder from ${order.id}`}>
                  ↻ Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMER VIEW ────────────────────────────────────────────────────────────
function CustomerView({ orders, ratings, onPlaceOrder, user }) {
  const [table, setTable]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [showQR, setShowQR]         = useState(false);
  const [cart, setCart]             = useState({});
  const [cat, setCat]               = useState("All");
  const [confirmed, setConfirmed]   = useState(null);
  const [toast, setToast]           = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [notification, setNotification] = useState(null);
  const [view, setView]             = useState("menu");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  // Load user profile on mount
  useEffect(() => {
    if (user?.email) {
      const profile = getUserProfile(user.email);
      setUserProfile(profile);
    }
  }, [user?.email]);

  const cartItems = Object.entries(cart).map(([id, qty]) => ({...MENU.find(m => m.id === +id), qty})).filter(Boolean);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal - couponDiscount;
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);

  const updateCart = (id, delta) =>
    setCart(prev => {
      const n = {...prev}, nv = (n[id] || 0) + delta;
      if (nv <= 0) delete n[id]; else n[id] = nv;
      return n;
    });

  const filtered = MENU.filter(i => cat === "All" || i.category === cat);
  const grouped = CATEGORIES.slice(1).map(c => ({c, items: filtered.filter(i => i.category === c)})).filter(g => g.items.length);
  const activeOrders = orders.filter(o => o.status !== "Ready");
  const popularItem = [...MENU].map(item => ({
    ...item, count: orders.reduce((sum, o) => {
      const ordered = o.items.find(oi => oi.id === item.id);
      return sum + (ordered ? ordered.qty : 0);
    }, 0),
  })).sort((a, b) => b.count - a.count)[0];
  const topRatedItem = MENU.map(item => {
    const rs = ratings[item.id] || [];
    return {...item, avg: rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : 0, count: rs.length};
  }).filter(i => i.count > 0).sort((a, b) => b.avg - a.avg || b.count - a.count)[0];
  const liveTimeline = [
    {key:"received", label:"Order received instantly", meta:"Orders appear on the kitchen dashboard the moment you place them."},
    {key:"preparing", label:"Kitchen updates in real time", meta:"Staff can switch an order from received to preparing to ready."},
    {key:"ready", label:"Pickup notification state", meta:"Your receipt automatically turns green when the order is marked ready."},
  ];

  // Coupons
  const COUPON_CODES = {
    "WELCOME10": { discount: 0.10, type: "percent", desc: "10% off" },
    "SAVE50": { discount: 50, type: "fixed", desc: "₹50 off" },
    "BISTRO20": { discount: 0.20, type: "percent", desc: "20% off" },
    "FLAT100": { discount: 100, type: "fixed", desc: "₹100 off" },
  };

  const handleApplyCoupon = (code) => {
    setCouponError("");
    setCouponSuccess("");

    // Check if it's in user's available coupons
    const availableCoupons = userProfile?.coupons || [];
    const redeemedCoupons = userProfile?.redeemedCoupons || [];

    if (redeemedCoupons.includes(code)) {
      setCouponError("This coupon has already been used.");
      return;
    }

    const coupon = COUPON_CODES[code];
    if (!coupon) {
      setCouponError("Invalid coupon code.");
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percent") {
      discount = Math.round(subtotal * coupon.discount);
    } else {
      discount = coupon.discount;
    }

    // Cap discount at subtotal
    discount = Math.min(discount, subtotal);

    setAppliedCoupon(code);
    setCouponDiscount(discount);
    setCouponSuccess(`🎉 ${coupon.desc} applied!`);

    // Remove from available coupons
    if (availableCoupons.includes(code)) {
      const updatedProfile = { ...userProfile };
      updatedProfile.coupons = updatedProfile.coupons.filter(c => c !== code);
      updatedProfile.redeemedCoupons = [...(updatedProfile.redeemedCoupons || []), code];
      updateUserProfile(user.email, updatedProfile);
      setUserProfile(updatedProfile);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError("");
    setCouponSuccess("");
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "🍽️" });
    }
    setNotification(`${title} ${body}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePlace = () => {
    if (!table) { setShowModal(true); return; }
    if (!cartItems.length) return;
    setShowPayment(true);
  };

  const handlePaymentComplete = (method, details) => {
    setShowPayment(false);
    const order = {
      id: genId(),
      table,
      status: "Received",
      timestamp: Date.now(),
      subtotal,
      discount: couponDiscount,
      total,
      items: cartItems.map(i => ({id: i.id, name: i.name, qty: i.qty, price: i.price})),
      payment: { method, details, amount: total },
      userName: user.name,
      userEmail: user.email,
      userPicture: user.picture,
    };

    onPlaceOrder(order);

    // Update user stats
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        ordersCount: (userProfile.ordersCount || 0) + 1,
        totalSpent: (userProfile.totalSpent || 0) + total,
        rewardPoints: (userProfile.rewardPoints || 0) + Math.floor(total / 10),
      };
      updateUserProfile(user.email, updatedProfile);
      setUserProfile(updatedProfile);

      // Give reward coupon every 5 orders
      if (updatedProfile.ordersCount % 5 === 0) {
        const rewardCoupon = "BISTRO20";
        if (!updatedProfile.coupons?.includes(rewardCoupon)) {
          updatedProfile.coupons = [...(updatedProfile.coupons || []), rewardCoupon];
          updateUserProfile(user.email, updatedProfile);
          setUserProfile(updatedProfile);
          showToast("🎁 You earned a 20% off coupon!");
        }
      }
    }

    setConfirmed(order);
    setCart({});
    setRatingDone(false);
    setShowRating(false);
    setAppliedCoupon(null);
    setCouponDiscount(0);

    const history = loadOrderHistory();
    persistOrderHistory([order, ...history]);
    showToast("Order placed successfully!");
  };

  const handleReorder = (order) => {
    const newCart = {};
    order.items.forEach(item => { newCart[item.id] = item.qty; });
    setCart(newCart);
    setTable(order.table);
    setView("menu");
    showToast("Items added to cart");
  };

  const liveOrder = confirmed ? (orders.find(o => o.id === confirmed.id) || confirmed) : null;
  const liveStatus = liveOrder?.status || "Received";
  const statusIdx = STATUS_FLOW.indexOf(liveStatus);
  const isReady = liveStatus === "Ready";

  useEffect(() => {
    if (isReady && confirmed && !ratingDone) {
      sendNotification("🍽️ Your Order is Ready!", `Order ${confirmed.id} is ready for pickup.`);
      setShowRating(true);
    }
  }, [isReady]);

  const handleRatingDone = () => { setShowRating(false); setRatingDone(true); };

  if (view === "history") {
    return <OrderHistoryView onReorder={handleReorder} onBack={() => setView("menu")}/>;
  }

  if (confirmed) {
    return (
      <div className="menu-page">
        <div className="confirm-page pop-in">
          <div className="confirm-seal" role="img" aria-label={isReady ? "Order ready" : "Order confirmed"}>
            {isReady ? "✅" : "🎉"}
          </div>
          <h2 className="confirm-title">{isReady ? "Order Ready!" : "Order Placed"}</h2>
          <p className="confirm-sub">
            {isReady ? "Your order is ready — please collect from the counter." : "Sent to the kitchen. We'll have it ready shortly."}
          </p>
          <div className="confirm-receipt" role="region" aria-label="Order receipt">
            <div className="receipt-id">{confirmed.id}</div>
            <div className="receipt-meta">Table {confirmed.table} · {confirmed.items.length} item{confirmed.items.length !== 1 ? "s" : ""}</div>
            <div className="receipt-datetime">Placed at {fmtDateTime(confirmed.timestamp)}</div>
            <div className="receipt-items">
              {confirmed.items.map(i => (
                <div key={i.id} className="receipt-row">
                  <span className="lbl">{i.name}</span>
                  <span className="val">×{i.qty} &nbsp; ₹{i.price * i.qty}</span>
                </div>
              ))}
            </div>
            {confirmed.discount > 0 && (
              <div className="receipt-discount">
                <span>Coupon ({appliedCoupon})</span>
                <span>-₹{confirmed.discount}</span>
              </div>
            )}
            <div className="receipt-total">
              <span className="lbl">Total</span>
              <span className="val">₹{confirmed.total}</span>
            </div>
            {confirmed.payment && (
              <div style={{marginTop: 10, fontSize: 11, color: "var(--text3)"}}>
                Paid via: {confirmed.payment.method === "cash" ? "💵 Cash" : "📱 UPI"}
              </div>
            )}
            <div className="status-track-label">Live Status</div>
            <div className="status-track" role="progressbar" aria-label="Order status">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={`status-step ${i < statusIdx ? "done" : i === statusIdx ? "current" : "pending"}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {isReady && (
            <div className="ready-banner" role="alert">
              <div className="ready-banner-icon">✅</div>
              <div>
                <div className="ready-banner-title">Order Fetched!</div>
                <div className="ready-banner-sub">Kitchen has marked your order ready.<br/>Please collect from the counter.</div>
              </div>
            </div>
          )}

          <div className="receipt-actions">
            <button className="receipt-btn" onClick={() => window.print()} aria-label="Print receipt">🖨️ Print</button>
            <button className="receipt-btn primary" onClick={() => setView("history")} aria-label="View order history">📋 History</button>
          </div>

          <button className="more-btn" onClick={() => {setConfirmed(null); setRatingDone(false);}}>
            Place Another Order
          </button>
        </div>
        {showRating && <RatingPopup order={confirmed} onSubmit={handleRatingDone} onSkip={handleRatingDone}/>}
        <Toast msg={toast}/>
        <PrintReceipt order={confirmed}/>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <NotificationBanner message={notification} onClose={() => setNotification(null)}/>
      )}

      <div className="menu-page fade-up">
        {table ? (
          <div className="table-hero" onClick={() => setShowModal(true)} role="button" tabIndex={0}
            aria-label={`Table ${table} selected. Click to change.`} onKeyDown={e => e.key === "Enter" && setShowModal(true)}>
            <div>
              <div className="table-hero-label">Your Table</div>
              <div className="table-hero-num">{table}</div>
              <div className="table-hero-hint">Tap to change</div>
            </div>
            <div className="table-hero-chevron" aria-hidden="true">›</div>
          </div>
        ) : (
          <div className="table-prompt" onClick={() => setShowModal(true)} role="button" tabIndex={0}
            aria-label="Select your table number" onKeyDown={e => e.key === "Enter" && setShowModal(true)}>
            <span aria-hidden="true" style={{fontSize: 18}}>🪑</span>
            <span className="table-prompt-text">Select your table number</span>
            <span className="table-prompt-cta">Select →</span>
          </div>
        )}

        <CouponBanner
          userProfile={userProfile}
          onApplyCoupon={handleApplyCoupon}
          appliedCoupon={appliedCoupon}
          couponError={couponError}
          couponSuccess={couponSuccess}
        />

        <div className="live-insights">
          <div className="insight-card">
            <div className="insight-label">Live orders</div>
            <div className="insight-value" aria-live="polite">{activeOrders.length}</div>
            <div className="insight-sub">Orders currently active across the restaurant.</div>
          </div>
          <div className="insight-card">
            <div className="insight-label">Trending dish</div>
            <div className="insight-value" role="img" aria-label={popularItem?.name || "No data"}>{popularItem?.emoji || "🍽"}</div>
            <div className="insight-sub">
              {popularItem?.count ? `${popularItem.name} ordered ${popularItem.count} time${popularItem.count !== 1 ? "s" : ""}.` : "Place the first order to see trends."}
            </div>
          </div>
        </div>

        <div className="live-panel">
          <div className="live-panel-head">
            <div className="live-panel-title">Restaurant activity</div>
            <div className="live-panel-status">Synced live</div>
          </div>
          <div className="live-panel-body">
            {orders.length ? (
              [...orders].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3).map(order => (
                <div key={order.id} className="live-order-row">
                  <div className="live-order-main">
                    <div className="live-order-id">{order.id}</div>
                    <div className="live-order-meta">
                      Table {order.table} · {order.items.reduce((s, i) => s + i.qty, 0)} item{order.items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""} · {fmtDateTime(order.timestamp)}
                    </div>
                  </div>
                  <div className={`live-order-badge ${order.status}`} aria-label={`Status: ${order.status}`}>{order.status}</div>
                </div>
              ))
            ) : (
              <div className="live-empty">No live orders yet. The activity feed updates automatically.</div>
            )}
            <div className="timeline">
              <div className="timeline-title">How the live flow works</div>
              <div className="timeline-list">
                {liveTimeline.map((step, index) => (
                  <div key={step.key} className="timeline-row">
                    <div className={`timeline-dot ${confirmed ? (index <= statusIdx ? "active" : "") : index === 0 ? "active" : ""}`} aria-hidden="true"/>
                    <div className="timeline-content">
                      <div className="timeline-label">{step.label}</div>
                      <div className="timeline-meta">{step.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="insight-card" style={{padding: "12px 14px"}}>
              <div className="insight-label">Guest favorite</div>
              <div className="insight-sub" style={{marginTop: 0}}>
                {topRatedItem ? `${topRatedItem.name} rated ${topRatedItem.avg.toFixed(1)}/5 (${topRatedItem.count} review${topRatedItem.count !== 1 ? "s" : ""}).` : "Ratings appear here after your first order."}
              </div>
            </div>
          </div>
        </div>

        <div className="cat-strip" role="tablist" aria-label="Menu categories">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-pill ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}
              role="tab" aria-selected={cat === c} aria-label={`Show ${c} items`}>{c}</button>
          ))}
        </div>

        {grouped.map(({c, items}) => (
          <div key={c} className="menu-group" role="tabpanel" aria-label={`${c} items`}>
            <div className="menu-group-label">{c}</div>
            <div className="menu-list" role="list">
              {items.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <div key={item.id} className="menu-item" role="listitem">
                    <div className="menu-item-emoji" aria-hidden="true">{item.emoji}</div>
                    <div className="menu-item-body">
                      <div className="menu-item-name">{item.name}</div>
                      <div className="menu-item-desc">{item.desc}</div>
                      <div className="menu-item-price">₹{item.price}</div>
                      {!!(ratings[item.id]?.length) && (
                        <div className="menu-item-desc" style={{marginTop: 5, whiteSpace: "normal"}}>
                          {"★".repeat(Math.round(ratings[item.id].reduce((s, v) => s + v, 0) / ratings[item.id].length || 0))}{" "}
                          {(ratings[item.id].reduce((s, v) => s + v, 0) / ratings[item.id].length).toFixed(1)} · {ratings[item.id].length} review{ratings[item.id].length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    <div className="item-ctrl">
                      {qty > 0 ? (
                        <>
                          <button className="item-btn" onClick={() => updateCart(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                          <span className="item-qty" aria-label={`${qty} in cart`}>{qty}</span>
                          <button className="item-btn" onClick={() => {updateCart(item.id, 1); showToast(`${item.name} added`);}} aria-label={`Add one more ${item.name}`}>+</button>
                        </>
                      ) : (
                        <button className="item-add" onClick={() => {updateCart(item.id, 1); showToast(`${item.name} added`);}} aria-label={`Add ${item.name} to cart`}>Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {totalQty > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-row">
            <span className="cart-bar-count"><strong>{totalQty}</strong> item{totalQty !== 1 ? "s" : ""} selected</span>
            <span className="cart-total">
              ₹{total}
              {couponDiscount > 0 && <span className="cart-discount">(-₹{couponDiscount})</span>}
            </span>
          </div>
          <button className="cart-place" onClick={handlePlace} aria-label={`Place order for ₹${total}`}>
            Place Order{table ? ` · Table ${table}` : ""}
          </button>
        </div>
      )}

      {showModal && <TableModal onSelect={t => {setTable(t); setShowModal(false);}} onClose={() => setShowModal(false)} onScanQR={() => {setShowModal(false); setShowQR(true);}}/>}
      {showQR && <QRScanner onScan={t => {setTable(t); setShowQR(false); showToast(`Table ${t} selected`);}} onClose={() => setShowQR(false)}/>}
      {showPayment && <PaymentModal total={subtotal} discount={couponDiscount} appliedCoupon={appliedCoupon} onPaymentComplete={handlePaymentComplete} onClose={() => setShowPayment(false)}/>}
      <Toast msg={toast}/>
    </>
  );
}

// ─── ANALYTICS VIEW ───────────────────────────────────────────────────────────
function AnalyticsView({ orders, ratings }) {
  const countMap = {};
  orders.forEach(o => o.items.forEach(i => { countMap[i.id] = (countMap[i.id] || 0) + i.qty; }));

  const ranked = MENU.map(item => {
    const count = countMap[item.id] || 0;
    const rs = ratings[item.id] || [];
    const avg = rs.length ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(1) : null;
    return {...item, count, avg, ratingCount: rs.length};
  }).filter(i => i.count > 0).sort((a, b) => b.count - a.count);

  const max = ranked[0]?.count || 1;

  if (!ranked.length) return <div className="analytics-empty">No orders yet. Data appears here once customers order.</div>;

  return (
    <div className="fade-up">
      <div className="analytics-section-title">Most Ordered Items</div>
      <div className="analytics-list">
        {ranked.map((item, idx) => (
          <div key={item.id} className="analytics-row">
            <div className="analytics-rank">#{idx + 1}</div>
            <div className="analytics-emoji" aria-hidden="true">{item.emoji}</div>
            <div className="analytics-info">
              <div className="analytics-name">{item.name}</div>
              <div className="analytics-bar-wrap"><div className="analytics-bar" style={{width: `${(item.count / max) * 100}%`}}/></div>
            </div>
            <div className="analytics-right">
              <div className="analytics-count">{item.count}</div>
              <div className="analytics-count-label">ordered</div>
              {item.avg && (
                <div style={{display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 3}}>
                  <span className="analytics-stars">{"★".repeat(Math.round(+item.avg))}</span>
                  <span className="analytics-rating-val">{item.avg} ({item.ratingCount})</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── USERS VIEW (Admin) ────────────────────────────────────────────────────────
function UsersView() {
  const users = Object.values(loadUsers());

  if (!users.length) {
    return (
      <div className="analytics-empty">
        No users have signed up yet.
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="analytics-section-title">Registered Users ({users.length})</div>
      <div className="users-list">
        {users.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0)).map(user => (
          <div key={user.email} className="user-card">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="user-card-avatar" referrerPolicy="no-referrer"/>
            ) : (
              <div className="user-card-avatar-init">{user.name?.[0] || "?"}</div>
            )}
            <div className="user-card-info">
              <div className="user-card-name">{user.name}</div>
              <div className="user-card-email">{user.email}</div>
              <div className="user-card-stats">
                <span className="user-card-stat"><strong>{user.ordersCount || 0}</strong> orders</span>
                <span className="user-card-stat"><strong>₹{user.totalSpent || 0}</strong> spent</span>
                <span className="user-card-stat"><strong>{user.rewardPoints || 0}</strong> points</span>
              </div>
            </div>
            <span className="user-card-role">Customer</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KITCHEN DISPLAY MODE ─────────────────────────────────────────────────────
function KitchenDisplayMode({ orders, onUpdateStatus, onClose }) {
  const activeOrders = orders.filter(o => o.status !== "Ready");
  const counts = { received: orders.filter(o => o.status === "Received").length, preparing: orders.filter(o => o.status === "Preparing").length, ready: orders.filter(o => o.status === "Ready").length };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="kitchen-display" role="region" aria-label="Kitchen Display Mode">
      <div className="kitchen-header">
        <div>
          <div className="kitchen-title">🍳 Kitchen Display</div>
          <div style={{fontSize: 11, color: "var(--text3)", marginTop: 4}}>Full screen · Press Esc to exit</div>
        </div>
        <button className="kitchen-exit" onClick={onClose} aria-label="Exit kitchen display mode">✕ Exit</button>
      </div>

      <div className="kitchen-stats">
        <div className="kitchen-stat">
          <div className="kitchen-stat-num blue">{counts.received}</div>
          <div className="kitchen-stat-label">Received</div>
        </div>
        <div className="kitchen-stat">
          <div className="kitchen-stat-num amber">{counts.preparing}</div>
          <div className="kitchen-stat-label">Preparing</div>
        </div>
        <div className="kitchen-stat">
          <div className="kitchen-stat-num green">{counts.ready}</div>
          <div className="kitchen-stat-label">Ready</div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="kitchen-empty">
          <div className="kitchen-empty-icon">🍽</div>
          <div className="kitchen-empty-title">All caught up!</div>
          <div className="kitchen-empty-sub">No active orders right now. New orders will appear here.</div>
        </div>
      ) : (
        <div className="kitchen-orders" role="list" aria-label="Active orders">
          {[...activeOrders].sort((a, b) => {
            const priority = {Received: 0, Preparing: 1};
            return (priority[a.status] ?? 2) - (priority[b.status] ?? 2) || b.timestamp - a.timestamp;
          }).map(order => (
            <div key={order.id} className={`kitchen-card ${order.status.toLowerCase()}`} role="listitem">
              <div className="kitchen-card-head">
                <div>
                  <div className="kitchen-card-id">{order.id}</div>
                  <div className="kitchen-card-table">Table {order.table}</div>
                  <div className="kitchen-card-time">{fmtDateTime(order.timestamp)}</div>
                </div>
                <div className={`kitchen-card-status ${order.status}`} aria-label={`Status: ${order.status}`}>{order.status}</div>
              </div>
              <div className="kitchen-card-body">
                <div className="kitchen-card-items">
                  {order.items.map(i => (
                    <div key={i.id} className="kitchen-item">
                      <div className="kitchen-item-qty" aria-label={`${i.qty} ordered`}>{i.qty}×</div>
                      <div className="kitchen-item-name">{i.name}</div>
                    </div>
                  ))}
                </div>
                <div className="kitchen-card-total">
                  Total: <strong>₹{order.total}</strong>
                  {order.discount > 0 && <span style={{color:"var(--green)",marginLeft:6}}>(-₹{order.discount})</span>}
                </div>
              </div>
              <div className="kitchen-card-actions">
                {order.status === "Received" && (
                  <button className="kitchen-action preparing" onClick={() => onUpdateStatus(order.id, "Preparing")} aria-label={`Start preparing ${order.id}`}>
                    🔥 Start Preparing
                  </button>
                )}
                {order.status === "Preparing" && (
                  <button className="kitchen-action ready" onClick={() => onUpdateStatus(order.id, "Ready")} aria-label={`Mark ${order.id} as ready`}>
                    ✅ Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ orders, ratings, onUpdateStatus, onClearCompleted }) {
  const [tab, setTab] = useState("orders");
  const [filter, setFilter] = useState("All");
  const [showKitchen, setShowKitchen] = useState(false);

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const counts = {
    All: orders.filter(o => o.userEmail).length,
    Received: orders.filter(o => o.status === "Received" && o.userEmail).length,
    Preparing: orders.filter(o => o.status === "Preparing" && o.userEmail).length,
    Ready: orders.filter(o => o.status === "Ready" && o.userEmail).length,
  };
  const revenue = orders.filter(o => o.userEmail).reduce((s, o) => s + o.total, 0);

  if (showKitchen) {
    return <KitchenDisplayMode orders={orders} onUpdateStatus={onUpdateStatus} onClose={() => setShowKitchen(false)}/>;
  }

  return (
    <div className="admin-page fade-up">
      <div className="admin-top">
        <div>
          <div className="admin-heading">Kitchen Dashboard</div>
          <div className="admin-date">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <div className="live-pill"><div className="live-dot"/>Live</div>
          {counts.Ready > 0 && <button className="clear-btn" onClick={onClearCompleted}>Clear completed ({counts.Ready})</button>}
        </div>
      </div>

      <div className="kpi-strip">
        {[
          {label:"Total Orders", val:counts.All, color:"var(--accent)"},
          {label:"Received", val:counts.Received, color:"var(--blue)"},
          {label:"Preparing", val:counts.Preparing, color:"var(--amber)"},
          {label:"Ready", val:counts.Ready, color:"var(--green)"},
          {label:"Revenue", val:`₹${revenue}`, color:"var(--text)"},
        ].map(({label,val,color}) => (
          <div key={label} className="kpi-card">
            <div className="kpi-val" style={{color}}>{val}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap",alignItems:"center"}}>
        <div className="admin-tabs" style={{marginBottom:0}}>
          <button className={`admin-tab ${tab === "orders" ? "on" : ""}`} onClick={() => setTab("orders")}>
            Orders{counts.All > 0 ? ` · ${counts.All}` : ""}
          </button>
          <button className={`admin-tab ${tab === "analytics" ? "on" : ""}`} onClick={() => setTab("analytics")}>
            Analytics
          </button>
          <button className={`admin-tab ${tab === "users" ? "on" : ""}`} onClick={() => setTab("users")}>
            Users
          </button>
        </div>
        <button className="kitchen-mode-btn" onClick={() => setShowKitchen(true)} aria-label="Open kitchen display mode">
          🖥️ Kitchen Display
        </button>
      </div>

      {tab === "orders" && (
        <>
          <div className="filter-row">
            {["All","Received","Preparing","Ready"].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
                {f}{counts[f] > 0 ? ` · ${counts[f]}` : ""}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-admin">
              <div className="empty-admin-icon">🍽</div>
              <div className="empty-admin-title">{filter === "All" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}</div>
              <div className="empty-admin-text">{filter === "All" ? "Customer orders appear here in real time." : ""}</div>
            </div>
          ) : (
            <div className="orders-grid">
              {[...filtered].sort((a, b) => b.timestamp - a.timestamp).map(order => (
                <div key={order.id} className="order-tile fade-up">
                  <div className="tile-accent" style={{background: STATUS_COLOR[order.status]}}/>
                  <div className="tile-body">
                    <div className="tile-top">
                      <div>
                        <div className="tile-id">{order.id}</div>
                        <div className="tile-meta">{fmtDateTime(order.timestamp)}</div>
                        {order.userName && (
                          <div className="tile-user">
                            {order.userPicture && <img src={order.userPicture} alt="" referrerPolicy="no-referrer"/>}
                            {order.userName}
                          </div>
                        )}
                      </div>
                      <div className="tile-table-badge">Table {order.table}</div>
                    </div>
                    <div className="tile-items">
                      {order.items.map(i => (
                        <div key={i.id} className="tile-item">
                          <span className="n">{i.name}</span>
                          <span className="q">×{i.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="tile-footer">
                      <div className="tile-total">
                        Total: <strong>₹{order.total}</strong>
                        {order.discount > 0 && <span className="tile-discount">(-₹{order.discount})</span>}
                      </div>
                      <div style={{fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:STATUS_COLOR[order.status],fontWeight:600,border:`1px solid ${STATUS_COLOR[order.status]}44`,padding:"2px 8px",borderRadius:20}}>
                        {order.status}
                      </div>
                    </div>
                    <div className="status-btns">
                      {STATUS_FLOW.map(s => (
                        <button key={s}
                          className={`status-btn ${order.status === s ? `sb-active-${s}` : ""}`}
                          onClick={() => onUpdateStatus(order.id, s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      className={`mark-ready-btn ${order.status === "Ready" ? "is-ready" : ""}`}
                      onClick={() => order.status !== "Ready" && onUpdateStatus(order.id, "Ready")}>
                      {order.status === "Ready" ? <>✓ Order Fetched</> : <>✓ Mark Ready & Notify</>}
                    </button>
                    <div className="tile-actions">
                      <button className="tile-action-btn" onClick={() => window.print()} aria-label={`Print receipt for ${order.id}`}>
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "analytics" && <AnalyticsView orders={orders.filter(o => o.userEmail)} ratings={ratings}/>}
      {tab === "users" && <UsersView/>}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth,    setAuth]    = useState(() => loadAuth());
  const [orders,  setOrders]  = useState([]);
  const [ratings, setRatings] = useState({});
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    return subscribeStore(({ orders, ratings }) => {
      setOrders(orders);
      setRatings(ratings);
    });
  }, []);

  const handleGoogle = (user) => {
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
    
    // Create or update user profile
    createUserProfile(user);
    
    const a = { role: isAdmin ? "admin" : "customer", ...user };
    persistAuth(a);
    setAuth(a);
  };

  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    persistAuth(null);
    setAuth(null);
  };

  const handlePlaceOrder = (o) => saveOrders([o, ...orders]);
  const handleUpdateStatus = (id, s) => saveOrders(orders.map(o => o.id === id ? {...o, status: s} : o));
  const handleClearCompleted = () => saveOrders(orders.filter(o => o.status !== "Ready"));

  const isAdmin = auth?.role === "admin";

  return (
    <>
      <style>{css}</style>

      {!auth && <AuthScreen onGoogle={handleGoogle}/>}

      {auth && (
        <div style={{minHeight:"100vh", background:"var(--bg)"}}>
          <nav className="top-nav">
            <div className="nav-brand">Bistro<em>Spice</em></div>
            <div className="nav-right">
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <span className={`nav-role ${auth.role}`}>{auth.role}</span>
              {auth.picture ? (
                <div className="nav-user">
                  <img className="nav-avatar" src={auth.picture} alt={auth.name} referrerPolicy="no-referrer"/>
                  <span className="nav-name">{auth.name}</span>
                </div>
              ) : (
                <div className="nav-user">
                  <div className="nav-avatar-init">{auth.name?.[0]}</div>
                  <span className="nav-name">{auth.name}</span>
                </div>
              )}
              <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
            </div>
          </nav>

          {isAdmin
            ? <AdminView orders={orders} ratings={ratings} onUpdateStatus={handleUpdateStatus} onClearCompleted={handleClearCompleted}/>
            : <CustomerView orders={orders} ratings={ratings} onPlaceOrder={handlePlaceOrder} user={auth}/>
          }
        </div>
      )}
    </>
  );
}

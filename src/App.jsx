import { useState, useEffect, useCallback } from "react";

const GOOGLE_CLIENT_ID = "1031994809087-ribigpmso5umf5bt4f1eofdj4vor2rk4.apps.googleusercontent.com";
const ADMIN_EMAILS = ["thestdychannelonly@gmail.com", "pythonwitharsh@gmail.com"];

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
const TABLES       = Array.from({ length:10 }, (_, i) => i + 1);

function genId() { return "ORD-" + Math.random().toString(36).slice(2,6).toUpperCase(); }

// ─── PERSISTENT STORAGE ────────────────────────────────────────────────────
// Orders stored in sessionStorage so they survive page refresh within the tab
// Auth stored in localStorage so login persists across refreshes
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

// ─── SHARED IN-MEMORY STORE (pub/sub across tabs via storage events) ───────
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
  fn({ orders:[..._orders], ratings:{..._ratings} }); // emit current state immediately
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

// Cross-tab sync — when another tab places an order, this tab picks it up
function setupCrossTabSync() {
  window.addEventListener("storage", (e) => {
    if (e.key === "bs_orders") {
      try {
        _orders = JSON.parse(e.newValue || "[]");
        _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} }));
      } catch {}
    }
    if (e.key === "bs_ratings") {
      try {
        _ratings = JSON.parse(e.newValue || "{}");
        _listeners.forEach(fn => fn({ orders:[..._orders], ratings:{..._ratings} }));
      } catch {}
    }
  });
}
setupCrossTabSync();

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  }).replace(",", " ·");
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:     #0d0d0f;
    --bg2:    #141417;
    --bg3:    #1c1c21;
    --bg4:    #242429;
    --line:   rgba(255,255,255,0.07);
    --line2:  rgba(255,255,255,0.04);
    --text:   #e8e6e3;
    --text2:  #9b9893;
    --text3:  #5c5a57;
    --accent: #c8a97e;
    --accent2:#a07850;
    --blue:   #60a5fa;
    --amber:  #f59e0b;
    --green:  #34d399;
    --red:    #f87171;
    --r:      8px;
    --r2:     4px;
  }
  html, body { background: var(--bg); color: var(--text); }
  body { font-family: 'DM Sans', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: inherit; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }

  /* ── AUTH ── */
  .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--bg); }
  .auth-card { width:100%; max-width:400px; background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:48px 40px 40px; position:relative; }
  .auth-card::before { content:''; position:absolute; top:0; left:40px; right:40px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .auth-brand { text-align:center; margin-bottom:40px; }
  .auth-brand-name { font-family:'DM Serif Display',serif; font-size:36px; color:var(--text); letter-spacing:0.02em; line-height:1; }
  .auth-brand-name em { font-style:italic; color:var(--accent); }
  .auth-tagline { font-size:11px; letter-spacing:0.18em; color:var(--text3); text-transform:uppercase; margin-top:10px; }
  .auth-cta { width:100%; padding:13px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.04em; transition:background 0.2s,transform 0.1s; margin-bottom:10px; }
  .auth-cta:hover { background:var(--accent2); }
  .auth-cta:active { transform:scale(0.99); }
  .auth-cta-sub { font-size:11px; color:var(--text3); text-align:center; }
  .auth-divider { display:flex; align-items:center; gap:14px; margin:24px 0; }
  .auth-divider::before, .auth-divider::after { content:''; flex:1; height:1px; background:var(--line); }
  .auth-divider span { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--text3); white-space:nowrap; }
  .google-btn { width:100%; padding:12px 18px; border:1px solid var(--line); background:var(--bg3); color:var(--text2); border-radius:var(--r2); font-size:13px; font-weight:400; display:flex; align-items:center; justify-content:center; gap:10px; transition:border-color 0.2s,background 0.2s; }
  .google-btn:hover:not(:disabled) { border-color:var(--accent); background:var(--bg4); color:var(--text); }
  .google-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .auth-note { font-size:11px; color:var(--text3); text-align:center; margin-top:18px; line-height:1.7; }
  .auth-error { margin-top:12px; font-size:12px; color:var(--red); background:rgba(248,113,113,0.07); padding:10px 14px; border-radius:var(--r2); border:1px solid rgba(248,113,113,0.2); text-align:center; }

  /* ── NAV ── */
  .top-nav { background:var(--bg2); border-bottom:1px solid var(--line); height:56px; padding:0 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; gap:12px; }
  .nav-brand { font-family:'DM Serif Display',serif; font-size:20px; color:var(--text); flex-shrink:0; }
  .nav-brand em { font-style:italic; color:var(--accent); }
  .nav-right { display:flex; align-items:center; gap:8px; min-width:0; }
  .nav-role { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; padding:4px 10px; border-radius:20px; border:1px solid; white-space:nowrap; flex-shrink:0; }
  .nav-role.admin { border-color:rgba(200,169,126,0.35); color:var(--accent); background:rgba(200,169,126,0.08); }
  .nav-role.customer { border-color:var(--line); color:var(--text3); }
  .nav-role.guest { border-color:var(--line); color:var(--text3); }
  .nav-user { display:flex; align-items:center; gap:7px; min-width:0; max-width:140px; }
  .nav-avatar { width:26px; height:26px; border-radius:50%; flex-shrink:0; object-fit:cover; border:1px solid var(--line); }
  .nav-avatar-init { width:26px; height:26px; border-radius:50%; flex-shrink:0; background:var(--bg4); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:var(--text2); }
  .nav-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--text2); }
  .nav-signout { padding:5px 12px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:11px; letter-spacing:0.06em; transition:all 0.18s; white-space:nowrap; flex-shrink:0; }
  .nav-signout:hover { border-color:var(--red); color:var(--red); }

  /* ── CUSTOMER MENU ── */
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
  .cart-place { width:100%; padding:13px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.04em; transition:background 0.2s,transform 0.1s; }
  .cart-place:hover { background:var(--accent2); color:#fff; }
  .cart-place:active { transform:scale(0.99); }

  /* ── CONFIRM PAGE ── */
  .confirm-page { max-width:500px; margin:0 auto; padding:48px 20px 40px; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .confirm-seal { font-size:56px; margin-bottom:20px; animation:sealIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes sealIn { from { transform:scale(0.3) rotate(-8deg); opacity:0; } to { transform:scale(1) rotate(0); opacity:1; } }
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
  .more-btn { padding:11px 32px; border-radius:var(--r2); border:1px solid var(--line); background:transparent; color:var(--text2); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; margin-top:8px; }
  .more-btn:hover { border-color:var(--text2); color:var(--text); }

  /* ── RATING POPUP ── */
  .rating-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .rating-box { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:32px 28px; max-width:380px; width:100%; text-align:center; animation:modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.1); position:relative; }
  .rating-box::before { content:''; position:absolute; top:0; left:28px; right:28px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  @keyframes modalIn { from { opacity:0; transform:translateY(14px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
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
  .rating-submit { width:100%; padding:12px; background:var(--accent); color:var(--bg); border:none; border-radius:var(--r2); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; transition:background 0.2s; }
  .rating-submit:hover { background:var(--accent2); color:#fff; }
  .rating-skip { width:100%; padding:9px; background:transparent; border:none; color:var(--text3); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; margin-top:8px; transition:color 0.18s; }
  .rating-skip:hover { color:var(--text2); }

  /* ── TABLE MODAL ── */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
  .modal-box { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:32px; max-width:340px; width:100%; text-align:center; position:relative; animation:modalIn 0.28s cubic-bezier(0.175,0.885,0.32,1.1); }
  .modal-box::before { content:''; position:absolute; top:0; left:32px; right:32px; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); }
  .modal-title { font-family:'DM Serif Display',serif; font-size:26px; color:var(--text); margin-bottom:8px; }
  .modal-sub { font-size:12px; color:var(--text3); margin-bottom:22px; line-height:1.6; }
  .table-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-bottom:18px; }
  .table-chip { aspect-ratio:1; border:1px solid var(--line); border-radius:var(--r2); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:all 0.18s; background:var(--bg3); }
  .table-chip:hover { border-color:var(--accent); background:var(--bg4); }
  .table-chip .num { font-family:'DM Serif Display',serif; font-size:20px; color:var(--accent); }
  .table-chip .lbl { font-size:8px; letter-spacing:0.12em; text-transform:uppercase; color:var(--text3); }
  .modal-cancel { width:100%; padding:10px; border:1px solid var(--line); background:transparent; color:var(--text3); border-radius:var(--r2); font-size:11px; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; }
  .modal-cancel:hover { border-color:var(--text3); color:var(--text2); }

  /* ── TOAST ── */
  .toast { position:fixed; bottom:150px; left:50%; transform:translateX(-50%); background:var(--bg3); border:1px solid var(--line); color:var(--text); padding:8px 20px; border-radius:20px; font-size:11px; letter-spacing:0.08em; z-index:300; animation:toastIn 0.25s ease; pointer-events:none; white-space:nowrap; text-transform:uppercase; }
  @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

  /* ── ADMIN ── */
  .admin-page { padding:24px 20px; max-width:1060px; margin:0 auto; }
  .admin-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; padding-bottom:22px; border-bottom:1px solid var(--line); }
  .admin-heading { font-family:'DM Serif Display',serif; font-size:30px; color:var(--text); }
  .admin-date { font-size:11px; color:var(--text3); margin-top:5px; letter-spacing:0.06em; }
  .live-pill { display:flex; align-items:center; gap:6px; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--green); font-weight:600; padding:5px 12px; border-radius:20px; border:1px solid rgba(52,211,153,0.25); background:rgba(52,211,153,0.06); }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.6s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
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
  .tile-table-badge { font-size:10px; letter-spacing:0.08em; text-transform:uppercase; background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); padding:3px 9px; color:var(--text2); font-weight:500; white-space:nowrap; }
  .tile-items { margin-bottom:12px; border-top:1px solid var(--line2); border-bottom:1px solid var(--line2); padding:9px 0; display:flex; flex-direction:column; gap:5px; }
  .tile-item { display:flex; justify-content:space-between; font-size:12px; }
  .tile-item .n { color:var(--text2); }
  .tile-item .q { font-weight:600; color:var(--text); font-size:11px; }
  .tile-footer { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .tile-total { font-size:12px; color:var(--text3); }
  .tile-total strong { font-family:'DM Serif Display',serif; font-size:16px; color:var(--accent); font-weight:400; }
  .status-btns { display:flex; gap:4px; }
  .status-btn { flex:1; padding:7px 4px; text-align:center; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; font-weight:500; border:1px solid var(--line); border-radius:var(--r2); background:transparent; color:var(--text3); transition:all 0.15s; }
  .status-btn:hover:not(.sb-active) { border-color:var(--text3); color:var(--text2); }
  .status-btn.sb-active-Received { background:rgba(96,165,250,0.1); border-color:rgba(96,165,250,0.4); color:var(--blue); }
  .status-btn.sb-active-Preparing { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.4); color:var(--amber); }
  .status-btn.sb-active-Ready { background:rgba(52,211,153,0.08); border-color:rgba(52,211,153,0.3); color:var(--green); }
  .mark-ready-btn { width:100%; margin-top:9px; padding:10px; background:var(--bg3); color:var(--text2); border:1px solid var(--line); border-radius:var(--r2); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:600; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.2s; }
  .mark-ready-btn:hover:not(.is-ready) { background:var(--green); color:var(--bg); border-color:transparent; }
  .mark-ready-btn.is-ready { background:rgba(52,211,153,0.08); color:var(--green); border-color:rgba(52,211,153,0.3); cursor:default; }
  .empty-admin { text-align:center; padding:72px 20px; }
  .empty-admin-icon { font-size:36px; opacity:0.12; margin-bottom:18px; }
  .empty-admin-title { font-family:'DM Serif Display',serif; font-size:22px; color:var(--text2); margin-bottom:8px; }
  .empty-admin-text { font-size:13px; color:var(--text3); line-height:1.6; }
  .clear-btn { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; padding:4px 10px; border-radius:var(--r2); border:1px solid var(--line); background:transparent; color:var(--text3); cursor:pointer; margin-top:5px; transition:all 0.2s; }
  .clear-btn:hover { border-color:var(--text3); color:var(--text2); }

  /* ── ANALYTICS ── */
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

  /* ── ANIMATIONS ── */
  .fade-up { animation:fadeUp 0.3s ease; }
  .pop-in  { animation:popIn  0.35s cubic-bezier(0.175,0.885,0.32,1.1); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

  @media(max-width:480px) {
    .kpi-strip { gap:8px; }
    .kpi-card  { padding:12px; }
    .kpi-val   { font-size:24px; }
    .orders-grid { grid-template-columns:1fr; }
    .nav-user  { display:none; }
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

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onGuest, onGoogle }) {
  const { ready, signIn } = useGIS();
  const [error, setError] = useState("");
  const go = () => { setError(""); signIn(onGoogle, setError); };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="auth-brand">
          <div className="auth-brand-name">Bistro<em>Spice</em></div>
          <div className="auth-tagline">Table Ordering System</div>
        </div>
        <button className="auth-cta" onClick={onGuest}>Browse Menu &amp; Order</button>
        <p className="auth-cta-sub">Continue as guest — no sign-in needed</p>
        <div className="auth-divider"><span>Or sign in</span></div>
        <div id="g-btn-slot" style={{display:"flex",justifyContent:"center",minHeight:44,marginBottom:8}} />
        <button className="google-btn" onClick={go} disabled={!ready}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          {ready ? "Sign in with Google" : "Loading…"}
        </button>
        {error && <div className="auth-error">{error}</div>}
        <p className="auth-note">Admin staff sign in with their authorised Google account.<br/>Everyone else gets the menu directly.</p>
      </div>
    </div>
  );
}

// ─── TABLE MODAL ─────────────────────────────────────────────────────────────
function TableModal({ onSelect, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Select Table</div>
        <p className="modal-sub">Tap your table number to start ordering.</p>
        <div className="table-grid">
          {TABLES.map(t=>(
            <div key={t} className="table-chip" onClick={()=>onSelect(t)}>
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
  return <div className="toast">{msg}</div>;
}

// ─── STAR RATING POPUP ───────────────────────────────────────────────────────
function RatingPopup({ order, onSubmit, onSkip }) {
  const [ratings, setRatings] = useState({});
  const [hovered, setHovered] = useState({});

  const setItemRating = (id, s) => setRatings(r=>({...r,[id]:s}));

  const handleSubmit = () => {
    Object.entries(ratings).forEach(([id, s]) => saveRating(+id, s));
    onSubmit();
  };

  return (
    <div className="rating-overlay">
      <div className="rating-box">
        <div className="rating-title">How was your meal?</div>
        <p className="rating-sub">Rate the items you ordered.</p>
        <div className="rating-order-id">{order.id} · Table {order.table}</div>
        <div className="rating-items">
          {order.items.map(item=>{
            const cur = ratings[item.id]||0;
            const hov = hovered[item.id]||0;
            const show = hov||cur;
            return (
              <div key={item.id} className="rating-item">
                <span className="rating-item-name">{item.name}</span>
                <div className="stars">
                  {[1,2,3,4,5].map(s=>(
                    <span key={s}
                      className={`star ${show>=s?"lit":""}`}
                      onMouseEnter={()=>setHovered(h=>({...h,[item.id]:s}))}
                      onMouseLeave={()=>setHovered(h=>({...h,[item.id]:0}))}
                      onClick={()=>setItemRating(item.id,s)}>★</span>
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

// ─── CUSTOMER VIEW ────────────────────────────────────────────────────────────
function CustomerView({ orders, onPlaceOrder }) {
  const [table, setTable]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [cart, setCart]             = useState({});
  const [cat, setCat]               = useState("All");
  const [confirmed, setConfirmed]   = useState(null);
  const [toast, setToast]           = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2000); };

  const cartItems = Object.entries(cart).map(([id,qty])=>({...MENU.find(m=>m.id===+id),qty})).filter(Boolean);
  const total     = cartItems.reduce((s,i)=>s+i.price*i.qty,0);
  const totalQty  = cartItems.reduce((s,i)=>s+i.qty,0);

  const updateCart = (id,delta) =>
    setCart(prev=>{
      const n={...prev}, nv=(n[id]||0)+delta;
      if(nv<=0) delete n[id]; else n[id]=nv;
      return n;
    });

  const filtered = MENU.filter(i=>cat==="All"||i.category===cat);
  const grouped  = CATEGORIES.slice(1).map(c=>({c,items:filtered.filter(i=>i.category===c)})).filter(g=>g.items.length);

  const handlePlace = () => {
    if (!table) { setShowModal(true); return; }
    if (!cartItems.length) return;
    const order = {
      id:genId(), table, status:"Received",
      timestamp:Date.now(), total,
      items:cartItems.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})),
    };
    onPlaceOrder(order);
    setConfirmed(order);
    setCart({});
    setRatingDone(false);
    setShowRating(false);
  };

  // Always read latest status from the live shared orders list
  const liveOrder  = confirmed ? (orders.find(o=>o.id===confirmed.id)||confirmed) : null;
  const liveStatus = liveOrder?.status || "Received";
  const statusIdx  = STATUS_FLOW.indexOf(liveStatus);
  const isReady    = liveStatus === "Ready";

  // Trigger rating popup once when order becomes Ready
  useEffect(()=>{
    if (isReady && confirmed && !ratingDone && !showRating) setShowRating(true);
  },[isReady]);

  const handleRatingDone = () => { setShowRating(false); setRatingDone(true); };

  if (confirmed) {
    return (
      <div className="menu-page">
        <div className="confirm-page pop-in">
          <div className="confirm-seal">{isReady?"✅":"🎉"}</div>
          <h2 className="confirm-title">{isReady?"Order Ready!":"Order Placed"}</h2>
          <p className="confirm-sub">
            {isReady
              ? "Your order is ready — please collect from the counter."
              : "Sent to the kitchen. We'll have it ready shortly."}
          </p>
          <div className="confirm-receipt">
            <div className="receipt-id">{confirmed.id}</div>
            <div className="receipt-meta">Table {confirmed.table} · {confirmed.items.length} item{confirmed.items.length!==1?"s":""}</div>
            <div className="receipt-datetime">Placed at {fmtDateTime(confirmed.timestamp)}</div>
            <div className="receipt-items">
              {confirmed.items.map(i=>(
                <div key={i.id} className="receipt-row">
                  <span className="lbl">{i.name}</span>
                  <span className="val">×{i.qty} &nbsp; ₹{i.price*i.qty}</span>
                </div>
              ))}
            </div>
            <div className="receipt-total">
              <span className="lbl">Total</span>
              <span className="val">₹{confirmed.total}</span>
            </div>
            <div className="status-track-label">Live Status</div>
            <div className="status-track">
              {STATUS_FLOW.map((s,i)=>(
                <div key={s} className={`status-step ${i<statusIdx?"done":i===statusIdx?"current":"pending"}`}>{s}</div>
              ))}
            </div>
          </div>
          {isReady && (
            <div className="ready-banner">
              <div className="ready-banner-icon">✅</div>
              <div>
                <div className="ready-banner-title">Order Fetched!</div>
                <div className="ready-banner-sub">Kitchen has marked your order ready.<br/>Please collect from the counter.</div>
              </div>
            </div>
          )}
          <button className="more-btn" onClick={()=>{setConfirmed(null);setTable(null);setRatingDone(false);}}>
            Place Another Order
          </button>
        </div>
        {showRating && <RatingPopup order={confirmed} onSubmit={handleRatingDone} onSkip={handleRatingDone}/>}
        <Toast msg={toast}/>
      </div>
    );
  }

  return (
    <>
      <div className="menu-page fade-up">
        {table ? (
          <div className="table-hero" onClick={()=>setShowModal(true)}>
            <div>
              <div className="table-hero-label">Your Table</div>
              <div className="table-hero-num">{table}</div>
              <div className="table-hero-hint">Tap to change</div>
            </div>
            <div className="table-hero-chevron">›</div>
          </div>
        ) : (
          <div className="table-prompt" onClick={()=>setShowModal(true)}>
            <span style={{fontSize:18}}>🪑</span>
            <span className="table-prompt-text">Select your table number</span>
            <span className="table-prompt-cta">Select →</span>
          </div>
        )}
        <div className="cat-strip">
          {CATEGORIES.map(c=>(
            <button key={c} className={`cat-pill ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</button>
          ))}
        </div>
        {grouped.map(({c,items})=>(
          <div key={c} className="menu-group">
            <div className="menu-group-label">{c}</div>
            <div className="menu-list">
              {items.map(item=>{
                const qty=cart[item.id]||0;
                return (
                  <div key={item.id} className="menu-item">
                    <div className="menu-item-emoji">{item.emoji}</div>
                    <div className="menu-item-body">
                      <div className="menu-item-name">{item.name}</div>
                      <div className="menu-item-desc">{item.desc}</div>
                      <div className="menu-item-price">₹{item.price}</div>
                    </div>
                    <div className="item-ctrl">
                      {qty>0 ? (
                        <>
                          <button className="item-btn" onClick={()=>updateCart(item.id,-1)}>−</button>
                          <span className="item-qty">{qty}</span>
                          <button className="item-btn" onClick={()=>{updateCart(item.id,1);showToast(`${item.name} added`);}}>+</button>
                        </>
                      ) : (
                        <button className="item-add" onClick={()=>{updateCart(item.id,1);showToast(`${item.name} added`);}}>Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {totalQty>0 && (
        <div className="cart-bar">
          <div className="cart-bar-row">
            <span className="cart-bar-count"><strong>{totalQty}</strong> item{totalQty!==1?"s":""} selected</span>
            <span className="cart-total">₹{total}</span>
          </div>
          <button className="cart-place" onClick={handlePlace}>
            Place Order{table?` · Table ${table}`:""}
          </button>
        </div>
      )}
      {showModal && <TableModal onSelect={t=>{setTable(t);setShowModal(false);}} onClose={()=>setShowModal(false)}/>}
      <Toast msg={toast}/>
    </>
  );
}

// ─── ANALYTICS VIEW ───────────────────────────────────────────────────────────
function AnalyticsView({ orders, ratings }) {
  const countMap = {};
  orders.forEach(o=>o.items.forEach(i=>{ countMap[i.id]=(countMap[i.id]||0)+i.qty; }));

  const ranked = MENU
    .map(item=>{
      const count = countMap[item.id]||0;
      const rs    = ratings[item.id]||[];
      const avg   = rs.length ? (rs.reduce((s,r)=>s+r,0)/rs.length).toFixed(1) : null;
      return {...item,count,avg,ratingCount:rs.length};
    })
    .filter(i=>i.count>0)
    .sort((a,b)=>b.count-a.count);

  const max = ranked[0]?.count||1;

  if (!ranked.length) return (
    <div className="analytics-empty">No orders yet. Data appears here once customers order.</div>
  );

  return (
    <div className="fade-up">
      <div className="analytics-section-title">Most Ordered Items</div>
      <div className="analytics-list">
        {ranked.map((item,idx)=>(
          <div key={item.id} className="analytics-row">
            <div className="analytics-rank">#{idx+1}</div>
            <div className="analytics-emoji">{item.emoji}</div>
            <div className="analytics-info">
              <div className="analytics-name">{item.name}</div>
              <div className="analytics-bar-wrap">
                <div className="analytics-bar" style={{width:`${(item.count/max)*100}%`}}/>
              </div>
            </div>
            <div className="analytics-right">
              <div className="analytics-count">{item.count}</div>
              <div className="analytics-count-label">ordered</div>
              {item.avg && (
                <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",marginTop:3}}>
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

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ orders, ratings, onUpdateStatus, onClearCompleted }) {
  const [tab, setTab]       = useState("orders");
  const [filter, setFilter] = useState("All");

  const filtered = filter==="All" ? orders : orders.filter(o=>o.status===filter);
  const counts = {
    All:      orders.length,
    Received: orders.filter(o=>o.status==="Received").length,
    Preparing:orders.filter(o=>o.status==="Preparing").length,
    Ready:    orders.filter(o=>o.status==="Ready").length,
  };
  const revenue = orders.reduce((s,o)=>s+o.total,0);

  return (
    <div className="admin-page fade-up">
      <div className="admin-top">
        <div>
          <div className="admin-heading">Kitchen Dashboard</div>
          <div className="admin-date">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <div className="live-pill"><div className="live-dot"/>Live</div>
          {counts.Ready>0&&<button className="clear-btn" onClick={onClearCompleted}>Clear completed ({counts.Ready})</button>}
        </div>
      </div>

      <div className="kpi-strip">
        {[
          {label:"Total",    val:counts.All,       color:"var(--accent)"},
          {label:"Received", val:counts.Received,  color:"var(--blue)"},
          {label:"Preparing",val:counts.Preparing, color:"var(--amber)"},
          {label:"Ready",    val:counts.Ready,     color:"var(--green)"},
          {label:"Revenue",  val:`₹${revenue}`,    color:"var(--text)"},
        ].map(({label,val,color})=>(
          <div key={label} className="kpi-card">
            <div className="kpi-val" style={{color}}>{val}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab==="orders"?"on":""}`} onClick={()=>setTab("orders")}>
          Live Orders{counts.All>0?` · ${counts.All}`:""}
        </button>
        <button className={`admin-tab ${tab==="analytics"?"on":""}`} onClick={()=>setTab("analytics")}>
          Analytics
        </button>
      </div>

      {tab==="orders" && (
        <>
          <div className="filter-row">
            {["All","Received","Preparing","Ready"].map(f=>(
              <button key={f} className={`filter-btn ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>
                {f}{counts[f]>0?` · ${counts[f]}`:""}
              </button>
            ))}
          </div>
          {filtered.length===0 ? (
            <div className="empty-admin">
              <div className="empty-admin-icon">🍽</div>
              <div className="empty-admin-title">{filter==="All"?"No orders yet":`No ${filter.toLowerCase()} orders`}</div>
              <div className="empty-admin-text">{filter==="All"?"Customer orders appear here in real time.":""}</div>
            </div>
          ) : (
            <div className="orders-grid">
              {[...filtered].sort((a,b)=>b.timestamp-a.timestamp).map(order=>(
                <div key={order.id} className="order-tile fade-up">
                  <div className="tile-accent" style={{background:STATUS_COLOR[order.status]}}/>
                  <div className="tile-body">
                    <div className="tile-top">
                      <div>
                        <div className="tile-id">{order.id}</div>
                        <div className="tile-meta">{fmtDateTime(order.timestamp)}</div>
                      </div>
                      <div className="tile-table-badge">Table {order.table}</div>
                    </div>
                    <div className="tile-items">
                      {order.items.map(i=>(
                        <div key={i.id} className="tile-item">
                          <span className="n">{i.name}</span>
                          <span className="q">×{i.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="tile-footer">
                      <div className="tile-total">Total: <strong>₹{order.total}</strong></div>
                      <div style={{fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:STATUS_COLOR[order.status],fontWeight:600,border:`1px solid ${STATUS_COLOR[order.status]}44`,padding:"2px 8px",borderRadius:20}}>
                        {order.status}
                      </div>
                    </div>
                    <div className="status-btns">
                      {STATUS_FLOW.map(s=>(
                        <button key={s}
                          className={`status-btn ${order.status===s?`sb-active-${s}`:""}`}
                          onClick={()=>onUpdateStatus(order.id,s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      className={`mark-ready-btn ${order.status==="Ready"?"is-ready":""}`}
                      onClick={()=>order.status!=="Ready"&&onUpdateStatus(order.id,"Ready")}
                    >
                      {order.status==="Ready" ? <>✓ Order Fetched</> : <>✓ Mark Ready &amp; Notify</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab==="analytics" && <AnalyticsView orders={orders} ratings={ratings}/>}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Restore auth from localStorage on page load — this fixes the refresh logout issue
  const [auth,    setAuth]    = useState(() => loadAuth());
  const [orders,  setOrders]  = useState([]);
  const [ratings, setRatings] = useState({});

  // Subscribe to shared store (works across tabs via storage events)
  useEffect(() => {
    return subscribeStore(({ orders, ratings }) => {
      setOrders(orders);
      setRatings(ratings);
    });
  }, []);

  const handleGuest = () => {
    const a = { role:"guest", name:"Guest", email:null, picture:null };
    persistAuth(a);
    setAuth(a);
  };

  const handleGoogle = (user) => {
    const isAdmin = ADMIN_EMAILS.map(e=>e.toLowerCase()).includes(user.email.toLowerCase());
    const a = { role: isAdmin ? "admin" : "customer", ...user };
    persistAuth(a);
    setAuth(a);
  };

  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    persistAuth(null);
    setAuth(null);
  };

  const handlePlaceOrder     = (o)    => saveOrders([o,...orders]);
  const handleUpdateStatus   = (id,s) => saveOrders(orders.map(o=>o.id===id?{...o,status:s}:o));
  const handleClearCompleted = ()     => saveOrders(orders.filter(o=>o.status!=="Ready"));

  const isAdmin = auth?.role === "admin";

  return (
    <>
      <style>{css}</style>

      {!auth && <AuthScreen onGuest={handleGuest} onGoogle={handleGoogle}/>}

      {auth && (
        <div style={{minHeight:"100vh",background:"var(--bg)"}}>
          <nav className="top-nav">
            <div className="nav-brand">Bistro<em>Spice</em></div>
            <div className="nav-right">
              <span className={`nav-role ${auth.role}`}>{auth.role}</span>
              {auth.picture ? (
                <div className="nav-user">
                  <img className="nav-avatar" src={auth.picture} alt={auth.name} referrerPolicy="no-referrer"/>
                  <span className="nav-name">{auth.name}</span>
                </div>
              ) : auth.name && auth.name!=="Guest" ? (
                <div className="nav-user">
                  <div className="nav-avatar-init">{auth.name[0]}</div>
                  <span className="nav-name">{auth.name}</span>
                </div>
              ) : null}
              <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
            </div>
          </nav>

          {isAdmin
            ? <AdminView orders={orders} ratings={ratings} onUpdateStatus={handleUpdateStatus} onClearCompleted={handleClearCompleted}/>
            : <CustomerView orders={orders} onPlaceOrder={handlePlaceOrder}/>
          }
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Replace with your Google OAuth Client ID from console.cloud.google.com

const GOOGLE_CLIENT_ID = "1031994809087-ribigpmso5umf5bt4f1eofdj4vor2rk4.apps.googleusercontent.com";

// Add your restaurant staff/admin emails here
const ADMIN_EMAILS = ["thestdychannelonly@gmail.com", "pythonwitharsh@gmail.com"];

// ─── MENU DATA ─────────────────────────────────────────────────────────────
const MENU = [
  { id: 1,  category: "Starters",  name: "Paneer Tikka",         price: 220, emoji: "🧀", desc: "Marinated cottage cheese, tandoor-grilled" },
  { id: 2,  category: "Starters",  name: "Veg Spring Rolls",     price: 160, emoji: "🥢", desc: "Crispy rolls with mixed veggies" },
  { id: 3,  category: "Starters",  name: "Chicken Wings",        price: 280, emoji: "🍗", desc: "Spiced, smoky, served with dip" },
  { id: 4,  category: "Mains",     name: "Dal Makhani",          price: 240, emoji: "🍲", desc: "Slow-cooked black lentils, butter & cream" },
  { id: 5,  category: "Mains",     name: "Butter Chicken",       price: 320, emoji: "🍛", desc: "Classic tomato-cream curry" },
  { id: 6,  category: "Mains",     name: "Paneer Butter Masala", price: 290, emoji: "🫕", desc: "Cottage cheese in rich gravy" },
  { id: 7,  category: "Mains",     name: "Chicken Biryani",      price: 360, emoji: "🍚", desc: "Fragrant basmati, slow-dum cooked" },
  { id: 8,  category: "Breads",    name: "Butter Naan",          price: 50,  emoji: "🫓", desc: "Soft tandoor-baked bread" },
  { id: 9,  category: "Breads",    name: "Garlic Roti",          price: 45,  emoji: "🥙", desc: "Whole wheat, garlic butter" },
  { id: 10, category: "Breads",    name: "Paratha",              price: 60,  emoji: "🥞", desc: "Layered, flaky whole wheat" },
  { id: 11, category: "Drinks",    name: "Mango Lassi",          price: 90,  emoji: "🥭", desc: "Thick, sweet, chilled" },
  { id: 12, category: "Drinks",    name: "Masala Chai",          price: 40,  emoji: "☕", desc: "Spiced milk tea" },
  { id: 13, category: "Drinks",    name: "Fresh Lime Soda",      price: 70,  emoji: "🍋", desc: "Sweet or salted, your choice" },
  { id: 14, category: "Desserts",  name: "Gulab Jamun",          price: 80,  emoji: "🟤", desc: "Warm, syrup-soaked dumplings" },
  { id: 15, category: "Desserts",  name: "Kulfi",                price: 100, emoji: "🍦", desc: "Traditional Indian ice cream" },
];

const CATEGORIES  = ["All", ...Array.from(new Set(MENU.map(i => i.category)))];
const STATUS_FLOW = ["Received", "Preparing", "Ready"];
const STATUS_ICON = { Received: "📋", Preparing: "👨‍🍳", Ready: "✅" };
const TABLES      = Array.from({ length: 10 }, (_, i) => i + 1);

function genOrderId() {
  return "ORD-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ─── IN-MEMORY ORDERS STORE (pub/sub) ──────────────────────────────────────
let _orders = [];
let _listeners = [];
function getOrders() { return [..._orders]; }
function saveOrders(o) { _orders = [...o]; _listeners.forEach(fn => fn([..._orders])); }
function subscribeOrders(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0e0c; --surface: #1a1916; --surface2: #252320; --border: #2e2c28;
    --accent: #f5a623; --accent2: #e8834a; --text: #f0ede8; --text2: #9a958c;
    --green: #22c55e; --blue: #3b82f6; --red: #ef4444; --r: 12px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* AUTH */
  .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,166,35,.1) 0%, transparent 65%), var(--bg); }
  .auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px 32px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 40px 80px rgba(0,0,0,.5); }
  .auth-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 30px; color: var(--accent); letter-spacing: -1px; margin-bottom: 6px; }
  .auth-logo span { color: var(--text); }
  .auth-tagline { font-size: 14px; color: var(--text2); margin-bottom: 32px; line-height: 1.6; }
  .guest-btn { width: 100%; padding: 14px; border-radius: var(--r); border: none; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #0f0e0c; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; transition: opacity .15s; margin-bottom: 10px; }
  .guest-btn:hover { opacity: .88; }
  .auth-hint { font-size: 12px; color: var(--text2); margin-bottom: 0; }
  .auth-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .auth-divider span { font-size: 12px; color: var(--text2); white-space: nowrap; font-weight: 500; }
  .google-btn { width: 100%; padding: 13px 20px; border-radius: var(--r); border: 1.5px solid var(--border); background: var(--surface2); color: var(--text); font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all .2s; }
  .google-btn:hover:not(:disabled) { border-color: var(--accent); background: rgba(245,166,35,.06); }
  .google-btn:disabled { opacity: .5; cursor: not-allowed; }
  .auth-note { font-size: 12px; color: var(--text2); margin-top: 18px; line-height: 1.6; }
  .error-box { margin-top: 12px; font-size: 13px; color: var(--red); background: rgba(239,68,68,.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(239,68,68,.2); }

  /* NOT-AUTH */
  .notauth-card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; }
  .admin-list { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; margin: 16px 0 24px; text-align: left; font-size: 13px; color: var(--text2); }
  .admin-list-title { font-weight: 600; color: var(--text); margin-bottom: 6px; font-size: 13px; }

  /* TOP NAV */
  .top-nav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 16px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 100; gap: 10px; }
  .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: var(--accent); letter-spacing: -.5px; flex-shrink: 0; }
  .logo span { color: var(--text); }
  .nav-right { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .role-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .role-admin { background: rgba(245,166,35,.15); color: var(--accent); border: 1px solid rgba(245,166,35,.3); }
  .role-guest { background: rgba(59,130,246,.12); color: var(--blue); border: 1px solid rgba(59,130,246,.25); }
  .user-chip { display: flex; align-items: center; gap: 7px; padding: 4px 10px 4px 4px; border-radius: 20px; background: var(--surface2); border: 1px solid var(--border); font-size: 13px; color: var(--text2); min-width: 0; max-width: 160px; }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
  .user-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sign-out-btn { padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; font-weight: 600; transition: all .18s; white-space: nowrap; flex-shrink: 0; }
  .sign-out-btn:hover { border-color: var(--red); color: var(--red); }

  /* CUSTOMER */
  .menu-page { max-width: 480px; margin: 0 auto; padding-bottom: 140px; }
  .table-banner { margin: 16px 16px 0; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: var(--r); padding: 14px 18px; display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .tnum { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #0f0e0c; line-height: 1; }
  .tlabel { font-size: 12px; color: rgba(0,0,0,.55); font-weight: 500; }
  .table-select { padding: 12px 16px; margin: 12px 16px 0; background: var(--surface); border: 1.5px dashed var(--border); border-radius: var(--r); display: flex; align-items: center; gap: 10px; cursor: pointer; transition: border-color .2s; }
  .table-select:hover { border-color: var(--accent); }
  .cat-scroll { display: flex; gap: 8px; padding: 16px 16px 0; overflow-x: auto; scrollbar-width: none; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-btn { white-space: nowrap; padding: 7px 16px; border-radius: 20px; border: 1.5px solid var(--border); background: transparent; color: var(--text2); font-size: 13px; font-weight: 500; transition: all .2s; flex-shrink: 0; }
  .cat-btn.active { background: var(--accent); border-color: var(--accent); color: #0f0e0c; font-weight: 700; }
  .menu-section { padding: 20px 16px 0; }
  .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: var(--text2); text-transform: uppercase; margin-bottom: 12px; }
  .menu-grid { display: flex; flex-direction: column; gap: 8px; }
  .menu-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; display: flex; gap: 12px; align-items: center; transition: border-color .2s; }
  .menu-card:hover { border-color: rgba(245,166,35,.4); }
  .item-emoji { font-size: 32px; flex-shrink: 0; width: 44px; text-align: center; }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-size: 15px; font-weight: 600; }
  .item-desc { font-size: 12px; color: var(--text2); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-price { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--accent); margin-top: 4px; }
  .item-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--surface2); color: var(--text); font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .qty-btn:hover { border-color: var(--accent); color: var(--accent); }
  .qty-num { font-weight: 700; font-size: 15px; min-width: 20px; text-align: center; }
  .add-btn { padding: 6px 16px; border-radius: 20px; border: none; background: var(--accent); color: #0f0e0c; font-size: 13px; font-weight: 700; transition: opacity .15s; }
  .add-btn:hover { opacity: .85; }
  .cart-footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); background: var(--surface); border-top: 1px solid var(--border); padding: 12px 16px 24px; width: 100%; max-width: 480px; z-index: 50; }
  .cart-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cart-count { font-size: 13px; color: var(--text2); }
  .cart-count span { color: var(--accent); font-weight: 700; }
  .cart-total { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; }
  .place-order-btn { width: 100%; padding: 14px; border-radius: var(--r); border: none; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #0f0e0c; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; transition: opacity .15s; }
  .place-order-btn:hover { opacity: .9; }

  /* CONFIRM */
  .confirm-page { max-width: 480px; margin: 0 auto; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .confirm-icon { font-size: 72px; margin-bottom: 20px; animation: pop .4s cubic-bezier(.175,.885,.32,1.275); }
  @keyframes pop { from { transform: scale(.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .confirm-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .confirm-sub { color: var(--text2); margin-bottom: 32px; font-size: 15px; line-height: 1.5; }
  .order-card { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 20px; }
  .order-id-big { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
  .order-meta { font-size: 13px; color: var(--text2); margin-bottom: 16px; }
  .order-items-list { border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 14px; }
  .status-track-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text2); margin: 16px 0 10px; font-weight: 700; }
  .status-track { display: flex; gap: 4px; }
  .status-step { flex: 1; padding: 8px 4px; border-radius: 8px; text-align: center; font-size: 11px; font-weight: 600; transition: all .3s; }
  .status-step.done    { background: var(--surface2); color: var(--text2); }
  .status-step.current { background: var(--accent); color: #0f0e0c; }
  .status-step.pending { background: var(--surface); color: var(--text2); border: 1px dashed var(--border); }
  .new-order-btn { padding: 12px 28px; border-radius: var(--r); border: 1.5px solid var(--border); background: transparent; color: var(--text); font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; transition: all .2s; }
  .new-order-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ADMIN */
  .admin-page { padding: 20px; max-width: 1000px; margin: 0 auto; }
  .admin-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
  .admin-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
  .admin-stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px 18px; flex: 1; min-width: 80px; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; }
  .stat-label { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .live-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--green); font-weight: 600; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
  .filter-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .filter-tab { padding: 6px 16px; border-radius: 20px; border: 1.5px solid var(--border); background: transparent; color: var(--text2); font-size: 13px; font-weight: 500; transition: all .2s; }
  .filter-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(245,166,35,.08); }
  .orders-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .order-tile { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; position: relative; overflow: hidden; }
  .order-tile::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .order-tile[data-status="Received"]::before  { background: #f59e0b; }
  .order-tile[data-status="Preparing"]::before { background: #3b82f6; }
  .order-tile[data-status="Ready"]::before     { background: #10b981; }
  .tile-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .tile-id   { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--accent); }
  .tile-time { font-size: 11px; color: var(--text2); margin-top: 2px; }
  .tile-table { font-size: 12px; background: var(--surface2); border-radius: 6px; padding: 4px 10px; font-weight: 600; }
  .tile-items { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
  .tile-item { display: flex; justify-content: space-between; font-size: 13px; }
  .tile-item .n { color: var(--text2); } .tile-item .q { font-weight: 700; }
  .tile-total { font-size: 13px; font-weight: 700; color: var(--text2); margin-bottom: 12px; }
  .tile-total span { color: var(--accent); }
  .status-btns { display: flex; gap: 6px; }
  .status-btn { flex: 1; padding: 7px 4px; border-radius: 8px; border: 1.5px solid transparent; font-size: 12px; font-weight: 700; transition: all .15s; background: var(--surface2); color: var(--text2); }
  .status-btn.current[data-s="Received"]  { background: #f59e0b; border-color: #f59e0b; color: #0f0e0c; }
  .status-btn.current[data-s="Preparing"] { background: #3b82f6; border-color: #3b82f6; color: #fff; }
  .status-btn.current[data-s="Ready"]     { background: #10b981; border-color: #10b981; color: #fff; }
  .status-btn:hover:not(.current) { border-color: var(--text2); color: var(--text); }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--text2); }
  .empty-icon  { font-size: 48px; margin-bottom: 16px; opacity: .5; }
  .clear-btn { font-size: 11px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; margin-top: 6px; transition: all .2s; }
  .clear-btn:hover { border-color: var(--text); color: var(--text); }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px; max-width: 360px; width: 100%; text-align: center; }
  .modal h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
  .modal p  { font-size: 14px; color: var(--text2); margin-bottom: 20px; line-height: 1.5; }
  .qr-grid  { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
  .qr-tile  { aspect-ratio: 1; background: var(--surface2); border: 1.5px solid var(--border); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; }
  .qr-tile:hover { border-color: var(--accent); background: rgba(245,166,35,.08); }
  .qr-tile .tnum { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--accent); }
  .qr-tile .tlabel { font-size: 10px; color: var(--text2); }
  .modal-close { width: 100%; padding: 12px; border-radius: var(--r); border: 1.5px solid var(--border); background: transparent; color: var(--text2); font-size: 14px; font-weight: 600; transition: all .2s; }
  .modal-close:hover { border-color: var(--text); color: var(--text); }

  /* TOAST */
  .toast { position: fixed; bottom: 150px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #fff; padding: 9px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 300; animation: toastIn .25s ease; pointer-events: none; white-space: nowrap; }
  @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }

  .fade-in  { animation: fadeIn  .3s ease; }
  .slide-up { animation: slideUp .35s cubic-bezier(.175,.885,.32,1.1); }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }

  @media (max-width: 480px) {
    .admin-stats { gap: 8px; }
    .stat-card { padding: 10px 12px; }
    .stat-num { font-size: 20px; }
    .user-chip { display: none; }
  }
`;

// ─── GOOGLE GIS HOOK ────────────────────────────────────────────────────────
function useGIS() {
  const [ready, setReady] = useState(!!window.google?.accounts);

  useEffect(() => {
    if (window.google?.accounts) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  const signIn = useCallback((onSuccess, onError) => {
    if (!window.google?.accounts?.id) { onError("Google Sign-In SDK not loaded."); return; }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try {
          const p = JSON.parse(atob(resp.credential.split(".")[1]));
          onSuccess({ name: p.name, email: p.email, picture: p.picture });
        } catch { onError("Could not parse sign-in response."); }
      },
      ux_mode: "popup",
    });
    // Try One Tap first, fall back to button click
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        const el = document.getElementById("g-btn-container");
        if (el) {
          el.innerHTML = "";
          window.google.accounts.id.renderButton(el, {
            theme: "filled_black", size: "large", text: "continue_with", shape: "rectangular", width: 320,
          });
        }
      }
    });
  }, []);

  return { ready, signIn };
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────────────
function AuthScreen({ onGuest, onGoogle }) {
  const { ready, signIn } = useGIS();
  const [error, setError] = useState("");

  const handleGoogle = () => {
    setError("");
    signIn(
      (user) => onGoogle(user),
      (msg)  => setError(msg)
    );
  };

  return (
    <div className="auth-screen">
      <div className="auth-card fade-in">
        <div className="auth-logo">Bistro<span>Spice</span></div>
        <p className="auth-tagline">Fast table ordering for dine-in restaurants.<br />No waiting, no confusion.</p>

        <button className="guest-btn" onClick={onGuest}>🍽 Browse Menu &amp; Order</button>
        <p className="auth-hint">Customers — tap above. No sign-in needed.</p>

        <div className="auth-divider"><span>Restaurant Staff</span></div>

        {/* GIS renders its own button here after One Tap is suppressed */}
        <div id="g-btn-container" style={{ display: "flex", justifyContent: "center", marginBottom: 8, minHeight: 44 }} />

        <button className="google-btn" onClick={handleGoogle} disabled={!ready}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          {ready ? "Sign in with Google" : "Loading…"}
        </button>

        {error && <div className="error-box">⚠️ {error}</div>}

        <p className="auth-note">Admin sign-in requires an authorised Google account.<br />Contact your restaurant manager for access.</p>
      </div>
    </div>
  );
}

// ─── NOT AUTHORISED ─────────────────────────────────────────────────────────
function NotAuthorisedScreen({ user, onSignOut }) {
  return (
    <div className="auth-screen">
      <div className="notauth-card fade-in">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Not Authorised</div>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text)" }}>{user.email}</strong> is not on the admin list.
          Ask your restaurant owner to add your email.
        </p>
        <div className="admin-list">
          <div className="admin-list-title">Current admin emails:</div>
          {ADMIN_EMAILS.map(e => <div key={e} style={{ fontFamily: "monospace", fontSize: 12, marginTop: 3 }}>• {e}</div>)}
        </div>
        <button className="sign-out-btn" style={{ width: "100%", padding: 12, fontSize: 14 }} onClick={onSignOut}>
          Sign Out &amp; Try Another Account
        </button>
      </div>
    </div>
  );
}

// ─── TABLE MODAL ────────────────────────────────────────────────────────────
function TableModal({ onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" onClick={e => e.stopPropagation()}>
        <h3>🪑 Select Your Table</h3>
        <p>Tap your table number. In production, scanning the QR code at your table sets this automatically.</p>
        <div className="qr-grid">
          {TABLES.map(t => (
            <div key={t} className="qr-tile" onClick={() => onSelect(t)}>
              <span className="tnum">{t}</span>
              <span className="tlabel">Table</span>
            </div>
          ))}
        </div>
        <button className="modal-close" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

// ─── CUSTOMER VIEW ──────────────────────────────────────────────────────────
function CustomerView({ orders, onPlaceOrder }) {
  const [table, setTable]              = useState(null);
  const [showTableModal, setShowTable] = useState(false);
  const [cart, setCart]                = useState({});
  const [category, setCategory]        = useState("All");
  const [confirmed, setConfirmed]      = useState(null);
  const [toast, setToast]              = useState("");

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ ...MENU.find(m => m.id === +id), qty }))
    .filter(Boolean);
  const total    = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);

  const updateCart = (id, delta) =>
    setCart(prev => {
      const n = { ...prev }, nv = (n[id] || 0) + delta;
      if (nv <= 0) delete n[id]; else n[id] = nv;
      return n;
    });

  const filtered = MENU.filter(i => category === "All" || i.category === category);
  const grouped  = CATEGORIES.slice(1)
    .map(cat => ({ cat, items: filtered.filter(i => i.category === cat) }))
    .filter(g => g.items.length);

  const handlePlace = () => {
    if (!table)            { setShowTable(true); return; }
    if (!cartItems.length)   return;
    const order = {
      id: genOrderId(), table, status: "Received", timestamp: Date.now(), total,
      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    };
    onPlaceOrder(order);
    setConfirmed(order);
    setCart({});
  };

  const liveStatus = confirmed
    ? (orders.find(o => o.id === confirmed.id)?.status || confirmed.status)
    : "Received";
  const statusIdx = STATUS_FLOW.indexOf(liveStatus);

  if (confirmed) {
    return (
      <div className="menu-page">
        <div className="confirm-page slide-up">
          <div className="confirm-icon">🎉</div>
          <h2 className="confirm-title">Order Placed!</h2>
          <p className="confirm-sub">Your order is with the kitchen.<br />Sit back and relax!</p>
          <div className="order-card">
            <div className="order-id-big">{confirmed.id}</div>
            <div className="order-meta">Table {confirmed.table} · {confirmed.items.length} item{confirmed.items.length !== 1 ? "s" : ""}</div>
            <div className="order-items-list">
              {confirmed.items.map(i => (
                <div key={i.id} className="order-item-row">
                  <span style={{ color: "var(--text2)" }}>{i.name}</span>
                  <span style={{ fontWeight: 600 }}>×{i.qty} &nbsp; ₹{i.price * i.qty}</span>
                </div>
              ))}
              <div className="order-item-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>₹{confirmed.total}</span>
              </div>
            </div>
            <div className="status-track-label">Live Order Status</div>
            <div className="status-track">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={`status-step ${i < statusIdx ? "done" : i === statusIdx ? "current" : "pending"}`}>
                  {STATUS_ICON[s]}<br />{s}
                </div>
              ))}
            </div>
          </div>
          <button className="new-order-btn" onClick={() => { setConfirmed(null); setTable(null); }}>
            + Order More Items
          </button>
        </div>
        <Toast msg={toast} />
      </div>
    );
  }

  return (
    <>
      <div className="menu-page fade-in">
        {table ? (
          <div className="table-banner" onClick={() => setShowTable(true)}>
            <div><div className="tnum">{table}</div><div className="tlabel">TABLE NUMBER</div></div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>Tap to change →</span>
          </div>
        ) : (
          <div className="table-select" onClick={() => setShowTable(true)}>
            <span style={{ fontSize: 20 }}>🪑</span>
            <span style={{ flex: 1, color: "var(--text2)" }}>Select your table number</span>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>SELECT →</span>
          </div>
        )}

        <div className="cat-scroll">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        {grouped.map(({ cat, items }) => (
          <div key={cat} className="menu-section">
            <div className="section-label">{cat}</div>
            <div className="menu-grid">
              {items.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <div key={item.id} className="menu-card">
                    <div className="item-emoji">{item.emoji}</div>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-desc">{item.desc}</div>
                      <div className="item-price">₹{item.price}</div>
                    </div>
                    <div className="item-actions">
                      {qty > 0 ? (
                        <>
                          <button className="qty-btn" onClick={() => updateCart(item.id, -1)}>−</button>
                          <span className="qty-num">{qty}</span>
                          <button className="qty-btn" onClick={() => { updateCart(item.id, 1); showToast(`${item.name} added`); }}>+</button>
                        </>
                      ) : (
                        <button className="add-btn" onClick={() => { updateCart(item.id, 1); showToast(`${item.name} added`); }}>Add</button>
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
        <div className="cart-footer">
          <div className="cart-summary">
            <span className="cart-count"><span>{totalQty}</span> item{totalQty !== 1 ? "s" : ""} in cart</span>
            <span className="cart-total">₹{total}</span>
          </div>
          <button className="place-order-btn" onClick={handlePlace}>
            Place Order{table ? ` · Table ${table}` : ""}
          </button>
        </div>
      )}

      {showTableModal && <TableModal onSelect={t => { setTable(t); setShowTable(false); }} onClose={() => setShowTable(false)} />}
      <Toast msg={toast} />
    </>
  );
}

// ─── ADMIN VIEW ─────────────────────────────────────────────────────────────
function AdminView({ orders, onUpdateStatus, onClearCompleted }) {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const counts = {
    All: orders.length,
    Received:  orders.filter(o => o.status === "Received").length,
    Preparing: orders.filter(o => o.status === "Preparing").length,
    Ready:     orders.filter(o => o.status === "Ready").length,
  };
  const fmt = ts => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Kitchen Dashboard</h2>
          <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div className="live-badge"><div className="live-dot" />LIVE</div>
          {counts.Ready > 0 && (
            <button className="clear-btn" onClick={onClearCompleted}>Clear ready ({counts.Ready})</button>
          )}
        </div>
      </div>

      <div className="admin-stats">
        {[
          ["📊", counts.All,       "Total",     "var(--text)"],
          ["📋", counts.Received,  "Received",  "#f59e0b"],
          ["👨‍🍳", counts.Preparing, "Preparing", "#3b82f6"],
          ["✅", counts.Ready,     "Ready",     "#10b981"],
        ].map(([icon, num, label, col]) => (
          <div key={label} className="stat-card">
            <div className="stat-num" style={{ color: col }}>{icon} {num}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="filter-tabs">
        {["All", "Received", "Preparing", "Ready"].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}{counts[f] > 0 ? ` (${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <p>{filter === "All" ? "No orders yet. Waiting for customers…" : `No ${filter.toLowerCase()} orders right now.`}</p>
        </div>
      ) : (
        <div className="orders-grid">
          {[...filtered].sort((a, b) => b.timestamp - a.timestamp).map(order => (
            <div key={order.id} className="order-tile fade-in" data-status={order.status}>
              <div className="tile-head">
                <div>
                  <div className="tile-id">{order.id}</div>
                  <div className="tile-time">⏰ {fmt(order.timestamp)}</div>
                </div>
                <div className="tile-table">🪑 T-{order.table}</div>
              </div>
              <div className="tile-items">
                {order.items.map(i => (
                  <div key={i.id} className="tile-item">
                    <span className="n">{i.name}</span>
                    <span className="q">×{i.qty}</span>
                  </div>
                ))}
              </div>
              <div className="tile-total">Total: <span>₹{order.total}</span></div>
              <div className="status-btns">
                {STATUS_FLOW.map(s => (
                  <button key={s} data-s={s} className={`status-btn ${order.status === s ? "current" : ""}`} onClick={() => onUpdateStatus(order.id, s)}>
                    {STATUS_ICON[s]} {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
export default function App() {
  const [auth,     setAuth]     = useState(null);   // null | { role, name, email, picture }
  const [notAuth,  setNotAuth]  = useState(null);   // google user that isn't an admin
  const [orders,   setOrders]   = useState([]);

  useEffect(() => subscribeOrders(setOrders), []);

  const handleGuest  = () => setAuth({ role: "guest", name: "Guest", email: null, picture: null });
  const handleGoogle = (user) => {
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
    if (isAdmin) { setAuth({ role: "admin", ...user }); setNotAuth(null); }
    else         { setNotAuth(user); }
  };
  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    setAuth(null); setNotAuth(null);
  };

  const handlePlaceOrder     = (o)        => saveOrders([o, ...orders]);
  const handleUpdateStatus   = (id, s)    => saveOrders(orders.map(o => o.id === id ? { ...o, status: s } : o));
  const handleClearCompleted = ()         => saveOrders(orders.filter(o => o.status !== "Ready"));

  const isAdmin = auth?.role === "admin";

  return (
    <>
      <style>{css}</style>

      {/* ── No auth yet ── */}
      {!auth && !notAuth && <AuthScreen onGuest={handleGuest} onGoogle={handleGoogle} />}

      {/* ── Google user not in admin list ── */}
      {!auth && notAuth && <NotAuthorisedScreen user={notAuth} onSignOut={handleSignOut} />}

      {/* ── Authenticated ── */}
      {auth && (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
          <nav className="top-nav">
            <div className="logo">Bistro<span>Spice</span></div>
            <div className="nav-right">
              <span className={`role-badge ${isAdmin ? "role-admin" : "role-guest"}`}>
                {isAdmin ? "👑 Admin" : "👤 Guest"}
              </span>
              {auth.picture && (
                <div className="user-chip">
                  <img className="user-avatar" src={auth.picture} alt={auth.name} referrerPolicy="no-referrer" />
                  <span className="user-name">{auth.name}</span>
                </div>
              )}
              <button className="sign-out-btn" onClick={handleSignOut}>
                {isAdmin ? "Sign Out" : "← Back"}
              </button>
            </div>
          </nav>

          {isAdmin
            ? <AdminView orders={orders} onUpdateStatus={handleUpdateStatus} onClearCompleted={handleClearCompleted} />
            : <CustomerView orders={orders} onPlaceOrder={handlePlaceOrder} />
          }
        </div>
      )}
    </>
  );
}

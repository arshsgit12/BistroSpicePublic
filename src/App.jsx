import { useState, useEffect, useCallback } from "react";

const GOOGLE_CLIENT_ID = "1031994809087-ribigpmso5umf5bt4f1eofdj4vor2rk4.apps.googleusercontent.com";
const ADMIN_EMAILS = ["pythonwitharsh@gmail.com"];

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

const CATEGORIES  = ["All", ...Array.from(new Set(MENU.map(i => i.category)))];
const STATUS_FLOW = ["Received", "Preparing", "Ready"];
const STATUS_COLOR = { Received:"#C9A96E", Preparing:"#7EB8F7", Ready:"#7ECFA0" };
const TABLES = Array.from({ length:10 }, (_, i) => i + 1);
function genId() { return "ORD-" + Math.random().toString(36).slice(2,6).toUpperCase(); }

// ── In-memory store shared between customer and admin ──
let _orders = [];
let _listeners = [];
function saveOrders(o) { _orders=[...o]; _listeners.forEach(fn=>fn([..._orders])); }
function subscribeOrders(fn) { _listeners.push(fn); return ()=>{ _listeners=_listeners.filter(l=>l!==fn); }; }

// Format timestamp → "12 Jul 2025, 02:34 PM"
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true
  }).replace(",", " ·");
}
// Format just time → "02:34 PM"
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --ink:#2c3e50;--ink2:#546e7a;--ink3:#90a4ae;
    --paper:#f0f4f8;--paper2:#e3eaf0;--paper3:#cdd8e3;
    --gold:#5c8fa8;--gold2:#3d6b82;
    --line:rgba(44,62,80,0.09);--line2:rgba(44,62,80,0.04);
    --green:#2e7d5e;--green-bg:rgba(46,125,94,0.08);--green-border:rgba(46,125,94,0.35);
    --r:6px;--r2:3px;
  }
  }
  html,body{background:var(--paper);color:var(--ink);}
  body{font-family:'Inter',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased;}
  button{cursor:pointer;font-family:inherit;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:var(--paper3);border-radius:2px;}

  /* AUTH */
  .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--paper);background-image:radial-gradient(ellipse 60% 50% at 50% -10%,rgba(201,169,110,0.12),transparent);}
  .auth-card{width:100%;max-width:420px;background:#fff;border:1px solid var(--line);border-radius:var(--r2);padding:52px 48px 44px;position:relative;box-shadow:0 2px 4px rgba(26,23,20,0.04),0 12px 40px rgba(26,23,20,0.07);}
  .auth-card::before{content:'';position:absolute;top:0;left:48px;right:48px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
  .auth-brand{text-align:center;margin-bottom:44px;}
  .auth-brand-name{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;letter-spacing:0.08em;color:var(--ink);line-height:1;}
  .auth-brand-name em{font-style:italic;color:var(--gold2);}
  .auth-tagline{font-size:10px;letter-spacing:0.22em;color:var(--ink3);text-transform:uppercase;margin-top:10px;}
  .auth-cta{width:100%;padding:14px;background:var(--ink);color:var(--paper);border:none;border-radius:var(--r2);font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:400;letter-spacing:0.12em;transition:background 0.2s,transform 0.1s;margin-bottom:10px;}
  .auth-cta:hover{background:var(--ink2);}
  .auth-cta:active{transform:scale(0.99);}
  .auth-cta-sub{font-size:11px;color:var(--ink3);text-align:center;letter-spacing:0.04em;}
  .auth-divider{display:flex;align-items:center;gap:16px;margin:28px 0;}
  .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--line);}
  .auth-divider span{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink3);white-space:nowrap;}
  .google-btn{width:100%;padding:13px 20px;border:1px solid var(--line);background:var(--paper);color:var(--ink2);border-radius:var(--r2);font-size:14px;font-weight:400;letter-spacing:0.03em;display:flex;align-items:center;justify-content:center;gap:10px;transition:border-color 0.2s,background 0.2s;}
  .google-btn:hover:not(:disabled){border-color:var(--gold);background:var(--paper2);}
  .google-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .auth-note{font-size:11px;color:var(--ink3);text-align:center;margin-top:20px;line-height:1.7;}
  .auth-error{margin-top:12px;font-size:12px;color:#b04040;background:rgba(176,64,64,0.06);padding:10px 14px;border-radius:var(--r2);border:1px solid rgba(176,64,64,0.18);text-align:center;}

  /* NOT AUTH */
  .notauth-icon{font-size:36px;text-align:center;margin-bottom:20px;opacity:0.4;}
  .notauth-title{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;text-align:center;margin-bottom:10px;}
  .notauth-body{font-size:13px;color:var(--ink2);text-align:center;line-height:1.7;margin-bottom:20px;}
  .notauth-list{background:var(--paper2);border:1px solid var(--line);border-radius:var(--r2);padding:14px 18px;margin-bottom:24px;}
  .notauth-list-title{font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;}
  .notauth-email{font-family:monospace;font-size:12px;color:var(--ink2);padding:2px 0;}
  .back-btn{width:100%;padding:12px;border:1px solid var(--line);background:transparent;color:var(--ink2);border-radius:var(--r2);font-size:12px;letter-spacing:0.08em;transition:all 0.18s;}
  .back-btn:hover{border-color:var(--ink2);color:var(--ink);}

  /* NAV */
  .top-nav{background:#fff;border-bottom:1px solid var(--line);height:58px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:12px;}
  .nav-brand{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;letter-spacing:0.08em;color:var(--ink);flex-shrink:0;}
  .nav-brand em{font-style:italic;color:var(--gold2);}
  .nav-right{display:flex;align-items:center;gap:10px;min-width:0;}
  .nav-role{font-size:10px;letter-spacing:0.18em;text-transform:uppercase;padding:4px 12px;border-radius:20px;border:1px solid;white-space:nowrap;flex-shrink:0;}
  .nav-role.admin{border-color:rgba(201,169,110,0.5);color:var(--gold2);background:rgba(201,169,110,0.08);}
  .nav-role.guest{border-color:var(--line);color:var(--ink3);}
  .nav-user{display:flex;align-items:center;gap:8px;min-width:0;max-width:150px;}
  .nav-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;object-fit:cover;border:1px solid var(--line);}
  .nav-avatar-init{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--paper2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:var(--ink2);}
  .nav-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--ink2);}
  .nav-signout{padding:5px 14px;border:1px solid var(--line);background:transparent;color:var(--ink3);border-radius:var(--r2);font-size:11px;letter-spacing:0.08em;transition:all 0.18s;white-space:nowrap;flex-shrink:0;}
  .nav-signout:hover{border-color:#b04040;color:#b04040;}

  /* CUSTOMER MENU */
  .menu-page{max-width:520px;margin:0 auto;padding-bottom:150px;}
  .table-hero{margin:20px 16px 0;background:var(--ink);border-radius:var(--r2);padding:20px 24px;display:flex;align-items:center;gap:16px;cursor:pointer;overflow:hidden;position:relative;transition:background 0.2s;}
  .table-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(201,169,110,0.18) 0%,transparent 60%);pointer-events:none;}
  .table-hero:hover{background:var(--ink2);}
  .table-hero-num{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:300;color:var(--gold);line-height:1;letter-spacing:-1px;}
  .table-hero-label{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:3px;}
  .table-hero-hint{font-size:12px;color:rgba(255,255,255,0.55);}
  .table-hero-chevron{margin-left:auto;color:rgba(255,255,255,0.25);font-size:22px;}
  .table-prompt{margin:20px 16px 0;padding:16px 20px;border:1px dashed var(--paper3);border-radius:var(--r2);cursor:pointer;display:flex;align-items:center;gap:12px;background:var(--paper2);transition:border-color 0.2s;}
  .table-prompt:hover{border-color:var(--gold);}
  .table-prompt-text{flex:1;font-size:13px;color:var(--ink3);}
  .table-prompt-cta{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold2);font-weight:600;}
  .cat-strip{display:flex;gap:6px;padding:20px 16px 0;overflow-x:auto;scrollbar-width:none;}
  .cat-strip::-webkit-scrollbar{display:none;}
  .cat-pill{white-space:nowrap;padding:6px 18px;border:1px solid var(--line);background:transparent;color:var(--ink3);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:500;flex-shrink:0;border-radius:20px;transition:all 0.2s;font-family:'Inter',sans-serif;}
  .cat-pill.on{background:var(--ink);border-color:var(--ink);color:var(--paper);}
  .menu-group{padding:24px 16px 0;}
  .menu-group-label{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink3);margin-bottom:14px;display:flex;align-items:center;gap:12px;}
  .menu-group-label::after{content:'';flex:1;height:1px;background:var(--line2);}
  .menu-list{display:flex;flex-direction:column;gap:2px;}
  .menu-item{background:#fff;padding:16px 20px;display:flex;align-items:center;gap:14px;transition:background 0.15s;border-radius:var(--r);border:1px solid transparent;}
  .menu-item:hover{background:var(--paper2);border-color:var(--line);}
  .menu-item-emoji{font-size:28px;width:42px;text-align:center;flex-shrink:0;}
  .menu-item-body{flex:1;min-width:0;}
  .menu-item-name{font-size:15px;font-weight:500;color:var(--ink);margin-bottom:2px;}
  .menu-item-desc{font-size:12px;color:var(--ink3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .menu-item-price{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:400;color:var(--gold2);margin-top:4px;}
  .item-ctrl{display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .item-btn{width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;line-height:1;}
  .item-btn:hover{border-color:var(--ink);background:var(--ink);color:var(--paper);}
  .item-qty{font-size:15px;font-weight:500;min-width:18px;text-align:center;color:var(--ink);}
  .item-add{padding:7px 18px;border-radius:var(--r2);border:1px solid var(--line);background:transparent;color:var(--ink2);font-size:11px;letter-spacing:0.08em;font-weight:500;transition:all 0.18s;text-transform:uppercase;}
  .item-add:hover{border-color:var(--ink);background:var(--ink);color:var(--paper);}
  .cart-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;padding:12px 16px 28px;background:#fff;border-top:1px solid var(--line);z-index:50;}
  .cart-bar-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .cart-bar-count{font-size:12px;color:var(--ink3);}
  .cart-bar-count strong{color:var(--ink);font-weight:600;}
  .cart-total{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--ink);}
  .cart-place{width:100%;padding:14px;background:var(--ink);color:var(--paper);border:none;border-radius:var(--r2);font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:400;letter-spacing:0.14em;transition:background 0.2s,transform 0.1s;}
  .cart-place:hover{background:var(--ink2);}
  .cart-place:active{transform:scale(0.99);}

  /* CONFIRM / ORDER STATUS PAGE */
  .confirm-page{max-width:520px;margin:0 auto;padding:52px 24px 40px;display:flex;flex-direction:column;align-items:center;text-align:center;}
  .confirm-seal{font-size:60px;margin-bottom:24px;animation:sealIn 0.5s cubic-bezier(0.34,1.56,0.64,1);}
  @keyframes sealIn{from{transform:scale(0.3) rotate(-8deg);opacity:0;}to{transform:scale(1) rotate(0);opacity:1;}}
  .confirm-title{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;letter-spacing:0.04em;margin-bottom:8px;}
  .confirm-sub{font-size:13px;color:var(--ink3);margin-bottom:36px;line-height:1.7;letter-spacing:0.03em;}
  .confirm-receipt{width:100%;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:28px;text-align:left;margin-bottom:24px;position:relative;}
  .confirm-receipt::before{content:'';position:absolute;top:0;left:28px;right:28px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
  .receipt-id{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:300;color:var(--gold2);letter-spacing:0.06em;margin-bottom:4px;}
  .receipt-meta{font-size:12px;color:var(--ink3);margin-bottom:4px;letter-spacing:0.04em;}
  .receipt-datetime{font-size:11px;color:var(--ink3);margin-bottom:20px;letter-spacing:0.04em;opacity:0.7;}
  .receipt-items{border-top:1px solid var(--line2);padding-top:16px;display:flex;flex-direction:column;gap:8px;}
  .receipt-row{display:flex;justify-content:space-between;font-size:13px;}
  .receipt-row .lbl{color:var(--ink2);}
  .receipt-row .val{font-weight:500;color:var(--ink);}
  .receipt-total{display:flex;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--line);}
  .receipt-total .lbl{color:var(--ink3);font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;align-self:center;}
  .receipt-total .val{font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--gold2);font-weight:400;}

  /* LIVE STATUS TRACK */
  .status-track-label{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink3);margin:20px 0 12px;font-weight:500;}
  .status-track{display:flex;gap:3px;width:100%;}
  .status-step{flex:1;padding:9px 4px;text-align:center;font-size:10px;letter-spacing:0.1em;font-weight:500;text-transform:uppercase;transition:all 0.35s;border:1px solid var(--line);border-radius:var(--r2);}
  .status-step.done{background:var(--paper2);color:var(--ink3);border-color:transparent;}
  .status-step.current{background:var(--ink);color:var(--paper);border-color:transparent;}
  .status-step.pending{background:transparent;color:var(--ink3);}

  /* ORDER READY BANNER — shown to customer when admin marks Ready */
  .ready-banner{margin-top:20px;width:100%;background:var(--green-bg);border:1px solid var(--green-border);border-radius:var(--r);padding:18px 20px;display:flex;align-items:center;gap:14px;animation:fadeUp 0.4s ease;}
  .ready-banner-icon{font-size:28px;flex-shrink:0;}
  .ready-banner-text{flex:1;}
  .ready-banner-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:var(--green);margin-bottom:2px;}
  .ready-banner-sub{font-size:12px;color:var(--ink3);line-height:1.5;}

  .more-btn{padding:12px 36px;border-radius:var(--r2);border:1px solid var(--line);background:transparent;color:var(--ink2);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;transition:all 0.2s;margin-top:8px;}
  .more-btn:hover{border-color:var(--ink);color:var(--ink);}

  /* TABLE MODAL */
  .modal-bg{position:fixed;inset:0;background:rgba(26,23,20,0.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
  .modal-box{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:36px;max-width:360px;width:100%;text-align:center;position:relative;animation:modalIn 0.28s cubic-bezier(0.175,0.885,0.32,1.1);}
  @keyframes modalIn{from{opacity:0;transform:translateY(14px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  .modal-box::before{content:'';position:absolute;top:0;left:36px;right:36px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;margin-bottom:8px;}
  .modal-sub{font-size:12px;color:var(--ink3);margin-bottom:24px;line-height:1.6;}
  .table-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px;}
  .table-chip{aspect-ratio:1;border:1px solid var(--line);border-radius:var(--r2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;background:var(--paper);}
  .table-chip:hover{border-color:var(--gold);background:rgba(201,169,110,0.06);}
  .table-chip .num{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--gold2);}
  .table-chip .lbl{font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink3);}
  .modal-cancel{width:100%;padding:11px;border:1px solid var(--line);background:transparent;color:var(--ink3);border-radius:var(--r2);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;transition:all 0.2s;}
  .modal-cancel:hover{border-color:var(--ink2);color:var(--ink2);}

  /* TOAST */
  .toast{position:fixed;bottom:160px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:9px 22px;border-radius:20px;font-size:11px;letter-spacing:0.1em;z-index:300;animation:toastIn 0.25s ease;pointer-events:none;white-space:nowrap;text-transform:uppercase;}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(6px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

  /* ADMIN */
  .admin-page{padding:28px 24px;max-width:1060px;margin:0 auto;}
  .admin-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;gap:12px;flex-wrap:wrap;padding-bottom:24px;border-bottom:1px solid var(--line);}
  .admin-heading{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:300;letter-spacing:0.02em;}
  .admin-date{font-size:11px;color:var(--ink3);margin-top:6px;letter-spacing:0.08em;text-transform:uppercase;}
  .live-pill{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#2e8a5a;font-weight:600;padding:5px 14px;border-radius:20px;border:1px solid var(--green-border);background:var(--green-bg);}
  .live-dot{width:6px;height:6px;border-radius:50%;background:#7ECFA0;animation:pulse 1.6s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
  .kpi-strip{display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;}
  .kpi-card{flex:1;min-width:90px;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;}
  .kpi-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:300;line-height:1;margin-bottom:6px;}
  .kpi-label{font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink3);}
  .filter-row{display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;}
  .filter-btn{padding:7px 18px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--ink3);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:500;transition:all 0.18s;}
  .filter-btn.on{border-color:var(--ink);background:var(--ink);color:var(--paper);}
  .orders-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));}

  /* ORDER TILE */
  .order-tile{background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;transition:box-shadow 0.2s;}
  .order-tile:hover{box-shadow:0 4px 18px rgba(26,23,20,0.08);}
  .tile-accent{height:2px;}
  .tile-body{padding:18px 20px;}
  .tile-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
  .tile-id{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:var(--gold2);letter-spacing:0.04em;}
  .tile-meta{font-size:11px;color:var(--ink3);margin-top:3px;letter-spacing:0.02em;}
  .tile-datetime{font-size:10px;color:var(--ink3);opacity:0.7;margin-top:1px;letter-spacing:0.02em;}
  .tile-table-badge{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;background:var(--paper2);border:1px solid var(--line);border-radius:var(--r2);padding:3px 10px;color:var(--ink2);font-weight:600;white-space:nowrap;align-self:flex-start;}
  .tile-items{margin-bottom:14px;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:10px 0;display:flex;flex-direction:column;gap:5px;}
  .tile-item{display:flex;justify-content:space-between;font-size:12px;}
  .tile-item .n{color:var(--ink2);}
  .tile-item .q{font-weight:600;color:var(--ink);font-size:11px;}
  .tile-footer{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
  .tile-total{font-size:12px;color:var(--ink3);}
  .tile-total strong{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:400;color:var(--gold2);}

  /* STATUS BUTTONS IN ADMIN TILE */
  .status-btns{display:flex;gap:4px;}
  .status-btn{flex:1;padding:8px 4px;text-align:center;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:500;border:1px solid var(--line);border-radius:var(--r2);background:transparent;color:var(--ink3);transition:all 0.15s;}
  .status-btn:hover:not(.active){border-color:var(--ink3);color:var(--ink2);}
  .status-btn.active-Received{background:rgba(201,169,110,0.12);border-color:rgba(201,169,110,0.5);color:#a07840;}
  .status-btn.active-Preparing{background:rgba(126,184,247,0.12);border-color:rgba(126,184,247,0.5);color:#3b6fb0;}
  .status-btn.active-Ready{background:var(--green-bg);border-color:var(--green-border);color:var(--green);}

  /* MARK READY BIG BUTTON */
  .mark-ready-btn{width:100%;margin-top:10px;padding:11px;background:var(--ink);color:var(--paper);border:none;border-radius:var(--r2);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.2s,transform 0.1s;}
  .mark-ready-btn:hover{background:var(--green);}
  .mark-ready-btn:active{transform:scale(0.99);}
  .mark-ready-btn.is-ready{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border);cursor:default;}
  .checkmark{font-size:14px;}

  .empty-admin{text-align:center;padding:80px 20px;}
  .empty-admin-icon{font-size:38px;opacity:0.15;margin-bottom:20px;}
  .empty-admin-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;color:var(--ink2);margin-bottom:8px;}
  .empty-admin-text{font-size:13px;color:var(--ink3);letter-spacing:0.04em;line-height:1.6;}
  .clear-btn{font-size:10px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 12px;border-radius:var(--r2);border:1px solid var(--line);background:transparent;color:var(--ink3);cursor:pointer;margin-top:6px;transition:all 0.2s;}
  .clear-btn:hover{border-color:var(--ink2);color:var(--ink2);}

  /* ANIMATIONS */
  .fade-up{animation:fadeUp 0.32s ease;}
  .pop-in{animation:popIn 0.38s cubic-bezier(0.175,0.885,0.32,1.1);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes popIn{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}

  @media(max-width:480px){
    .auth-card{padding:40px 28px 36px;}
    .kpi-strip{gap:8px;}
    .kpi-card{padding:14px;}
    .kpi-val{font-size:26px;}
    .orders-grid{grid-template-columns:1fr;}
    .nav-user{display:none;}
  }
`;

// ── Google Sign-In ──
function useGIS() {
  const [ready, setReady] = useState(!!window.google?.accounts);
  useEffect(() => {
    if (window.google?.accounts) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  const signIn = useCallback((onSuccess, onError) => {
    if (!window.google?.accounts?.id) { onError("Google Sign-In SDK not loaded."); return; }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try { const p = JSON.parse(atob(resp.credential.split(".")[1])); onSuccess({ name:p.name, email:p.email, picture:p.picture }); }
        catch { onError("Could not parse response."); }
      },
      ux_mode: "popup",
    });
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        const el = document.getElementById("g-btn-slot");
        if (el) { el.innerHTML = ""; window.google.accounts.id.renderButton(el, { theme:"filled_black", size:"large", width:320 }); }
      }
    });
  }, []);
  return { ready, signIn };
}

// ── Auth Screen ──
function AuthScreen({ onGuest, onGoogle }) {
  const { ready, signIn } = useGIS();
  const [error, setError] = useState("");
  const go = () => { setError(""); signIn(onGoogle, setError); };
  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="auth-brand">
          <div className="auth-brand-name">Bistro<em>Spice</em></div>
          <div className="auth-tagline">Fine Dining · Table Ordering</div>
        </div>
        <button className="auth-cta" onClick={onGuest}>Browse Menu &amp; Order</button>
        <p className="auth-cta-sub">Customers — no sign-in required</p>
        <div className="auth-divider"><span>Restaurant Staff</span></div>
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
        <p className="auth-note">Staff access requires an authorised Google account.<br />Contact your restaurant manager for access.</p>
      </div>
    </div>
  );
}

// ── Not Authorised Screen ──
function NotAuthorisedScreen({ user, onSignOut }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="notauth-icon">🔒</div>
        <div className="notauth-title">Access Denied</div>
        <p className="notauth-body"><strong>{user.email}</strong> is not authorised.<br/>Ask the restaurant owner to add your email.</p>
        <div className="notauth-list">
          <div className="notauth-list-title">Authorised accounts</div>
          {ADMIN_EMAILS.map(e=><div key={e} className="notauth-email">— {e}</div>)}
        </div>
        <button className="back-btn" onClick={onSignOut}>← Try a different account</button>
      </div>
    </div>
  );
}

// ── Table Selector Modal ──
function TableModal({ onSelect, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Select Table</div>
        <p className="modal-sub">Tap your table number to begin. In production, scanning the QR code at your table sets this automatically.</p>
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

// ── Customer View ──
function CustomerView({ orders, onPlaceOrder }) {
  const [table, setTable]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart]           = useState({});
  const [cat, setCat]             = useState("All");
  const [confirmed, setConfirmed] = useState(null);
  const [toast, setToast]         = useState("");

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""), 2000); };

  const cartItems = Object.entries(cart)
    .map(([id,qty])=>({ ...MENU.find(m=>m.id===+id), qty }))
    .filter(Boolean);
  const total    = cartItems.reduce((s,i)=>s+i.price*i.qty, 0);
  const totalQty = cartItems.reduce((s,i)=>s+i.qty, 0);

  const updateCart = (id, delta) =>
    setCart(prev => {
      const n={...prev}, nv=(n[id]||0)+delta;
      if(nv<=0) delete n[id]; else n[id]=nv;
      return n;
    });

  const filtered = MENU.filter(i=>cat==="All"||i.category===cat);
  const grouped  = CATEGORIES.slice(1)
    .map(c=>({ c, items:filtered.filter(i=>i.category===c) }))
    .filter(g=>g.items.length);

  const handlePlace = () => {
    if (!table) { setShowModal(true); return; }
    if (!cartItems.length) return;
    const order = {
      id: genId(),
      table,
      status: "Received",
      timestamp: Date.now(),
      total,
      items: cartItems.map(i=>({ id:i.id, name:i.name, qty:i.qty, price:i.price })),
    };
    onPlaceOrder(order);
    setConfirmed(order);
    setCart({});
  };

  // Always pull the latest status from the shared store
  const liveOrder  = confirmed ? (orders.find(o=>o.id===confirmed.id) || confirmed) : null;
  const liveStatus = liveOrder?.status || "Received";
  const statusIdx  = STATUS_FLOW.indexOf(liveStatus);
  const isReady    = liveStatus === "Ready";

  // CONFIRMATION / LIVE STATUS PAGE
  if (confirmed) {
    return (
      <div className="menu-page">
        <div className="confirm-page pop-in">
          {/* Icon changes when order is ready */}
          <div className="confirm-seal">{isReady ? "✅" : "🎉"}</div>

          <h2 className="confirm-title">
            {isReady ? "Order Ready!" : "Order Placed"}
          </h2>
          <p className="confirm-sub">
            {isReady
              ? "Your order is ready. Please collect from the counter."
              : "Your order has been sent to the kitchen.\nWe'll have it ready shortly."}
          </p>

          <div className="confirm-receipt">
            <div className="receipt-id">{confirmed.id}</div>
            <div className="receipt-meta">Table {confirmed.table} &nbsp;·&nbsp; {confirmed.items.length} item{confirmed.items.length!==1?"s":""}</div>
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

          {/* "Order Fetched" banner — only shown when admin marks Ready */}
          {isReady && (
            <div className="ready-banner">
              <div className="ready-banner-icon">✅</div>
              <div className="ready-banner-text">
                <div className="ready-banner-title">Order Fetched!</div>
                <div className="ready-banner-sub">The kitchen has marked your order as ready.<br/>Please collect from the counter.</div>
              </div>
            </div>
          )}

          <button className="more-btn" onClick={()=>{ setConfirmed(null); setTable(null); }}>
            Place Another Order
          </button>
        </div>
        <Toast msg={toast}/>
      </div>
    );
  }

  // MENU PAGE
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
            <span style={{fontSize:20}}>🪑</span>
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
                const qty = cart[item.id]||0;
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
                          <button className="item-btn" onClick={()=>{ updateCart(item.id,1); showToast(`${item.name} added`); }}>+</button>
                        </>
                      ) : (
                        <button className="item-add" onClick={()=>{ updateCart(item.id,1); showToast(`${item.name} added`); }}>Add</button>
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

      {showModal && <TableModal onSelect={t=>{ setTable(t); setShowModal(false); }} onClose={()=>setShowModal(false)}/>}
      <Toast msg={toast}/>
    </>
  );
}

// ── Admin View ──
function AdminView({ orders, onUpdateStatus, onClearCompleted }) {
  const [filter, setFilter] = useState("All");

  const filtered = filter==="All" ? orders : orders.filter(o=>o.status===filter);
  const counts = {
    All:      orders.length,
    Received: orders.filter(o=>o.status==="Received").length,
    Preparing:orders.filter(o=>o.status==="Preparing").length,
    Ready:    orders.filter(o=>o.status==="Ready").length,
  };
  const revenue = orders.reduce((s,o)=>s+o.total, 0);

  return (
    <div className="admin-page fade-up">
      {/* Header */}
      <div className="admin-top">
        <div>
          <div className="admin-heading">Kitchen Dashboard</div>
          <div className="admin-date">
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <div className="live-pill"><div className="live-dot"/>Live</div>
          {counts.Ready>0 && (
            <button className="clear-btn" onClick={onClearCompleted}>
              Clear completed ({counts.Ready})
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="kpi-strip">
        {[
          {label:"Total Orders", val:counts.All,       color:"var(--gold2)"},
          {label:"Received",     val:counts.Received,  color:"#C9A96E"},
          {label:"Preparing",    val:counts.Preparing, color:"#7EB8F7"},
          {label:"Ready",        val:counts.Ready,     color:"#7ECFA0"},
          {label:"Revenue",      val:`₹${revenue}`,    color:"var(--ink)"},
        ].map(({label,val,color})=>(
          <div key={label} className="kpi-card">
            <div className="kpi-val" style={{color}}>{val}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="filter-row">
        {["All","Received","Preparing","Ready"].map(f=>(
          <button key={f} className={`filter-btn ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>
            {f}{counts[f]>0?` · ${counts[f]}`:""}
          </button>
        ))}
      </div>

      {/* Orders — only real orders placed by customers */}
      {filtered.length===0 ? (
        <div className="empty-admin">
          <div className="empty-admin-icon">🍽</div>
          <div className="empty-admin-title">
            {filter==="All" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
          </div>
          <div className="empty-admin-text">
            {filter==="All"
              ? "Orders placed by customers will appear here in real time."
              : `Orders with status "${filter}" will appear here.`}
          </div>
        </div>
      ) : (
        <div className="orders-grid">
          {[...filtered].sort((a,b)=>b.timestamp-a.timestamp).map(order=>(
            <div key={order.id} className="order-tile fade-up">
              {/* Coloured top accent bar */}
              <div className="tile-accent" style={{background:STATUS_COLOR[order.status]}}/>

              <div className="tile-body">
                {/* Order header */}
                <div className="tile-top">
                  <div>
                    <div className="tile-id">{order.id}</div>
                    {/* Full date + time of when order was placed */}
                    <div className="tile-meta">{fmtDateTime(order.timestamp)}</div>
                  </div>
                  <div className="tile-table-badge">Table {order.table}</div>
                </div>

                {/* Items list */}
                <div className="tile-items">
                  {order.items.map(i=>(
                    <div key={i.id} className="tile-item">
                      <span className="n">{i.name}</span>
                      <span className="q">×{i.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Total + status pill row */}
                <div className="tile-footer">
                  <div className="tile-total">Total: <strong>₹{order.total}</strong></div>
                  <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:STATUS_COLOR[order.status],fontWeight:600,border:`1px solid ${STATUS_COLOR[order.status]}44`,padding:"2px 8px",borderRadius:20,background:`${STATUS_COLOR[order.status]}11`}}>
                    {order.status}
                  </div>
                </div>

                {/* Status update buttons */}
                <div className="status-btns">
                  {STATUS_FLOW.map(s=>(
                    <button
                      key={s}
                      className={`status-btn ${order.status===s?`active-${s}`:""}`}
                      onClick={()=>onUpdateStatus(order.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* "Order Fetched ✓" button — marks Ready AND notifies customer */}
                <button
                  className={`mark-ready-btn ${order.status==="Ready"?"is-ready":""}`}
                  onClick={()=>order.status!=="Ready" && onUpdateStatus(order.id,"Ready")}
                >
                  {order.status==="Ready" ? (
                    <><span className="checkmark">✓</span> Order Fetched</>
                  ) : (
                    <><span className="checkmark">✓</span> Mark as Ready &amp; Notify Customer</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root App ──
export default function App() {
  const [auth,    setAuth]    = useState(null);
  const [notAuth, setNotAuth] = useState(null);
  const [orders,  setOrders]  = useState([]);

  // Subscribe to the shared in-memory store
  useEffect(()=>subscribeOrders(setOrders), []);

  const handleGuest  = () => setAuth({ role:"guest", name:"Guest", email:null, picture:null });
  const handleGoogle = (user) => {
    const isAdmin = ADMIN_EMAILS.map(e=>e.toLowerCase()).includes(user.email.toLowerCase());
    if (isAdmin) { setAuth({ role:"admin", ...user }); setNotAuth(null); }
    else         { setNotAuth(user); }
  };
  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    setAuth(null); setNotAuth(null);
  };

  // Only real orders from customers flow through here — no sample data
  const handlePlaceOrder     = (o)    => saveOrders([o, ...orders]);
  const handleUpdateStatus   = (id,s) => saveOrders(orders.map(o=>o.id===id ? {...o, status:s} : o));
  const handleClearCompleted = ()     => saveOrders(orders.filter(o=>o.status!=="Ready"));

  const isAdmin = auth?.role === "admin";

  return (
    <>
      <style>{css}</style>

      {!auth && !notAuth && <AuthScreen onGuest={handleGuest} onGoogle={handleGoogle}/>}
      {!auth && notAuth  && <NotAuthorisedScreen user={notAuth} onSignOut={handleSignOut}/>}

      {auth && (
        <div style={{minHeight:"100vh", background:"var(--paper)"}}>
          <nav className="top-nav">
            <div className="nav-brand">Bistro<em>Spice</em></div>
            <div className="nav-right">
              <span className={`nav-role ${isAdmin?"admin":"guest"}`}>
                {isAdmin ? "Admin" : "Guest"}
              </span>
              {auth.picture ? (
                <div className="nav-user">
                  <img className="nav-avatar" src={auth.picture} alt={auth.name} referrerPolicy="no-referrer"/>
                  <span className="nav-name">{auth.name}</span>
                </div>
              ) : auth.name !== "Guest" ? (
                <div className="nav-user">
                  <div className="nav-avatar-init">{auth.name?.[0]}</div>
                  <span className="nav-name">{auth.name}</span>
                </div>
              ) : null}
              <button className="nav-signout" onClick={handleSignOut}>
                {isAdmin ? "Sign out" : "← Back"}
              </button>
            </div>
          </nav>

          {isAdmin
            ? <AdminView orders={orders} onUpdateStatus={handleUpdateStatus} onClearCompleted={handleClearCompleted}/>
            : <CustomerView orders={orders} onPlaceOrder={handlePlaceOrder}/>
          }
        </div>
      )}
    </>
  );
}

/* =========================================================================
   GREEN CHEF — Application logic  (Multi-tenant SaaS edition)
   -------------------------------------------------------------------------
   Backend: Supabase (PostgreSQL + RPC).  Hech qanday Python yo'q — hamma
   biznes-logika SQL funksiyalarda va shu faylda, toza JS.
   Har bir kafe izolyatsiya qilinadi: barcha so'rovlar SESSION.cafeId bilan.
   Yangi qo'shilgan imkoniyatlar:
     • Super Admin  → kafe qo'shish (nom/telefon/parol/obuna) va o'chirish
     • Admin        → mahsulot va stol o'chirish, yangi bo'lim (kategoriya)
     • Admin        → ixtiyoriy sana oralig'ida hisobot yuklab olish (CSV)
     • Tizim nomi   → "Green Chef"; panelda har bir kafe o'z nomi bilan
   ========================================================================= */

/* -------------------------------------------------------------------------
   0. CONFIG
------------------------------------------------------------------------- */
const CONFIG = {
    SUPABASE_URL: 'https://szixdvbsugxfidhiihzr.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aXhkdmJzdWd4ZmlkaGlpaHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzAyNjYsImV4cCI6MjEwNTc0NjI2Nn0.XJ8e4VPRqWjx96KF1REp1ed4Eogx1A6GUI6V-3LKv18',
};

const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
let SUPER = {id: null, name: null, phone: null};
let superCafes = [];

/* -------------------------------------------------------------------------
   1. ICONS
------------------------------------------------------------------------- */
const ICON_PATHS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M3 10h18M9 10v10"/>',
    clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 16h6"/>',
    users: '<circle cx="9" cy="8" r="3.3"/><path d="M2.7 20c0-3.4 2.8-6.2 6.3-6.2s6.3 2.8 6.3 6.2"/><circle cx="17.3" cy="9" r="2.6"/><path d="M16 13.8c2.8.5 4.9 2.9 4.9 6.2"/>',
    chart: '<path d="M4 21V10"/><path d="M10 21V4"/><path d="M16 21v-7"/><path d="M2 21h20"/>',
    logout: '<path d="M9 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9.5"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5c.6.3 1.4.2 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3.5 6h17"/><path d="M8.5 6V4.2A1.7 1.7 0 0 1 10.2 2.5h3.6A1.7 1.7 0 0 1 15.5 4.2V6"/><path d="M18.7 6l-.9 13.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5.3 6"/><path d="M10 10.5v6M14 10.5v6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4.2.7L3.5 15.5z"/>',
    x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    cup: '<path d="M4 8h13v6.2A4.8 4.8 0 0 1 12.2 19H9A4.8 4.8 0 0 1 4.2 14.2z"/><path d="M17 9.3h1.4a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.2c0 1-1 1-1 2M12.2 3.2c0 1-1 1-1 2"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19.5 14h1.5v1.5h-1.5zM14 19.5h1.5V21H14zM18 18h3v3h-3z"/>',
    list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    bowl: '<path d="M3 12h18"/><path d="M4 12a8 8 0 0 0 16 0"/><path d="M12 3v3.2"/>',
    drink: '<path d="M6.3 8h11.4l-1.4 10.7a2 2 0 0 1-2 1.8H9.7a2 2 0 0 1-2-1.8z"/><path d="M9 8V5.3a3 3 0 0 1 6 0V8"/>',
    leaf: '<path d="M5 21c8-1 13-6 14-14-8 1-13 6-14 14z"/><path d="M5.2 20.8c1-4 4-7 8-9"/>',
    wine: '<path d="M7 3h10v4.5a5 5 0 0 1-10 0z"/><path d="M12 12.5V19"/><path d="M8.5 21h7"/>',
    box: '<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>',
    download: '<path d="M12 3v12"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19h16"/>',
    upload: '<path d="M12 21V9"/><path d="M7.5 13.5 12 9l4.5 4.5"/><path d="M4 5h16"/>',
    phone: '<path d="M6.5 3h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.1 6.1L16.5 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z"/>',
    store: '<path d="M3.5 9.5 5 4h14l1.5 5.5"/><path d="M4.5 9.5V20h15V9.5"/><path d="M9.5 20v-5.5h5V20"/>',
    wallet: '<rect x="2.5" y="6" width="19" height="13" rx="2.4"/><path d="M2.5 10.5h19"/><circle cx="17" cy="14.5" r="1.2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.4"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    alert: '<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
    bell: '<path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.2 7.4-2.2 7.4h16.4S18 14.6 18 8.6"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    bellOff: '<path d="M8.7 3.6A6 6 0 0 1 18 8.6c0 2.3.3 3.9.8 5"/><path d="M4.5 4.5l15 15"/><path d="M18.2 16H1.8s2.2-1.4 2.2-7.4"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    bellRing: '<path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.2 7.4-2.2 7.4h16.4S18 14.6 18 8.6"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/><path d="M21.5 4.5c.6 1 .9 2 .9 3"/><path d="M2.5 4.5c-.6 1-.9 2-.9 3"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.4"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 20 3"/><path d="M17 6l2.5 2.5"/><path d="M14.5 8.5 17 11"/>',
    tag: '<path d="M3.5 11.5V4.5A1 1 0 0 1 4.5 3.5h7l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
};

function icon(name, size, strokeWidth) {
    size = size || 18;
    strokeWidth = strokeWidth || 1.8;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}

function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
        el.innerHTML = icon(el.getAttribute('data-icon'), parseInt(el.getAttribute('data-size') || 18, 10));
    });
}

/* -------------------------------------------------------------------------
   2. LABELS + KONSTANTALAR
------------------------------------------------------------------------- */
const APP_NAME = 'Green Chef';                 // tizimning umumiy nomi
const APP_TAGLINE = 'Kafe hisob-kitob tizimi';

const STATUS_META = {
    yangi: {label: 'Yangi', cls: 'grey'},
    tayyorlanmoqda: {label: 'Tayyorlanmoqda', cls: 'orange'},
    tayyor: {label: 'Tayyor', cls: 'blue'},
    tolangan: {label: "To'langan", cls: 'green'},
};
const PAY_META = {
    naqd: {label: 'Naqd', icon: 'cash'},
    karta: {label: 'Karta', icon: 'card'},
    qr: {label: 'QR kod', icon: 'qr'},
};
const ORDER_TYPES = {
    ichkarida: 'Ichkarida',
    olibketish: 'Olib ketish',
    yetkazish: 'Yetkazish',
};

/* Bo'lim turlari: 'menu' — oddiy menyu, 'extra' — qo'shimcha bo'lim
   (sigaret, vino kabi narsalar). Yangi bo'lim qo'shganda shu yerdan tanlanadi. */
const CAT_KINDS = {
    menu:  {label: 'Menyu',              hint: 'Taom, ichimlik, salat',           cls: 'green',  icon: 'bowl'},
    extra: {label: "Qo'shimcha bo'lim",  hint: 'Sigaret, vino, aksessuar va boshqalar', cls: 'purple', icon: 'wine'},
};

/* Bo'lim uchun tanlanadigan ikonkalar */
const CAT_ICON_CHOICES = ['bowl', 'drink', 'leaf', 'wine', 'box', 'tag', 'cup', 'grid', 'store'];

/* Mahsulot uchun tez tanlanadigan emojilar */
const EMOJI_CHOICES = [
    '🍽️', '🍜', '🍲', '🍛', '🥗', '🍖', '🍗', '🥩', '🍕', '🍔', '🌭', '🥪',
    '🍟', '🥟', '🍚', '🍤', '🐟', '🍰', '🧁', '🍩', '🍦', '🍫', '🍬',
    '☕', '🍵', '🥤', '🧃', '🍹', '🍺', '🍷', '🥃', '🍾', '🚬', '💧', '📦',
];

const CAT_BADGE = ['green', 'blue', 'orange', 'purple', 'teal'];
const CAT_BG = ['var(--green-soft)', 'var(--blue-soft)', 'var(--orange-soft)', 'var(--purple-soft)', 'var(--teal-soft)'];

/* -------------------------------------------------------------------------
   3. STATE
------------------------------------------------------------------------- */
let DB = {categories: [], menu: [], tables: [], staffDirectory: [], orders: []};
let SESSION = {role: null, cafeId: null, cafeName: null, staffId: null, staffName: null};
let loginRole = null;               // 'admin' | 'waiter' | 'super'
let realtimeChannel = null;
let refreshTimer = null;

let waiterSelectedTableId = null;
let waiterCart = {};
let currentOrderType = 'ichkarida';
let currentPayMethod = 'naqd';

let adminMenuCatFilter = 'barchasi';
let waiterMenuCatFilter = 'barchasi';
/* --- Bildirishnoma (qongiroq) holati --- */
let NOTIF = {
    items: [],       /* xabarlar royxati */
    soundOn: false,  /* ovoz yoqilganmi */
    audioCtx: null,
    seen: {},        /* orderId -> oxirgi korilgan status */
    loaded: false,   /* dastlabki holat yuklandimi */
};
const NOTIF_KEY = 'gc_notif_read';

/* -------------------------------------------------------------------------
   4. HELPERS
------------------------------------------------------------------------- */
function money(n) {
    return Math.round(n || 0).toLocaleString('fr-FR').replace(/,/g, ' ') + " so'm";
}

function num(n) {
    return Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/,/g, ' ');
}

function nowStrFromISO(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('uz-UZ') + ' ' + d.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'});
}

function isToday(iso) {
    const d = new Date(iso), t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

/* Sana oralig'i uchun yordamchilar */
function dateOffsetISO(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
}

function monthStartISO() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function yearStartISO() {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function dmyLabel(iso) {
    if (!iso) return '—';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
}

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function esc(s) {
    return String(s === null || s === undefined ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Telefon raqamni birxillashtirish: faqat raqamlar saqlanadi, 998 bilan boshlanadi */
function normalizePhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9) digits = '998' + digits;
    if (digits.startsWith('8') && digits.length === 10) digits = '998' + digits.slice(1);
    return digits;
}

function prettyPhone(raw) {
    const d = normalizePhone(raw);
    if (d.length !== 12) return raw || '—';
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

function toast(msg, isErr) {
    const el = document.getElementById('toast');
    el.classList.toggle('err', !!isErr);
    el.innerHTML = icon(isErr ? 'x' : 'check', 15) + `<span>${esc(msg)}</span>`;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function supaErrorMessage(error) {
    return (error && error.message) ? error.message : "Noma'lum xatolik yuz berdi";
}

function categoryById(id) {
    return DB.categories.find(c => c.id === id);
}

function categoryIndex(id) {
    return DB.categories.findIndex(c => c.id === id);
}

function catBadgeClass(id) {
    const i = categoryIndex(id);
    return CAT_BADGE[i >= 0 ? i % CAT_BADGE.length : 0];
}

function catBg(id) {
    const i = categoryIndex(id);
    return CAT_BG[i >= 0 ? i % CAT_BG.length : 0];
}

function catName(id) {
    const c = categoryById(id);
    return c ? c.name : '—';
}

function catIcon(id) {
    const c = categoryById(id);
    return c && c.icon ? c.icon : 'grid';
}

function catKind(id) {
    const c = categoryById(id);
    return (c && c.kind) ? c.kind : 'menu';
}

/* -------------------------------------------------------------------------
   SUPER ADMIN YORDAMCHILARI
------------------------------------------------------------------------- */
function expiryClass(days, expired) {
    if (expired) return 'expiry-late';
    if (days <= 7) return 'expiry-warn';
    return 'expiry-ok';
}

function expiryText(days, expired) {
    if (expired) return "Muddati o'tgan";
    if (days === null || days === undefined) return 'Cheksiz';
    if (days === 0) return 'Bugun tugaydi';
    return days + ' kun qoldi';
}

function reportList(rep, key) {
    if (!rep || !rep[key]) return [];
    return Array.isArray(rep[key]) ? rep[key] : [];
}

function reportTotalPayments(rep) {
    return (rep && Array.isArray(rep.payments))
        ? rep.payments.reduce((s, p) => s + Number(p.amount), 0) : 0;
}

async function fetchSuperDashboard() {
    const {data, error} = await sb.rpc('super_admin_dashboard');
    if (error) throw error;
    return data || [];
}

async function fetchSuperPayments() {
    const {data, error} = await sb.from('subscription_payments')
        .select('*, cafes(name)').order('created_at', {ascending: false});
    if (error) throw error;
    return data || [];
}

/* -------------------------------------------------------------------------
   5. DATA LAYER — har bir o'qish SESSION.cafeId bilan cheklanadi
------------------------------------------------------------------------- */
async function fetchCategories() {
    const {data, error} = await sb.from('categories').select('*')
        .eq('cafe_id', SESSION.cafeId).order('sort_order');
    if (error) throw error;
    return data || [];
}

async function fetchMenu() {
    const {data, error} = await sb.from('menu_items').select('*')
        .eq('cafe_id', SESSION.cafeId).order('created_at');
    if (error) throw error;
    return data || [];
}

async function fetchTables() {
    const {data, error} = await sb.from('restaurant_tables').select('*')
        .eq('cafe_id', SESSION.cafeId).order('created_at');
    if (error) throw error;
    return data || [];
}

async function fetchStaffDirectory() {
    const {data, error} = await sb.from('staff_directory').select('*')
        .eq('cafe_id', SESSION.cafeId).order('full_name');
    if (error) throw error;
    return data || [];
}

async function fetchOrders() {
    const {data, error} = await sb
        .from('orders')
        .select('*, order_items(*), restaurant_tables(name)')
        .eq('cafe_id', SESSION.cafeId)
        .order('created_at', {ascending: false});
    if (error) throw error;
    return data || [];
}

function decorateOrder(o) {
    const waiter = DB.staffDirectory.find(s => s.id === o.waiter_id);
    return {
        ...o,
        tableName: o.restaurant_tables ? o.restaurant_tables.name : '—',
        waiterName: waiter ? waiter.full_name : '—',
        items: o.order_items || [],
        createdAtLabel: nowStrFromISO(o.created_at),
    };
}

async function refreshFromDB() {
    const [categories, menu, tables, staffDirectory, orders] = await Promise.all([
        fetchCategories(), fetchMenu(), fetchTables(), fetchStaffDirectory(), fetchOrders(),
    ]);
    DB.categories = categories;
    DB.menu = menu;
    DB.tables = tables;
    DB.staffDirectory = staffDirectory;
    DB.orders = orders.map(decorateOrder);
}

async function loadReportData() {
    const [daily, catRev, topItems, waiterRep] = await Promise.all([
        sb.from('v_daily_summary').select('*').eq('cafe_id', SESSION.cafeId),
        sb.from('v_category_revenue').select('*').eq('cafe_id', SESSION.cafeId),
        sb.from('v_top_menu_items').select('*').eq('cafe_id', SESSION.cafeId).limit(6),
        sb.from('v_waiter_report').select('*').eq('cafe_id', SESSION.cafeId),
    ]);
    if (daily.error) throw daily.error;
    return {
        daily: daily.data || [],
        catRev: catRev.data || [],
        topItems: topItems.data || [],
        waiterRep: waiterRep.data || [],
    };
}

/* -------------------------------------------------------------------------
   6. HISOBOT — ixtiyoriy sana oralig'i (RPC + CSV eksport)
------------------------------------------------------------------------- */
async function fetchReportRange(fromISO, toISO) {
    /* Serverda sana oralig'i bo'yicha filtrlash: RPC mavjud bo'lmasa,
       xato qaytadi va foydalanuvchiga tushunarli xabar ko'rsatiladi. */
    const {data, error} = await sb.rpc('cafe_report_range', {
        p_cafe_id: SESSION.cafeId,
        p_from: fromISO,
        p_to: toISO,
        p_password: SESSION.staffPassword || '',
    });
    if (error) throw error;
    return data || {};
}

/* CSV maydonini xavfsiz qilish */
function csvCell(v) {
    const s = String(v === null || v === undefined ? '' : v);
    return '"' + s.replace(/"/g, '""') + '"';
}

function csvFromRows(header, rows) {
    const head = header.map(csvCell).join(',');
    const body = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    /* Excel UTF-8 ni to'g'ri o'qishi uchun BOM */
    return '\uFEFF' + head + '\r\n' + body + '\r\n';
}

function downloadTextFile(filename, text, mime) {
    const blob = new Blob([text], {type: (mime || 'text/csv') + ';charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function slugForFile(s) {
    return String(s || 'kafe').toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'kafe';
}

/* -------------------------------------------------------------------------
   7.5 BILDIRISHNOMA — tayyor buyurtma haqida afitsantga xabar
   -------------------------------------------------------------------------
   Admin holatni TAYYOR qilsa, shu buyurtmani qabul qilgan afitsantning
   brauzeriga realtime orqali xabar yetadi: toast + ovoz + qongiroq yozuvi.
   ------------------------------------------------------------------------- */

const Notif = {

    /* Brauzer ovoz tizimini tayyorlash */
    initAudio() {
        if (NOTIF.audioCtx) return NOTIF.audioCtx;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            NOTIF.audioCtx = new Ctx();
        } catch (e) {
            NOTIF.audioCtx = null;
        }
        return NOTIF.audioCtx;
    },

    /* Ohang: tayyor uchun yuqoriga, yangi uchun pastga */
    playChime(kind) {
        const ctx = Notif.initAudio();
        if (!ctx) return;
        try {
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            const notes = kind === 'new'
                ? [{f: 660, t: 0}, {f: 495, t: 0.14}]
                : [{f: 880, t: 0}, {f: 1174, t: 0.13}, {f: 1568, t: 0.26}];

            notes.forEach(n => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = n.f;
                const start = now + n.t;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.45);
            });
        } catch (e) { /* ovoz bloklangan — jim otamiz */ }
    },

    /* Ovozni yoqish yoki ochirish */
    toggleSound() {
        NOTIF.soundOn = !NOTIF.soundOn;
        const btn = document.getElementById('sound-toggle');
        const label = btn ? btn.querySelector('.st-label') : null;

        if (NOTIF.soundOn) {
            Notif.initAudio();
            if (NOTIF.audioCtx && NOTIF.audioCtx.state === 'suspended') NOTIF.audioCtx.resume();
            Notif.playChime('ready');
            if (label) label.textContent = 'Ovoz yoniq';
            if (btn) btn.classList.add('on');
            toast('Ovoz yoqildi — tayyor buyurtmalardan xabar beriladi');
        } else {
            if (label) label.textContent = 'Ovozni yoqish';
            if (btn) btn.classList.remove('on');
            toast('Ovoz ochirildi');
        }
    },

    /* Saqlangan oqilganlar royxatini yuklash */
    loadRead() {
        try {
            const raw = localStorage.getItem(NOTIF_KEY);
            if (raw) NOTIF.seen = JSON.parse(raw) || {};
        } catch (e) { NOTIF.seen = {}; }
    },

    saveRead() {
        try {
            const keys = Object.keys(NOTIF.seen).slice(-200);
            const slim = {};
            keys.forEach(k => { slim[k] = NOTIF.seen[k]; });
            NOTIF.seen = slim;
            localStorage.setItem(NOTIF_KEY, JSON.stringify(slim));
        } catch (e) {}
    },

    /* Buyurtmalar holatini kuzatish — faqat OzGARGANINI xabar qilamiz */
    watchOrders() {
        if (SESSION.role !== 'waiter') return;

        DB.orders.forEach(o => {
            const prev = NOTIF.seen[o.id];

            /* Birinchi yuklashda mavjud holatlarni korilgan deb belgilaymiz */
            if (!NOTIF.loaded) {
                NOTIF.seen[o.id] = o.status;
                return;
            }

            if (prev === undefined) {
                if (o.status === 'yangi' && o.waiter_id === SESSION.staffId) {
                    Notif.push(o, 'yangi');
                }
                NOTIF.seen[o.id] = o.status;
                return;
            }

            if (prev !== o.status) {
                if (o.status === 'tayyor') {
                    /* Faqat shu buyurtmani qabul qilgan afitsantga xabar */
                    if (o.waiter_id === SESSION.staffId) Notif.push(o, 'tayyor');
                } else if (o.status === 'tolangan') {
                    Notif.markReadByOrder(o.id);
                }
                NOTIF.seen[o.id] = o.status;
            }
        });

        NOTIF.loaded = true;
        Notif.saveRead();
    },

    /* Yangi xabar qoshish */
    push(order, kind) {
        const key = order.id + ':' + order.status;
        if (NOTIF.items.some(n => n.key === key)) return;

        NOTIF.items.unshift({
            key: key,
            orderId: order.id,
            tableName: order.tableName,
            status: order.status,
            kind: kind,
            at: Date.now(),
            read: false,
        });
        if (NOTIF.items.length > 40) NOTIF.items.pop();

        Notif.render();

        if (kind === 'tayyor') {
            Notif.alertReady(order);
        } else {
            toast('Yangi buyurtma: ' + order.tableName, false);
            if (NOTIF.soundOn) Notif.playChime('new');
        }
    },

    /* TAYYOR xabari — katta toast + ovoz */
    alertReady(order) {
        const el = document.getElementById('toast-alert');
        if (el) {
            el.className = 'toast toast-alert show ready';
            el.innerHTML =
                '<div class="ta-ico">' + icon('bellRing', 22) + '</div>' +
                '<div class="ta-body">' +
                '<div class="ta-title">Buyurtma TAYYOR</div>' +
                '<div class="ta-sub">' + esc(order.tableName) + ' — taomni olib boring</div>' +
                '</div>';
            clearTimeout(Notif._alertT);
            Notif._alertT = setTimeout(() => el.classList.remove('show'), 9000);
        }

        if (NOTIF.soundOn) Notif.playChime('ready');
        Notif.setTitle(true);
    },

    /* Qongiroqni ochish yoki yopish */
    toggleBell() {
        const panel = document.getElementById('bell-panel');
        if (!panel) return;
        const willShow = panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !willShow);
        if (willShow) Notif.render();
    },

    unreadCount() {
        return NOTIF.items.filter(n => !n.read).length;
    },

    /* Qongiroq panelini chizish */
    render() {
        const btn = document.getElementById('bell-btn');
        const countEl = document.getElementById('bell-count');
        const listEl = document.getElementById('bell-list');
        const subEl = document.getElementById('bell-sub');
        if (!btn || !listEl) return;

        const unread = Notif.unreadCount();

        if (countEl) {
            countEl.textContent = unread > 9 ? '9+' : unread;
            countEl.classList.toggle('hidden', unread === 0);
        }
        btn.classList.toggle('has-unread', unread > 0);

        if (subEl) {
            subEl.textContent = NOTIF.items.length
                ? (unread ? unread + ' ta oqilmagan xabar' : 'Barchasi oqilgan')
                : 'Yangi xabar yoq';
        }

        if (!NOTIF.items.length) {
            listEl.innerHTML = '<div class="empty-hint" style="padding:18px 0;">Hozircha xabar yoq.<br><span class="muted">Buyurtma tayyor bolganda shu yerda korinadi.</span></div>';
            return;
        }

        listEl.innerHTML = NOTIF.items.map(n => {
            const isReady = n.status === 'tayyor';
            const mins = Math.round((Date.now() - n.at) / 60000);
            const when = mins < 1 ? 'hozir' : (mins < 60 ? mins + ' daq. oldin' : Math.round(mins / 60) + ' soat oldin');
            return '<div class="bell-item ' + (n.read ? '' : 'unread') + ' ' + (isReady ? 'ready' : 'fresh') + '" onclick="UI.openNotifOrder(&quot;' + n.orderId + '&quot;)">' +
                '<div class="bi-ico">' + icon(isReady ? 'bellRing' : 'clipboard', 17) + '</div>' +
                '<div class="bi-body">' +
                '<div class="bi-title">' + (isReady ? 'TAYYOR — ' : 'Yangi — ') + esc(n.tableName) + '</div>' +
                '<div class="bi-sub">' + (isReady ? 'Taomni olib boring' : 'Buyurtma qabul qilindi') + ' &middot; ' + when + '</div>' +
                '</div>' +
                (n.read ? '' : '<span class="bi-dot"></span>') +
                '</div>';
        }).join('');
    },

    markRead(key) {
        const n = NOTIF.items.find(x => x.key === key);
        if (n) n.read = true;
        Notif.render();
        if (Notif.unreadCount() === 0) Notif.setTitle(false);
    },

    markReadByOrder(orderId) {
        NOTIF.items.forEach(n => { if (n.orderId === orderId) n.read = true; });
        Notif.render();
        if (Notif.unreadCount() === 0) Notif.setTitle(false);
    },

    markAllRead() {
        NOTIF.items.forEach(n => { n.read = true; });
        Notif.render();
        Notif.setTitle(false);
        toast('Barcha xabarlar oqilgan deb belgilandi');
    },

    /* Sahifa sarlavhasida oqilmaganlar soni */
    setTitle(hasUnread) {
        if (SESSION.role !== 'waiter') return;
        const base = (SESSION.cafeName || 'Afitsant') + ' — ' + APP_NAME;
        document.title = hasUnread ? '(' + Notif.unreadCount() + ') ' + base : base;
    },

    /* Xabar bosilganda buyurtma chekini ochish */
    openNotifOrder(orderId) {
        const n = NOTIF.items.find(x => x.orderId === orderId && !x.read);
        if (n) Notif.markRead(n.key);
        const o = DB.orders.find(x => x.id === orderId);
        if (!o) {
            toast('Buyurtma topilmadi', true);
            return;
        }
        UI.openReceipt(orderId);
    },

    reset() {
        NOTIF.items = [];
        NOTIF.seen = {};
        NOTIF.loaded = false;
        Notif.setTitle(false);
        const el = document.getElementById('toast-alert');
        if (el) el.classList.remove('show');
        Notif.render();
    },
};

/* -------------------------------------------------------------------------
   7. REALTIME
------------------------------------------------------------------------- */
function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
        try {
            await refreshFromDB();
            Notif.watchOrders();   /* yangi / tayyor buyurtmalarni tekshiradi */
            UI.rerenderActive();
        } catch (e) {
            console.error(e);
        }
    }, 350);
}

function subscribeRealtime() {
    if (realtimeChannel) return;
    const filter = `cafe_id=eq.${SESSION.cafeId}`;
    realtimeChannel = sb.channel('green-chef-pos-' + SESSION.cafeId)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'orders', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'order_items'}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'restaurant_tables', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'menu_items', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'categories', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'staff', filter}, scheduleRefresh)
        .subscribe();
}

function unsubscribeRealtime() {
    if (realtimeChannel) {
        sb.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
}

/* -------------------------------------------------------------------------
   8. MODAL
------------------------------------------------------------------------- */
const Modal = {
    open(html, size) {
        document.getElementById('modal-root').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) Modal.close()">
        <div class="modal ${size === 'wide' ? 'wide' : ''}">${html}</div>
      </div>`;
    },
    close() {
        document.getElementById('modal-root').innerHTML = '';
    }
};

/* -------------------------------------------------------------------------
   9. UI CONTROLLER
------------------------------------------------------------------------- */
const UI = {

    /* ---------- CONNECTION ---------- */
    async checkConnection() {
        const el = document.getElementById('conn-status');
        try {
            const {error} = await sb.from('cafes').select('id').limit(1);
            if (error) throw error;
            el.className = 'conn-banner ok';
            el.innerHTML = icon('check', 14) + ' Supabase bilan ulanish muvaffaqiyatli';
            setTimeout(() => el.classList.add('hidden'), 1600);
        } catch (e) {
            el.className = 'conn-banner err';
            el.innerHTML = icon('x', 14) + ` Ulanish xatosi: ${esc(supaErrorMessage(e))} — app.js dagi CONFIG ni tekshiring`;
        }
    },

    /* ---------- LOGIN FLOW ---------- */
    chooseRole(role) {
        loginRole = role;

        const headEl = document.querySelector('.login-head');

        document.getElementById('register-form').classList.remove('show');
        document.getElementById('login-form').classList.remove('show');

        /* Rol tanlanganini yozib qo'yamiz — keyingi qadamda tekshiramiz */
        try { sessionStorage.setItem('gc_role', role); } catch (e) {}

        const meta = {
            admin:  {title: 'Admin sifatida kirish',       sub: 'Telefon raqam va parolni kiriting',            ic: 'settings'},
            waiter: {title: 'Afitsant sifatida kirish',    sub: 'Telefon raqam va parolni kiriting',            ic: 'clipboard'},
            super:  {title: 'Super Admin sifatida kirish', sub: 'Tizim egasi sifatida kirish',                  ic: 'chart'},
        }[role] || {title: 'Kirish', sub: 'Telefon raqam va parolni kiriting', ic: 'lock'};

        /* Login oynasi sarlavhasi va izohi */
        document.getElementById('login-form-title').textContent = meta.title;
        const subEl = document.getElementById('login-sub');
        if (subEl) subEl.textContent = meta.sub;

        /* Tanlangan rolni ko'rsatuvchi belgi */
        const badge = document.getElementById('login-role-badge');
        if (badge) {
            const labels = {admin: 'Admin', waiter: 'Afitsant', super: 'Super Admin'};
            badge.innerHTML = icon(meta.ic, 13) + '<span>' + (labels[role] || role) + '</span>';
            badge.classList.remove('hidden');
        }

        /* Tanlangan kartani belgilaymiz */
        document.querySelectorAll('.role-card').forEach(card => card.classList.remove('picked'));
        const roleOrder = {admin: 0, waiter: 1, super: 2};
        const cards = document.querySelectorAll('.role-card');
        if (cards[roleOrder[role]] !== undefined) cards[roleOrder[role]].classList.add('picked');

        /* Super admin belgisi boshqa rangda */
        if (badge) badge.classList.toggle('super', role === 'super');

        /* Kartalar guruhini butunlay yashiramiz — endi faqat login oynasi qoladi */
        document.getElementById('role-grid').classList.add('hidden');
        if (headEl) headEl.classList.add('hidden');

        /* Faqat rol tanlanganidan KEYIN login oynasi ko'rinadi */
        document.getElementById('login-form').classList.add('show');
        document.getElementById('login-err').textContent = '';

        /* Telefon maydoniga fokus — foydalanuvchi darrov yoza boshlaydi */
        setTimeout(() => {
            const ph = document.getElementById('login-phone');
            if (ph) ph.focus();
        }, 60);
    },

    backToRoles() {
        loginRole = null;
        try { sessionStorage.removeItem('gc_role'); } catch (e) {}

        document.getElementById('login-form').classList.remove('show');
        document.getElementById('register-form').classList.remove('show');
        document.getElementById('login-err').textContent = '';
        document.getElementById('register-err').textContent = '';

        /* Rol belgisini yashiramiz va karta belgisini o'chiramiz */
        const badge = document.getElementById('login-role-badge');
        if (badge) { badge.classList.add('hidden'); badge.classList.remove('super'); }
        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('picked'));

        /* Kartalar guruhini va sarlavhani qaytaramiz */
        document.getElementById('role-grid').classList.remove('hidden');
        const headEl = document.querySelector('.login-head');
        if (headEl) headEl.classList.remove('hidden');

        /* Login maydonlarini tozalaymiz */
        const ph = document.getElementById('login-phone');
        const pw = document.getElementById('login-password');
        if (ph) ph.value = '';
        if (pw) pw.value = '';

        /* Sarlavhani boshlang'ich holatga qaytaramiz */
        const t = document.getElementById('login-form-title');
        if (t) t.textContent = 'Xush kelibsiz';
        const s = document.getElementById('login-sub');
        if (s) s.textContent = 'Tizimga kirish uchun avval rolni tanlang';
    },

    showRegister() {
        document.getElementById('login-form').classList.remove('show');
        document.getElementById('register-form').classList.add('show');
        UI.setRangePresetDefaults && UI.setRangePresetDefaults();
    },

    async login() {
        const phone = document.getElementById('login-phone').value.trim();
        const password = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-err');
        errEl.textContent = '';

        /* Rol tanlanmagan bo'lsa — avval rol tanlashga qaytaramiz */
        if (!loginRole) {
            errEl.textContent = "Avval rolni tanlang";
            UI.backToRoles();
            return;
        }

        if (!phone || !password) {
            errEl.textContent = "Telefon raqam va parolni kiriting";
            return;
        }

        const {data, error} = await sb.rpc('staff_login', {p_phone: phone, p_password: password});
        if (error) {
            errEl.textContent = supaErrorMessage(error);
            return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
            errEl.textContent = "Telefon raqam yoki parol noto'g'ri";
            return;
        }

        /* Tanlangan rol bilan hisobning roli mos kelishi shart.
           Bu tasodifiy xatolarning oldini oladi (masalan, admin kartasini
           bosib afitsant parolini kiritish). Super Admin istisno. */
        if (loginRole !== 'super' && row.role !== loginRole) {
            const names = {admin: 'Admin', waiter: 'Afitsant', super: 'Super Admin'};
            errEl.textContent = "Bu hisob " + (names[row.role] || row.role) +
                ". Iltimos, " + (names[row.role] || row.role) + " rolini tanlab kiring.";
            return;
        }

        document.getElementById('login-password').value = '';
        await UI.startSession(row);
    },

    /* Login natijasiga qarab panelni ochish */
    async startSession(row) {
        SESSION = {
            role: row.role,
            cafeId: row.cafe_id,
            cafeName: row.cafe_name,
            staffId: row.staff_id,
            staffName: row.full_name,
        };

        if (row.role === 'super') {
            SUPER = {id: row.staff_id, name: row.full_name, phone: row.phone};
            document.getElementById('screen-login').classList.add('hidden');
            document.getElementById('screen-super').classList.remove('hidden');
            await UI.loadSuperData();
            return;
        }

        document.getElementById('screen-login').classList.add('hidden');
        if (row.role === 'admin') {
            document.getElementById('screen-admin').classList.remove('hidden');
            UI.applyCafeBranding();
            await refreshFromDB();
            subscribeRealtime();
            UI.renderAll();
        } else {
            document.getElementById('screen-waiter').classList.remove('hidden');
            UI.applyCafeBranding();
            await refreshFromDB();

            /* Bildirishnoma tizimini tayyorlaymiz (afitsant uchun) */
            Notif.loadRead();
            Notif.reset();               /* eski xabarlarni tozalaymiz */
            await refreshFromDB();       /* holatlarni bir marta yozib olamiz */
            Notif.watchOrders();         /* boshlangich holatni belgilaymiz */
            Notif.render();

            subscribeRealtime();
            UI.renderWaiterPeople();
            UI.renderWaiterTablesGrid();
        }
    },

    /* Har bir kafe o'z nomini ko'rsatadi (tizim nomi emas) */
    applyCafeBranding() {
        const name = SESSION.cafeName || "Kafe";
        const adminEl = document.getElementById('admin-cafe-name');
        const waiterEl = document.getElementById('waiter-cafe-name');
        if (adminEl) adminEl.textContent = name;
        if (waiterEl) waiterEl.textContent = name;
        document.title = name + ' — ' + APP_NAME;
    },

    async registerCafe() {
        const name = document.getElementById('reg-cafe').value.trim();
        const adminName = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const months = parseInt(document.getElementById('reg-months').value, 10) || 1;
        const errEl = document.getElementById('register-err');
        errEl.textContent = '';

        if (!name || !adminName || !phone || !password) {
            errEl.textContent = "Barcha maydonlarni to'ldiring";
            return;
        }
        if (password.length < 4) {
            errEl.textContent = "Parol kamida 4 belgidan iborat bo'lishi kerak";
            return;
        }

        const {error} = await sb.rpc('register_cafe', {
            p_cafe_name: name, p_admin_name: adminName, p_phone: phone,
            p_password: password, p_months: months
        });
        if (error) {
            errEl.textContent = supaErrorMessage(error);
            return;
        }
        toast('Kafe yaratildi! Endi telefon va parol bilan kiring');
        ['reg-cafe', 'reg-name', 'reg-phone', 'reg-password'].forEach(id => document.getElementById(id).value = '');
        UI.chooseRole('admin');
        document.getElementById('login-phone').value = phone;
    },

    logout() {
        SUPER = {id: null, name: null, phone: null};
        loginRole = null;
        Notif.reset();
        try { sessionStorage.removeItem('gc_role'); } catch (e) {}
        superCafes = [];
        document.getElementById('screen-super').classList.add('hidden');
        unsubscribeRealtime();
        SESSION = {role: null, cafeId: null, cafeName: null, staffId: null, staffName: null};
        waiterSelectedTableId = null;
        waiterCart = {};
        currentOrderType = 'ichkarida';
        currentPayMethod = 'naqd';
        adminMenuCatFilter = 'barchasi';
        waiterMenuCatFilter = 'barchasi';
        document.getElementById('screen-admin').classList.add('hidden');
        document.getElementById('screen-waiter').classList.add('hidden');
        document.getElementById('screen-login').classList.remove('hidden');
        UI.backToRoles();
        document.getElementById('waiter-order-area').classList.add('hidden');
        document.getElementById('waiter-table-picker').classList.remove('hidden');
    },

    /* ---------- NAV ---------- */
    switchAdminPanel(id) {
        document.querySelectorAll('#screen-admin .panel').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#screen-admin .nav-list button').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
        UI.renderAll();
        if (id === 'a-report') UI.updateRangePreview();
    },
    switchWaiterPanel(id) {
        document.querySelectorAll('#screen-waiter .panel').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#screen-waiter .nav-list button').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
        if (id === 'w-myorders') UI.renderWaiterMyOrders();
    },
    switchSuperPanel(id) {
        document.querySelectorAll('#screen-super .panel').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#screen-super .nav-list button').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
        if (id === 's-report') UI.renderSuperReport();
    },

    rerenderActive() {
        if (SESSION.role === 'admin') {
            UI.renderAll();
        } else if (SESSION.role === 'waiter') {
            if (waiterSelectedTableId) {
                UI.renderWaiterMenuGrid();
                UI.renderActiveTablesStrip();
            } else {
                UI.renderWaiterTablesGridSync();
            }
            UI.renderWaiterMyOrders();
        }
    },

    async renderAll() {
        UI.renderAdminPeople();
        UI.renderDashboard();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
        UI.renderAdminTablesGrid();
        UI.renderOrdersTable();
        await UI.renderStaffTable();
        await UI.renderReport();
    },

    renderAdminPeople() {
        document.getElementById('admin-people').innerHTML = DB.staffDirectory
            .filter(s => s.role === 'waiter')
            .map(w => `
        <div class="avatar-chip">
          <div class="av">${initials(w.full_name)}</div>
          <div class="info"><div class="n">${esc(w.full_name)}</div><div class="r">${w.is_active ? 'Afitsant' : 'Nofaol'}</div></div>
        </div>
      `).join('') || `<div class="muted" style="padding:8px 10px;">Afitsant yo'q</div>`;
    },

    renderWaiterPeople() {
        document.getElementById('waiter-people').innerHTML = `
      <div class="avatar-chip">
        <div class="av">${initials(SESSION.staffName)}</div>
        <div class="info"><div class="n">${esc(SESSION.staffName || '—')}</div><div class="r">Afitsant</div></div>
      </div>`;
    },

    renderSuperPeople() {
        const el = document.getElementById('super-people');
        if (!el) return;
        el.innerHTML = `
      <div class="avatar-chip">
        <div class="av">${initials(SUPER.name)}</div>
        <div class="info"><div class="n">${esc(SUPER.name || 'Super Admin')}</div><div class="r">Tizim egasi</div></div>
      </div>`;
    },

    statusPill(status) {
        const m = STATUS_META[status] || {label: status, cls: 'grey'};
        return `<span class="pill ${m.cls}">${m.label}</span>`;
    },
    payPill(method) {
        const m = PAY_META[method] || PAY_META.naqd;
        return `<span class="pill grey">${icon(m.icon, 12)} ${m.label}</span>`;
    },

    /* =========================================================
       DASHBOARD
    ========================================================= */
    renderDashboard() {
        const todays = DB.orders.filter(o => isToday(o.created_at));
        const revenue = todays.filter(o => o.status === 'tolangan').reduce((s, o) => s + Number(o.total_amount), 0);
        const busy = DB.tables.filter(t => t.status === 'band').length;

        const stats = [
            {lbl: 'Bugungi tushum', num: money(revenue), ic: 'cash', bg: 'var(--green-soft)', fg: 'var(--green-darker)'},
            {lbl: 'Bugungi buyurtmalar', num: todays.length, ic: 'clipboard', bg: 'var(--blue-soft)', fg: '#2E56BE'},
            {lbl: 'Band stollar', num: busy + ' / ' + DB.tables.length, ic: 'table', bg: 'var(--orange-soft)', fg: '#93650F'},
        ];
        document.getElementById('dash-stats').innerHTML = stats.map(s => `
      <div class="stat">
        <div class="stat-ico" style="background:${s.bg}; color:${s.fg};">${icon(s.ic, 20)}</div>
        <div><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>
      </div>
    `).join('');

        const recent = DB.orders.slice(0, 8);
        document.getElementById('dash-recent-orders').querySelector('tbody').innerHTML = recent.map(o => `
      <tr>
        <td><b>${esc(o.tableName)}</b></td>
        <td>${esc(o.waiterName)}</td>
        <td>${money(o.total_amount)}</td>
        <td>${UI.statusPill(o.status)}</td>
        <td class="muted">${esc(o.createdAtLabel)}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" class="empty-hint">Hali buyurtma yo'q</td></tr>`;
    },

    /* =========================================================
       MENYU + BO'LIMLAR
    ========================================================= */
    renderAdminMenuCatTiles() {
        const tiles = [{id: 'barchasi', name: 'Barchasi', icon: 'grid', kind: null}, ...DB.categories];
        document.getElementById('admin-menu-cat-tiles').innerHTML = tiles.map(c => {
            const count = c.id === 'barchasi' ? DB.menu.length : DB.menu.filter(m => m.category_id === c.id).length;
            const kindBadge = c.kind === 'extra' ? `<span class="ct-kind">Qo'sh.</span>` : '';
            return `
        <button class="cat-tile ${adminMenuCatFilter === c.id ? 'active' : ''}" onclick="UI.setAdminMenuCat('${c.id}')">
          ${kindBadge}
          <div class="ci">${icon(c.icon, 18)}</div>
          <div class="cn">${esc(c.name)}</div>
          <div class="cc">${count} ta</div>
        </button>`;
        }).join('');

        UI.renderCatToolbar();
    },

    /* Tanlangan bo'lim uchun tahrirlash / o'chirish qatori */
    renderCatToolbar() {
        const el = document.getElementById('admin-cat-toolbar');
        if (!el) return;
        if (adminMenuCatFilter === 'barchasi') {
            el.innerHTML = `
        <div class="row" style="gap:8px;">
          <span class="pill grey dot">Barcha bo'limlar: ${DB.categories.length} ta</span>
          <span class="pill grey dot">Qo'shimcha bo'limlar: ${DB.categories.filter(c => c.kind === 'extra').length} ta</span>
        </div>
        <div class="spacer"></div>
        <button class="btn ghost small" onclick="UI.openCategoryModal()">${icon('plus', 14)} Yangi bo'lim qo'shish</button>`;
            return;
        }
        const c = categoryById(adminMenuCatFilter);
        if (!c) {
            el.innerHTML = '';
            return;
        }
        const kind = CAT_KINDS[catKind(c.id)] || CAT_KINDS.menu;
        el.innerHTML = `
      <div class="row" style="gap:9px; min-width:0;">
        <div class="ci" style="width:34px;height:34px;border-radius:10px;background:var(--green-soft);color:var(--green-darker);display:flex;align-items:center;justify-content:center;">${icon(c.icon || 'grid', 17)}</div>
        <div style="min-width:0;">
          <div class="ct-title">${esc(c.name)}</div>
          <div class="muted">${DB.menu.filter(m => m.category_id === c.id).length} ta mahsulot · ${esc(kind.label)}</div>
        </div>
      </div>
      <div class="spacer"></div>
      <button class="btn ghost small" onclick="UI.openCategoryModal('${c.id}')">${icon('edit', 14)} Tahrirlash</button>
      <button class="btn danger small" onclick="UI.deleteCategory('${c.id}')">${icon('trash', 14)} Bo'limni o'chirish</button>`;
    },

    setAdminMenuCat(id) {
        adminMenuCatFilter = id;
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
    },

    renderAdminMenuGrid() {
        const q = (document.getElementById('admin-menu-search').value || '').toLowerCase().trim();
        const items = DB.menu.filter(m =>
            (adminMenuCatFilter === 'barchasi' || m.category_id === adminMenuCatFilter) &&
            (!q || m.name.toLowerCase().includes(q))
        );
        document.getElementById('admin-menu-grid').innerHTML = items.map(m => `
      <div class="product-card ${m.is_available ? '' : 'unavailable'}">
        <div class="admin-card-actions">
          <button class="icon-btn sm" title="${m.is_available ? 'Nofaol qilish' : 'Faollashtirish'}" onclick="UI.toggleAvailability('${m.id}', ${!m.is_available})">${icon(m.is_available ? 'check' : 'x', 14)}</button>
          <button class="icon-btn sm" title="Tahrirlash" onclick="UI.openMenuModal('${m.id}')">${icon('edit', 14)}</button>
          <button class="icon-btn sm danger" title="O'chirish" onclick="UI.deleteMenuItem('${m.id}')">${icon('trash', 14)}</button>
        </div>
        <div class="product-thumb" style="background:${catBg(m.category_id)};">${esc(m.emoji || '🍽️')}</div>
        <span class="pill ${catBadgeClass(m.category_id)} dot p-cat">${esc(catName(m.category_id))}</span>
        <div class="p-name">${esc(m.name)}</div>
        <div class="p-price">${money(m.price)}</div>
        ${catKind(m.category_id) === 'extra' ? `<div class="p-stock">${icon('wine', 11)} Qo'shimcha bo'lim</div>` : ''}
      </div>
    `).join('') || `<div class="empty-hint">Mahsulot topilmadi</div>`;
    },

    /* ---------- MAHSULOT QO'SHISH / TAHRIRLASH ---------- */
    openMenuModal(id) {
        const item = id ? DB.menu.find(m => m.id === id) : null;
        if (!DB.categories.length) {
            toast("Avval kamida bitta bo'lim qo'shing", true);
            UI.openCategoryModal();
            return;
        }
        const catOptions = DB.categories.map(c =>
            `<option value="${c.id}" ${item && item.category_id === c.id ? 'selected' : ''}>${esc(c.name)}${catKind(c.id) === 'extra' ? " (qo'shimcha)" : ''}</option>`
        ).join('');
        const emoji = item ? (item.emoji || '🍽️') : '🍽️';
        const emojiGrid = EMOJI_CHOICES.map(e =>
            `<button type="button" class="${e === emoji ? 'active' : ''}" onclick="UI.pickEmoji(this,'${e}')">${e}</button>`
        ).join('');

        Modal.open(`
      <div class="modal-head"><h3>${item ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="field"><label>Nomi</label><input type="text" id="mm-name" value="${item ? esc(item.name) : ''}" placeholder="Masalan: Lag'mon"></div>
      <div class="row" style="gap:12px; align-items:flex-start;">
        <div class="field" style="flex:1;"><label>Bo'lim</label><select id="mm-cat">${catOptions}</select></div>
        <div class="field" style="width:110px;"><label>Narxi (so'm)</label><input type="number" id="mm-price" value="${item ? item.price : ''}" placeholder="30000"></div>
      </div>
      <div class="field"><label>Belgi (emoji)</label>
        <input type="text" id="mm-emoji" value="${esc(emoji)}" maxlength="4" style="margin-bottom:10px;">
        <div class="emoji-picker">${emojiGrid}</div>
      </div>
      <div class="field"><label>Holat</label>
        <select id="mm-available">
          <option value="true" ${!item || item.is_available ? 'selected' : ''}>Faol (mijozlarga ko'rinadi)</option>
          <option value="false" ${item && !item.is_available ? 'selected' : ''}>Nofaol</option>
        </select>
      </div>
      <button class="btn primary block" onclick="UI.saveMenuItem('${item ? item.id : ''}')">${icon('check', 16)} Saqlash</button>
    `);
    },

    pickEmoji(btn, e) {
        document.getElementById('mm-emoji').value = e;
        btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    async saveMenuItem(id) {
        const name = document.getElementById('mm-name').value.trim();
        const category_id = document.getElementById('mm-cat').value;
        const price = parseInt(document.getElementById('mm-price').value, 10);
        const emoji = document.getElementById('mm-emoji').value.trim() || '🍽️';
        const is_available = document.getElementById('mm-available').value === 'true';

        if (!name || !price || price <= 0 || !category_id) {
            toast("Nom, bo'lim va narxni to'g'ri kiriting", true);
            return;
        }

        const payload = {name, category_id, price, emoji, is_available, cafe_id: SESSION.cafeId};
        let error;
        if (id) {
            /* Cafe izolyatsiyasi: faqat shu kafening mahsulotini yangilaymiz */
            ({error} = await sb.from('menu_items').update(payload).eq('id', id).eq('cafe_id', SESSION.cafeId));
        } else {
            ({error} = await sb.from('menu_items').insert(payload));
        }
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
        toast('Menyu saqlandi');
    },

    async toggleAvailability(id, makeAvailable) {
        const {error} = await sb.from('menu_items').update({is_available: makeAvailable})
            .eq('id', id).eq('cafe_id', SESSION.cafeId);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminMenuGrid();
    },

    /* MAVJUD MAHSULOTNI O'CHIRISH */
    async deleteMenuItem(id) {
        const item = DB.menu.find(m => m.id === id);
        if (!item) return;

        /* Buyurtmada ishlatilgan mahsulotni butunlay o'chirish tarixni buzadi,
           shuning uchun bunday mahsulot faqat nofaol qilinadi. */
        const usedInOrders = DB.orders.some(o => (o.items || []).some(it =>
            it.menu_item_id === id || it.item_name === item.name));

        Modal.open(`
      <div class="modal-head"><h3>Mahsulotni o'chirish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="modal-note ${usedInOrders ? 'warn' : ''}">
        <b>${esc(item.name)}</b> — ${money(item.price)}<br>
        ${usedInOrders
            ? "Bu mahsulot allaqachon buyurtmalarda ishlatilgan. Uni o'chirsak, eski hisobotlar <b>tarixi buziladi</b>. Shu sababli u menyudan yashiriladi (nofaol qilinadi) — nomi hisobotlarda saqlanib qoladi."
            : "Bu mahsulotni menyudan butunlay o'chirmoqchimisiz? Amalni qaytarish mumkin bo'lmaydi."}
      </div>
      <div class="row" style="gap:10px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn danger" style="flex:1" onclick="UI.confirmDeleteMenuItem('${id}')">${icon('trash', 15)} O'chirish</button>
      </div>
    `);
    },

    async confirmDeleteMenuItem(id) {
        const item = DB.menu.find(m => m.id === id);
        if (!item) return;
        const usedInOrders = DB.orders.some(o => (o.items || []).some(it =>
            it.menu_item_id === id || it.item_name === item.name));

        const btnEl = document.querySelector('.modal .btn.danger');
        if (btnEl) btnEl.disabled = true;

        let error;
        if (usedInOrders) {
            ({error} = await sb.from('menu_items').update({is_available: false})
                .eq('id', id).eq('cafe_id', SESSION.cafeId));
        } else {
            ({error} = await sb.from('menu_items').delete().eq('id', id).eq('cafe_id', SESSION.cafeId));
        }
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
        toast(usedInOrders ? "Mahsulot menyudan yashirildi (nofaol)" : "Mahsulot o'chirildi");
    },

    /* ---------- BO'LIM (KATEGORIYA) QO'SHISH / O'CHIRISH ---------- */
    openCategoryModal(id) {
        const cat = id ? categoryById(id) : null;
        const kind = cat ? catKind(cat.id) : 'menu';
        const chosenIcon = cat && cat.icon ? cat.icon : 'bowl';

        const iconGrid = CAT_ICON_CHOICES.map(n =>
            `<button type="button" class="ico-opt ${n === chosenIcon ? 'active' : ''}" data-ic="${n}" onclick="UI.pickCatIcon(this)">${icon(n, 19)}</button>`
        ).join('');

        /* Taklif etiladigan tez bo'limlar — masalan sigaret, vino */
        const presets = [
            {name: 'Sigaret', icon: 'box', kind: 'extra'},
            {name: 'Vino va spirtli ichimliklar', icon: 'wine', kind: 'extra'},
            {name: 'Sovuq ichimliklar', icon: 'drink', kind: 'menu'},
            {name: 'Shirinliklar', icon: 'grid', kind: 'menu'},
        ];
        const presetBtns = presets.map(p =>
            `<button class="qm" onclick="UI.applyCatPreset('${esc(p.name)}','${p.icon}','${p.kind}')">${esc(p.name)}</button>`
        ).join('');

        Modal.open(`
      <div class="modal-head"><h3>${cat ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>

      <div class="modal-note">
        <b>Turi:</b> oddiy menyu bo'limi (taom, ichimlik) yoki <b>qo'shimcha bo'lim</b> —
        sigaret, vino kabi menyudan tashqari narsalar uchun.
      </div>

      <div class="field"><label>Bo'lim nomi</label>
        <input type="text" id="cm-name" value="${cat ? esc(cat.name) : ''}" placeholder="Masalan: Sigaret"></div>

      <div class="field"><label>Tez tanlash</label>
        <div class="quick-months">${presetBtns}</div></div>

      <div class="row" style="gap:12px; align-items:flex-start;">
        <div class="field" style="flex:1;"><label>Turi</label>
          <select id="cm-kind">
            <option value="menu" ${kind === 'menu' ? 'selected' : ''}>Menyu (taom / ichimlik)</option>
            <option value="extra" ${kind === 'extra' ? 'selected' : ''}>Qo'shimcha bo'lim (sigaret, vino...)</option>
          </select>
        </div>
        <div class="field" style="width:110px;"><label>Tartib</label>
          <input type="number" id="cm-sort" value="${cat ? (cat.sort_order || 0) : DB.categories.length}"></div>
      </div>

      <div class="field"><label>Belgisi (ikonka)</label>
        <div class="icon-picker">${iconGrid}</div></div>

      <button class="btn primary block" onclick="UI.saveCategory('${cat ? cat.id : ''}')">${icon('check', 16)} Saqlash</button>
    `);
    },

    pickCatIcon(btn) {
        btn.parentElement.querySelectorAll('.ico-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    applyCatPreset(name, ic, kind) {
        document.getElementById('cm-name').value = name;
        if (document.getElementById('cm-kind')) document.getElementById('cm-kind').value = kind;
        const btn = document.querySelector(`.icon-picker .ico-opt[data-ic="${ic}"]`);
        if (btn) UI.pickCatIcon(btn);
    },

    async saveCategory(id) {
        const name = document.getElementById('cm-name').value.trim();
        const kind = document.getElementById('cm-kind').value;
        const sort_order = parseInt(document.getElementById('cm-sort').value, 10) || 0;
        const iconEl = document.querySelector('.icon-picker .ico-opt.active');
        const ic = iconEl ? iconEl.dataset.ic : 'bowl';

        if (!name) {
            toast("Bo'lim nomini kiriting", true);
            return;
        }

        const payload = {name, icon: ic, kind, sort_order, cafe_id: SESSION.cafeId};
        let error;
        if (id) {
            ({error} = await sb.from('categories').update(payload).eq('id', id).eq('cafe_id', SESSION.cafeId));
        } else {
            ({error} = await sb.from('categories').insert(payload));
        }
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
        toast(id ? "Bo'lim yangilandi" : "Yangi bo'lim qo'shildi");
    },

    async deleteCategory(id) {
        const c = categoryById(id);
        if (!c) return;
        const count = DB.menu.filter(m => m.category_id === id).length;

        Modal.open(`
      <div class="modal-head"><h3>Bo'limni o'chirish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="modal-note ${count ? 'warn' : ''}">
        <b>${esc(c.name)}</b> bo'limida <b>${count} ta</b> mahsulot bor.<br>
        ${count
            ? "Bo'lim o'chirilganda uning barcha mahsulotlari ham menyudan yo'qoladi. Eski hisobotlar saqlanib qoladi."
            : "Bu bo'sh bo'limni o'chirmoqchimisiz?"}
      </div>
      <div class="row" style="gap:10px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn danger" style="flex:1" onclick="UI.confirmDeleteCategory('${id}')">${icon('trash', 15)} O'chirish</button>
      </div>
    `);
    },

    async confirmDeleteCategory(id) {
        const btnEl = document.querySelector('.modal .btn.danger');
        if (btnEl) btnEl.disabled = true;

        const {error} = await sb.rpc('delete_category', {p_cafe_id: SESSION.cafeId, p_id: id});
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }
        Modal.close();
        if (adminMenuCatFilter === id) adminMenuCatFilter = 'barchasi';
        await refreshFromDB();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
        toast("Bo'lim o'chirildi");
    },

    /* =========================================================
       STOLLAR
    ========================================================= */
    renderAdminTablesGrid() {
        document.getElementById('admin-tables-grid').innerHTML = DB.tables.map(t => {
            const order = DB.orders.find(o => o.table_id === t.id && o.status !== 'tolangan');
            const busy = t.status === 'band';
            const sub = busy && order
                ? `${order.waiterName} · ${money(order.total_amount)}`
                : (busy ? 'Band' : "Bo'sh");
            return `
      <div class="table-tile ${busy ? 'busy' : 'empty'}" onclick="UI.openTableInfo('${t.id}')">
        <div class="tt-del">
          <button class="icon-btn sm danger" title="Stolni o'chirish"
            onclick="event.stopPropagation(); UI.deleteTable('${t.id}')">${icon('trash', 14)}</button>
        </div>
        <div class="tt-ico">${icon(busy ? 'clipboard' : 'table', 20)}</div>
        <div class="tt-name">${esc(t.name)}</div>
        <div class="tt-status">${busy ? 'Band' : "Bo'sh"}</div>
        <div class="tt-seats">${icon('users', 12)} ${t.seats || 4} kishi</div>
        <div class="muted" style="margin-top:6px; font-size:11px;">${esc(sub)}</div>
      </div>`;
        }).join('') || `<div class="empty-hint">Hali stol qo'shilmagan</div>`;
    },

    openTableInfo(id) {
        const t = DB.tables.find(x => x.id === id);
        if (!t) return;
        const order = DB.orders.find(o => o.table_id === id && o.status !== 'tolangan');
        Modal.open(`
      <div class="modal-head"><h3>${esc(t.name)}</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="modal-note">
        O'rindiqlar: <b>${t.seats || 4}</b><br>
        Holat: <b>${t.status === 'band' ? 'Band' : "Bo'sh"}</b>
        ${order ? `<br>Afitsant: <b>${esc(order.waiterName)}</b><br>Joriy summa: <b>${money(order.total_amount)}</b>` : ''}
      </div>
      <div class="row" style="gap:10px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Yopish</button>
        <button class="btn danger" style="flex:1" onclick="Modal.close(); UI.deleteTable('${id}')">${icon('trash', 15)} Stolni o'chirish</button>
      </div>
    `);
    },

    addTable() {
        const seatOptions = [2, 4, 6, 8, 10, 12].map(s =>
            `<button class="seat-opt ${s === 4 ? 'active' : ''}" onclick="UI.pickSeats(this, ${s})">${s} kishi</button>`
        ).join('');
        const nextNum = DB.tables.length + 1;
        Modal.open(`
      <div class="modal-head"><h3>Stol qo'shish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="field"><label>Stol nomi / raqami</label>
        <input type="text" id="at-name" value="${nextNum}-stol" placeholder="Masalan: 5-stol yoki VIP-1"></div>
      <div class="field"><label>O'rindiqlar soni</label>
        <div class="seat-picker">${seatOptions}</div></div>
      <button class="btn primary block" onclick="UI.saveTable()">${icon('check', 16)} Qo'shish</button>
    `);
    },

    pickSeats(btn, s) {
        btn.parentElement.querySelectorAll('.seat-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    async saveTable() {
        const name = document.getElementById('at-name').value.trim();
        const seatEl = document.querySelector('.seat-picker .seat-opt.active');
        const seats = seatEl ? parseInt(seatEl.textContent, 10) || 4 : 4;

        if (!name) {
            toast('Stol nomini kiriting', true);
            return;
        }

        const {error} = await sb.from('restaurant_tables').insert({
            name, seats, status: 'bosh', cafe_id: SESSION.cafeId
        });
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminTablesGrid();
        toast("Stol qo'shildi");
    },

    /* MAVJUD STOLNI O'CHIRISH */
    async deleteTable(id) {
        const t = DB.tables.find(x => x.id === id);
        if (!t) return;
        const openOrder = DB.orders.find(o => o.table_id === id && o.status !== 'tolangan');
        const historyOrders = DB.orders.filter(o => o.table_id === id).length;

        if (openOrder) {
            Modal.open(`
        <div class="modal-head"><h3>Stolni o'chirish mumkin emas</h3>
          <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
        <div class="modal-note warn">
          <b>${esc(t.name)}</b> stolida yopilmagan buyurtma bor
          (${esc(openOrder.waiterName)} · ${money(openOrder.total_amount)}).<br>
          Avval buyurtmani <b>To'langan</b> holatiga o'tkazing, keyin stolni o'chirish mumkin.
        </div>
        <button class="btn ghost block" onclick="Modal.close()">Tushundim</button>
      `);
            return;
        }

        Modal.open(`
      <div class="modal-head"><h3>Stolni o'chirish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="modal-note ${historyOrders ? 'warn' : ''}">
        <b>${esc(t.name)}</b> (${t.seats || 4} kishi) stolini butunlay o'chirmoqchimisiz?
        ${historyOrders ? `<br>Bu stol bo'yicha <b>${historyOrders} ta</b> buyurtma tarixi mavjud — ular hisobotlarda saqlanib qoladi.` : ''}
      </div>
      <div class="row" style="gap:10px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn danger" style="flex:1" onclick="UI.confirmDeleteTable('${id}')">${icon('trash', 15)} O'chirish</button>
      </div>
    `);
    },

    async confirmDeleteTable(id) {
        const btnEl = document.querySelector('.modal .btn.danger');
        if (btnEl) btnEl.disabled = true;

        /* Server tomonda tekshiriladi: ochiq buyurtmasi bo'lgan stol o'chmaydi */
        const {error} = await sb.rpc('delete_table', {p_cafe_id: SESSION.cafeId, p_id: id});
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminTablesGrid();
        UI.renderDashboard();
        toast("Stol o'chirildi");
    },

    /* =========================================================
       BUYURTMALAR
    ========================================================= */
    renderOrdersTable() {
        const filter = document.getElementById('orders-filter').value;
        const rows = DB.orders.filter(o => filter === 'all' || o.status === filter);
        document.getElementById('admin-orders-table').querySelector('tbody').innerHTML = rows.map((o, i) => `
      <tr>
        <td class="muted">${i + 1}</td>
        <td><b>${esc(o.tableName)}</b></td>
        <td>${esc(o.waiterName)}</td>
        <td class="muted" style="max-width:220px;">${esc(o.items.map(it => it.item_name + ' ×' + it.quantity).join(', ')) || '—'}</td>
        <td>${UI.payPill(o.payment_method)}</td>
        <td><b>${money(o.total_amount)}</b></td>
        <td>
          <select class="status-select st-${o.status}" onchange="UI.updateOrderStatus('${o.id}', this.value)">
            ${Object.entries(STATUS_META).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </td>
        <td class="muted">${esc(o.createdAtLabel)}</td>
        <td>
          <button class="icon-btn sm" title="Chekni ko'rish" onclick="UI.openReceipt('${o.id}')">${icon('list', 14)}</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="9" class="empty-hint">Buyurtma topilmadi</td></tr>`;
    },

    async updateOrderStatus(id, status) {
        const {error} = await sb.from('orders').update({status}).eq('id', id).eq('cafe_id', SESSION.cafeId);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderOrdersTable();
        UI.renderDashboard();
        UI.renderAdminTablesGrid();
        toast('Buyurtma holati yangilandi');
    },

    openReceipt(id) {
        const o = DB.orders.find(x => x.id === id);
        if (!o) return;

        /* Mahsulot qatorlari — ikki ustunga tekislangan */
        const lines = (o.items || []).map(it =>
            `<div class="r-item">
          <div class="r-col-item">
            <div class="r-name">${esc(it.item_name)}</div>
            <div class="r-qty-price">${it.quantity} × ${money(it.price)}</div>
          </div>
          <div class="r-col-sum">${money(it.price * it.quantity)}</div>
        </div>`
        ).join('') || `<div class="r-item"><div class="r-col-item"><div class="r-name">—</div></div><div class="r-col-sum">—</div></div>`;

        /* Shtrix-kod chizig'i — buyurtma ID dan barqaror naqsh */
        const seed = String(o.id).replace(/-/g, '');
        const bars = Array.from({length: 42}, (_, i) => {
            const h = 18 + ((parseInt(seed[i % seed.length], 16) || 0) % 20);
            return `<i style="height:${h}px;"></i>`;
        }).join('');

        const pay = PAY_META[o.payment_method] || PAY_META.naqd;
        const tip = Number(o.tip_amount || 0);

        Modal.open(`
      <div class="modal-head"><h3>Chek</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>

      <div class="receipt">
        <div class="r-brand">${esc(SESSION.cafeName || APP_NAME)}</div>
        <div class="r-sub">${APP_NAME} · Kafe hisob-kitob tizimi</div>
        <div class="r-sub">${esc(o.createdAtLabel)}</div>

        <hr>

        <div class="r-meta"><span>Stol</span><span>${esc(o.tableName)}</span></div>
        <div class="r-meta"><span>Afitsant</span><span>${esc(o.waiterName)}</span></div>
        <div class="r-meta"><span>Buyurtma</span><span>${esc(ORDER_TYPES[o.order_type] || o.order_type || '—')}</span></div>

        <hr>

        <div class="r-head">
          <div class="r-col-item">Mahsulot</div>
          <div class="r-col-sum">Summa</div>
        </div>
        ${lines}

        <hr>

        <div class="r-line"><span class="r-label">Jami</span><span class="r-val">${money(o.total_amount)}</span></div>
        ${tip > 0 ? `<div class="r-line"><span class="r-label">Choyxaqa</span><span class="r-val">${money(tip)}</span></div>` : ''}

        <div class="r-total-row">
          <span class="r-label">To'lanadi</span>
          <span class="r-amount">${money(Number(o.total_amount) + tip)}</span>
        </div>

        <div class="r-pay">${icon(pay.icon, 13)} ${esc(pay.label)}</div>

        <div class="r-barcode">${bars}</div>
        <div class="r-code">${esc(String(o.id).slice(0, 8).toUpperCase())}</div>

        <div class="r-foot">Xaridingiz uchun rahmat!<br>Yana kutib qolamiz</div>
      </div>

      <div class="row" style="gap:10px; margin-top:16px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Yopish</button>
        <button class="btn primary" style="flex:1" onclick="UI.printReceipt()">${icon('list', 15)} Chop etish</button>
      </div>
    `);
    },

    /* Chekni chop etish: modal ko'rinishini saqlab, print oynasini ochamiz */
    printReceipt() {
        const root = document.getElementById('modal-root');
        if (root) root.setAttribute('data-printing', '1');
        window.print();
        setTimeout(() => { if (root) root.removeAttribute('data-printing'); }, 400);
    },

    /* =========================================================
       XODIMLAR
    ========================================================= */
    async renderStaffTable() {
        let tipsByStaff = {};
        try {
            const {data} = await sb.from('v_waiter_report').select('*').eq('cafe_id', SESSION.cafeId);
            (data || []).forEach(r => {
                const key = r.staff_id || r.waiter_id || r.full_name;
                tipsByStaff[key] = Number(r.tips || r.total_tips || 0);
            });
        } catch (e) {
            tipsByStaff = {};
        }

        const rows = DB.staffDirectory.map(s => {
            const isWaiter = s.role === 'waiter';
            const tips = tipsByStaff[s.id] || 0;
            return `
      <tr>
        <td>
          <div class="row" style="gap:9px;">
            <div class="av" style="width:30px;height:30px;border-radius:50%;background:var(--green-soft);color:var(--green-darker);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;">${initials(s.full_name)}</div>
            <div><div style="font-weight:700;">${esc(s.full_name)}</div>
            <div class="muted">${s.is_active ? 'Faol' : 'Nofaol'}</div></div>
          </div>
        </td>
        <td class="muted">${esc(prettyPhone(s.phone))}</td>
        <td>${isWaiter ? `<span class="pill blue">Afitsant</span>` : `<span class="pill green">Admin</span>`}</td>
        <td><b>${money(s.service_paid || 0)}</b></td>
        <td>${isWaiter ? `${s.tip_percent || 0}%` : '—'}</td>
        <td>${isWaiter ? `<b>${money(tips)}</b>` : '—'}</td>
        <td>
          <div class="row" style="gap:6px;">
            <button class="icon-btn sm" title="Tahrirlash" onclick="UI.openStaffModal('${s.id}')">${icon('edit', 14)}</button>
            <button class="icon-btn sm" title="${s.is_active ? 'Nofaol qilish' : 'Faollashtirish'}" onclick="UI.toggleStaffActive('${s.id}', ${!s.is_active})">${icon(s.is_active ? 'x' : 'check', 14)}</button>
            ${isWaiter ? `<button class="icon-btn sm danger" title="O'chirish" onclick="UI.deleteStaff('${s.id}')">${icon('trash', 14)}</button>` : ''}
          </div>
        </td>
      </tr>`;
        }).join('') || `<tr><td colspan="7" class="empty-hint">Xodim yo'q</td></tr>`;

        document.getElementById('admin-staff-table').querySelector('tbody').innerHTML = rows;
    },

    openStaffModal(id) {
        const s = id ? DB.staffDirectory.find(x => x.id === id) : null;
        const isEdit = !!s;
        const roleLocked = isEdit && s.role === 'admin';
        Modal.open(`
      <div class="modal-head"><h3>${isEdit ? 'Xodimni tahrirlash' : 'Yangi xodim'}</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>

      <div class="field"><label>Ism familiya</label>
        <input type="text" id="sm-name" value="${s ? esc(s.full_name) : ''}" placeholder="Ism familiya"></div>

      <div class="field"><label>Telefon raqam (login)</label>
        <input type="tel" id="sm-phone" value="${s ? esc(s.phone || '') : ''}" placeholder="+998 90 123 45 67" inputmode="tel"></div>

      ${roleLocked ? '' : `
      <div class="field"><label>Rol</label>
        <select id="sm-role">
          <option value="waiter" ${s && s.role === 'waiter' ? 'selected' : ''}>Afitsant</option>
          <option value="admin"  ${s && s.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>`}

      <div class="field"><label>${isEdit ? "Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)" : 'Parol'}</label>
        <input type="password" id="sm-password" placeholder="${isEdit ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Parol o'ylab toping"}" autocomplete="new-password"></div>

      <div class="field"><label>Choyxaqa % (afitsant uchun)</label>
        <input type="number" id="sm-tip" value="${s ? (s.tip_percent || 0) : 10}" min="0" max="100">
      </div>

      <button class="btn primary block" onclick="UI.saveStaff('${isEdit ? s.id : ''}')">${icon('check', 16)} Saqlash</button>
    `);
    },

    async saveStaff(id) {
        const name = document.getElementById('sm-name').value.trim();
        const phone = document.getElementById('sm-phone').value.trim();
        const password = document.getElementById('sm-password').value;
        const tip = parseInt(document.getElementById('sm-tip').value, 10) || 0;
        const roleEl = document.getElementById('sm-role');
        const existing = id ? DB.staffDirectory.find(x => x.id === id) : null;
        const role = roleEl ? roleEl.value : (existing ? existing.role : 'waiter');

        if (!name || !phone) {
            toast('Ism va telefon raqamni kiriting', true);
            return;
        }
        if (!id && !password) {
            toast('Yangi xodim uchun parol majburiy', true);
            return;
        }

        let error;
        if (id) {
            ({error} = await sb.rpc('update_staff', {
                p_cafe_id: SESSION.cafeId, p_id: id, p_full_name: name, p_phone: phone,
                p_password: password || '', p_tip_percent: tip, p_role: role
            }));
        } else if (role === 'admin') {
            ({error} = await sb.rpc('create_admin', {
                p_cafe_id: SESSION.cafeId, p_full_name: name, p_phone: phone, p_password: password
            }));
        } else {
            ({error} = await sb.rpc('create_waiter', {
                p_cafe_id: SESSION.cafeId, p_full_name: name, p_phone: phone,
                p_password: password, p_tip_percent: tip
            }));
        }

        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        Modal.close();
        await refreshFromDB();
        UI.renderAdminPeople();
        await UI.renderStaffTable();
        toast('Xodim saqlandi');
    },

    async setStaffTip(id, val) {
        const tip = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
        const s = DB.staffDirectory.find(x => x.id === id);
        if (!s) return;
        const {error} = await sb.rpc('update_staff', {
            p_cafe_id: SESSION.cafeId, p_id: id, p_full_name: s.full_name, p_phone: s.phone,
            p_password: '', p_tip_percent: tip, p_role: s.role
        });
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await UI.renderStaffTable();
        toast('Choyxaqa foizi yangilandi');
    },

    async toggleStaffActive(id, makeActive) {
        const {error} = await sb.rpc('set_staff_active', {p_cafe_id: SESSION.cafeId, p_id: id, p_is_active: makeActive});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminPeople();
        await UI.renderStaffTable();
    },

    async deleteStaff(id) {
        if (!confirm("Ushbu afitsantni o'chirmoqchimisiz?")) return;
        const {error} = await sb.rpc('delete_staff', {p_cafe_id: SESSION.cafeId, p_id: id});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminPeople();
        await UI.renderStaffTable();
        toast("Afitsant o'chirildi");
    },

    /* =========================================================
       HISOBOT + SANA ORALIG'I BO'YICHA YUKLAB OLISH
    ========================================================= */
    setRangePresetDefaults() {
        const from = document.getElementById('report-from');
        const to = document.getElementById('report-to');
        if (from && !from.value) from.value = monthStartISO();
        if (to && !to.value) to.value = todayISO();
    },

    setRangePreset(kind) {
        const from = document.getElementById('report-from');
        const to = document.getElementById('report-to');
        document.querySelectorAll('.quick-months .qm').forEach(b => b.classList.remove('active'));

        if (kind === 0) {
            from.value = todayISO();
            to.value = todayISO();
        } else if (kind === 'month') {
            from.value = monthStartISO();
            to.value = todayISO();
        } else if (kind === 'year') {
            from.value = yearStartISO();
            to.value = todayISO();
        } else {
            from.value = dateOffsetISO(kind);
            to.value = todayISO();
        }
        UI.updateRangePreview();
    },

    readRange() {
        const from = document.getElementById('report-from');
        const to = document.getElementById('report-to');
        let f = from.value || monthStartISO();
        let t = to.value || todayISO();
        if (f > t) { const tmp = f; f = t; t = tmp; }
        return {from: f, to: t, kind: document.getElementById('report-kind').value};
    },

    updateRangePreview() {
        const el = document.getElementById('range-preview');
        if (!el) return;
        const {from, to} = UI.readRange();
        const f = new Date(from + 'T00:00:00');
        const t = new Date(to + 'T23:59:59');
        const inRange = DB.orders.filter(o => {
            const d = new Date(o.created_at);
            return d >= f && d <= t;
        });
        const paid = inRange.filter(o => o.status === 'tolangan');
        const revenue = paid.reduce((s, o) => s + Number(o.total_amount), 0);

        el.classList.add('show');
        el.innerHTML = `
      <div>${icon('calendar', 15)} <b>${dmyLabel(from)}</b> — <b>${dmyLabel(to)}</b></div>
      <div>Buyurtmalar: <b>${inRange.length} ta</b> · To'langan: <b>${paid.length} ta</b></div>
      <div>Yuklanadigan summa: <b>${money(revenue)}</b></div>`;
    },

    /* CSV faylni tayyorlab yuklab berish */
    buildReportCSV(rep, meta) {
        const rows = reportList(rep, 'orders');
        const daily = reportList(rep, 'daily');
        const items = reportList(rep, 'items');
        const staff = reportList(rep, 'staff');

        const notes = [
            ['Green Chef — hisobot'],
            ['Kafe', meta.cafeName],
            ['Davr', dmyLabel(meta.from) + ' — ' + dmyLabel(meta.to)],
            ['Yaratilgan', nowStrFromISO(new Date().toISOString())],
            ['Buyurtmalar soni', meta.orderCount],
            ['To\'langan summa', rep.total_revenue || 0],
            ['Choyxaqa', rep.total_tips || 0],
            [],
        ];

        const metaBlock = notes.map(r => r.map(csvCell).join(',')).join('\r\n');

        const sections = [];

        sections.push('BUYURTMALAR\r\n' + csvFromRows(
            ['Sana', 'Vaqt', 'Stol', 'Afitsant', 'Buyurtma turi', "To'lov turi", 'Mahsulotlar', 'Jami summa', 'Holat'],
            rows.map(o => [
                String(o.created_at || '').slice(0, 10),
                new Date(o.created_at).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'}),
                o.table_name || '—',
                o.waiter_name || '—',
                ORDER_TYPES[o.order_type] || o.order_type || '—',
                (PAY_META[o.payment_method] || PAY_META.naqd).label,
                o.items_text || '—',
                o.total_amount || 0,
                (STATUS_META[o.status] || {label: o.status}).label,
            ])
        ));

        if (daily.length) {
            sections.push('KUNLIK JAMLANMA\r\n' + csvFromRows(
                ['Sana', 'Buyurtmalar', "To'langan buyurtmalar", 'Tushum', 'Choyxaqa'],
                daily.map(d => [d.day, d.orders || 0, d.paid_orders || 0, d.revenue || 0, d.tips || 0])
            ));
        }

        if (items.length) {
            sections.push('MAHSULOTLAR BO\'YICHA\r\n' + csvFromRows(
                ['Mahsulot', 'Bo\'lim', 'Sotilgan dona', 'Summa'],
                items.map(it => [it.item_name, it.category_name || '—', it.qty_sold || 0, it.revenue || 0])
            ));
        }

        if (staff.length) {
            sections.push('XODIMLAR BO\'YICHA\r\n' + csvFromRows(
                ['Xodim', 'Buyurtmalar', 'Xizmat summasi', 'Choyxaqa'],
                staff.map(s => [s.full_name, s.orders_count || 0, s.service_total || 0, s.tips || 0])
            ));
        }

        return metaBlock + '\r\n' + sections.join('\r\n');
    },

    /* Faqat tanlangan bo'lim bo'yicha yuklab olish uchun filtr */
    filterReportByKind(rep, kind) {
        const out = {total_revenue: rep.total_revenue, total_tips: rep.total_tips};
        if (kind === 'orders') {
            out.orders = rep.orders;
        } else if (kind === 'daily') {
            out.daily = rep.daily;
        } else if (kind === 'items') {
            out.items = rep.items;
        } else if (kind === 'staff') {
            out.staff = rep.staff;
        }
        return out;
    },

    async downloadMyReport() {
        const {from, to, kind} = UI.readRange();
        if (!from || !to) {
            toast("Sana oralig'ini tanlang", true);
            return;
        }

        const btns = document.querySelectorAll('.range-head .btn');
        btns.forEach(b => b.disabled = true);

        let rep;
        try {
            rep = await fetchReportRange(from, to);
        } catch (e) {
            btns.forEach(b => b.disabled = false);
            toast('Hisobotni yuklab bo\'lmadi: ' + supaErrorMessage(e), true);
            return;
        }
        btns.forEach(b => b.disabled = false);

        /* Kunlik jamlanma bo'sh bo'lsa, buyurtmalardan o'zimiz hisoblaymiz */
        if ((!rep.daily || !rep.daily.length) && Array.isArray(rep.orders)) {
            const map = {};
            rep.orders.forEach(o => {
                const day = String(o.created_at).slice(0, 10);
                if (!map[day]) map[day] = {day, orders: 0, paid_orders: 0, revenue: 0, tips: 0};
                map[day].orders += 1;
                if (o.status === 'tolangan') {
                    map[day].paid_orders += 1;
                    map[day].revenue += Number(o.total_amount) || 0;
                }
            });
            rep.daily = Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
        }
        if ((rep.total_revenue === undefined || rep.total_revenue === null) && Array.isArray(rep.orders)) {
            const paid = rep.orders.filter(o => o.status === 'tolangan');
            rep.total_revenue = paid.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
        }

        const scoped = UI.filterReportByKind(rep, kind);
        const meta = {
            cafeName: SESSION.cafeName,
            from,
            to,
            orderCount: (rep.orders || []).length,
        };

        const csv = UI.buildReportCSV(scoped, meta);
        const fname = `green-chef-${slugForFile(SESSION.cafeName)}-${from}_${to}-${kind}.csv`;
        downloadTextFile(fname, csv, 'text/csv');
        toast('Hisobot yuklab olindi: ' + fname);
    },

    async renderReport() {
        UI.setRangePresetDefaults();
        UI.updateRangePreview();

        let rep;
        try {
            rep = await loadReportData();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }

        const today = todayISO();
        const todayRow = rep.daily.find(d => String(d.day).slice(0, 10) === today) || {revenue: 0, paid_orders: 0, tips: 0};
        const allTime = rep.daily.reduce((acc, d) => ({
            revenue: acc.revenue + Number(d.revenue),
            paid_orders: acc.paid_orders + Number(d.paid_orders),
            tips: acc.tips + Number(d.tips),
        }), {revenue: 0, paid_orders: 0, tips: 0});

        document.getElementById('report-stats').innerHTML = `
      <div class="stat"><div class="stat-ico" style="background:var(--green-soft); color:var(--green-darker);">${icon('cash', 20)}</div><div><div class="num">${money(todayRow.revenue)}</div><div class="lbl">Bugungi tushum</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--blue-soft); color:#2E56BE;">${icon('clipboard', 20)}</div><div><div class="num">${money(allTime.revenue)}</div><div class="lbl">Jami tushum (barcha vaqt)</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--orange-soft); color:#93650F;">${icon('users', 20)}</div><div><div class="num">${money(allTime.tips)}</div><div class="lbl">Jami choyxaqa (barcha vaqt)</div></div></div>
    `;

        const maxCat = Math.max(1, ...reportList(rep, 'catRev').map(c => Number(c.revenue)));
        document.getElementById('report-by-category').innerHTML = reportList(rep, 'catRev').map(c => `
      <div style="margin-bottom:14px;">
        <div class="row" style="justify-content:space-between; font-size:13px; margin-bottom:5px;">
          <span class="row" style="gap:6px;">${icon(c.category_icon || 'grid', 15)} ${esc(c.category_name || '—')}</span><b>${money(c.revenue)}</b>
        </div>
        <div style="background:var(--surface-soft); border-radius:6px; height:8px; overflow:hidden;">
          <div style="background:var(--green); width:${(Number(c.revenue) / maxCat * 100)}%; height:100%;"></div>
        </div>
      </div>
    `).join('') || `<div class="empty-hint">Ma'lumot yo'q</div>`;

        document.getElementById('report-top-items').innerHTML = reportList(rep, 'topItems').length ? reportList(rep, 'topItems').map((it, i) => `
      <div class="row" style="justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:13.5px;">
        <span>${i + 1}. ${esc(it.item_name)}</span><b>${it.qty_sold} dona</b>
      </div>
    `).join('') : `<div class="empty-hint">Ma'lumot yo'q</div>`;
    },

    /* =========================================================
       SUPER ADMIN — KAFELAR (QO'SHISH / O'CHIRISH)
    ========================================================= */
    async loadSuperData() {
        UI.renderSuperPeople();
        try {
            superCafes = await fetchSuperDashboard();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }
        UI.renderSuperCafes();
        UI.populateSuperReportCafes();
    },

    renderSuperCafes() {
        const totalCafes = superCafes.length;
        const active = superCafes.filter(c => !c.is_expired).length;
        const expiring = superCafes.filter(c => !c.is_expired && c.days_left !== null && c.days_left !== undefined && c.days_left <= 7).length;
        const totalStaff = superCafes.reduce((s, c) => s + Number(c.staff_count || c.waiters_count || 0), 0);

        document.getElementById('super-stats').innerHTML = `
      <div class="stat"><div class="stat-ico" style="background:var(--green-soft); color:var(--green-darker);">${icon('store', 20)}</div><div><div class="num">${totalCafes}</div><div class="lbl">Jami kafeler</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--blue-soft); color:#2E56BE;">${icon('check', 20)}</div><div><div class="num">${active}</div><div class="lbl">Faol obunalar</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--orange-soft); color:#93650F;">${icon('alert', 20)}</div><div><div class="num">${expiring}</div><div class="lbl">7 kun ichida tugaydi</div></div></div>
    `;

        document.getElementById('super-cafes-table').querySelector('tbody').innerHTML = superCafes.map((c, i) => `
      <tr>
        <td class="muted">${i + 1}</td>
        <td>
          <div style="font-weight:800;">${esc(c.name)}</div>
          <div class="muted">ID: ${esc(String(c.cafe_id).slice(0, 8))}…</div>
        </td>
        <td>
          <div>${esc(c.admin_name || '—')}</div>
          <div class="muted">${esc(prettyPhone(c.admin_phone || c.phone))}</div>
        </td>
        <td class="muted">${esc(prettyPhone(c.phone))}</td>
        <td>${Number(c.staff_count || c.waiters_count || 0)} ta</td>
        <td>
          <span class="expiry-chip ${expiryClass(c.days_left, c.is_expired)}">${expiryText(c.days_left, c.is_expired)}</span>
          <div class="progress-mini ${c.is_expired ? 'late' : ''}">
            <div style="width:${c.subscription_months ? Math.max(2, Math.min(100, ((c.subscription_months * 30 - (c.days_left || 0)) / (c.subscription_months * 30)) * 100)) : 100}%"></div>
          </div>
        </td>
        <td class="muted">${c.subscription_end ? dmyLabel(c.subscription_end) : 'Cheksiz'}</td>
        <td>
          <div class="row" style="gap:6px;">
            <button class="icon-btn sm" title="Obunani uzaytirish" onclick="UI.openExtendModal('${c.cafe_id}')">${icon('calendar', 14)}</button>
            <button class="icon-btn sm" title="Kafeni tahrirlash" onclick="UI.openEditCafeModal('${c.cafe_id}')">${icon('edit', 14)}</button>
            <button class="icon-btn sm danger" title="Kafeni o'chirish" onclick="UI.openDeleteCafeModal('${c.cafe_id}')">${icon('trash', 14)}</button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="8" class="empty-hint">Hali kafe qo'shilmagan</td></tr>`;
    },

    cafeById(cafeId) {
        return superCafes.find(c => String(c.cafe_id) === String(cafeId));
    },

    /* YANGI KAFE QO'SHISH — nomi, admin telefon/paroli, obuna muddati saqlanadi */
    openNewCafeModal() {
        const monthOpts = [1, 3, 6, 12].map(m =>
            `<button class="qm ${m === 1 ? 'active' : ''}" onclick="UI.pickCafeMonths(this, ${m})">${m} oy</button>`
        ).join('');
        Modal.open(`
      <div class="modal-head"><h3>Yangi kafe qo'shish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>

      <div class="modal-note">
        Kafe nomi, admin ismi, telefon raqami (login), parol va obuna muddati
        <b>cafes</b> va <b>staff</b> jadvallariga yoziladi. Admin shu telefon va parol bilan kiradi.
      </div>

      <div class="field"><label>Kafe nomi</label>
        <input type="text" id="nc-name" placeholder="Masalan: Qorabug' Kafe"></div>

      <div class="field"><label>Admin ismi familiyasi</label>
        <input type="text" id="nc-admin" placeholder="Ism familiya"></div>

      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Telefon (login)</label>
          <input type="tel" id="nc-phone" placeholder="+998 90 123 45 67" inputmode="tel"></div>
        <div class="field" style="flex:1;"><label>Qo'shimcha telefon</label>
          <input type="tel" id="nc-phone2" placeholder="Ixtiyoriy" inputmode="tel"></div>
      </div>

      <div class="field"><label>Parol</label>
        <input type="password" id="nc-password" placeholder="Kamida 4 belgi" autocomplete="new-password"></div>

      <div class="field"><label>Obuna muddati</label>
        <div class="quick-months" id="nc-months">${monthOpts}</div>
      </div>

      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Oylik narx (so'm)</label>
          <input type="number" id="nc-price" value="0" min="0"></div>
        <div class="field" style="flex:1;"><label>Manzil / izoh</label>
          <input type="text" id="nc-address" placeholder="Ixtiyoriy"></div>
      </div>

      <button class="btn primary block" onclick="UI.createCafe()">${icon('check', 16)} Kafeni yaratish</button>
    `);
    },

    pickCafeMonths(btn, m) {
        btn.parentElement.querySelectorAll('.qm').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    async createCafe() {
        const name = document.getElementById('nc-name').value.trim();
        const adminName = document.getElementById('nc-admin').value.trim();
        const phone = document.getElementById('nc-phone').value.trim();
        const phone2 = document.getElementById('nc-phone2').value.trim();
        const password = document.getElementById('nc-password').value;
        const monthsEl = document.querySelector('#nc-months .qm.active');
        const months = monthsEl ? parseInt(monthsEl.textContent, 10) || 1 : 1;
        const monthlyPrice = parseInt(document.getElementById('nc-price').value, 10) || 0;
        const address = document.getElementById('nc-address').value.trim();

        if (!name || !adminName || !phone || !password) {
            toast("Kafe nomi, admin ismi, telefon va parolni to'ldiring", true);
            return;
        }
        if (password.length < 4) {
            toast("Parol kamida 4 belgidan iborat bo'lishi kerak", true);
            return;
        }

        const btnEl = document.querySelector('.modal .btn.primary');
        if (btnEl) btnEl.disabled = true;

        const {data, error} = await sb.rpc('super_admin_create_cafe', {
            p_name: name,
            p_admin_name: adminName,
            p_phone: phone,
            p_phone2: phone2 || null,
            p_password: password,
            p_months: months,
            p_monthly_price: monthlyPrice,
            p_address: address || null,
        });

        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }

        /* Birinchi obuna to'lovini ham yozib qo'yamiz (narx kiritilgan bo'lsa) */
        const newCafeId = Array.isArray(data) ? (data[0] && (data[0].cafe_id || data[0].id)) : (data && (data.cafe_id || data.id));
        if (monthlyPrice > 0 && newCafeId) {
            await sb.from('subscription_payments').insert({
                cafe_id: newCafeId,
                months,
                amount: monthlyPrice * months,
                note: "Kafe qo'shilganda to'langan obuna",
            });
        }

        Modal.close();
        await UI.loadSuperData();
        toast(`"${name}" kafesi qo'shildi (${months} oy obuna)`);
    },

    /* KAFE MA'LUMOTLARINI TAHRIRLASH */
    openEditCafeModal(cafeId) {
        const c = UI.cafeById(cafeId);
        if (!c) return;
        Modal.open(`
      <div class="modal-head"><h3>Kafe ma'lumotlari</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="modal-note">Kafe nomi butun tizimda — admin panelida ham, afitsant panelida ham shu nom ko'rinadi.</div>

      <div class="field"><label>Kafe nomi</label>
        <input type="text" id="ec-name" value="${esc(c.name)}"></div>

      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Telefon</label>
          <input type="tel" id="ec-phone" value="${esc(c.phone || '')}"></div>
        <div class="field" style="flex:1;"><label>Qo'shimcha telefon</label>
          <input type="tel" id="ec-phone2" value="${esc(c.phone2 || '')}"></div>
      </div>

      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Manzil / izoh</label>
          <input type="text" id="ec-address" value="${esc(c.address || '')}"></div>
        <div class="field" style="width:130px;"><label>Oylik narx</label>
          <input type="number" id="ec-price" value="${Number(c.monthly_price || 0)}" min="0"></div>
      </div>

      <div class="field"><label>Admin parolini yangilash (ixtiyoriy)</label>
        <input type="password" id="ec-password" placeholder="Bo'sh qoldirsangiz o'zgarmaydi" autocomplete="new-password"></div>

      <button class="btn primary block" onclick="UI.saveCafe('${cafeId}')">${icon('check', 16)} Saqlash</button>
    `);
    },

    async saveCafe(cafeId) {
        const name = document.getElementById('ec-name').value.trim();
        const phone = document.getElementById('ec-phone').value.trim();
        const phone2 = document.getElementById('ec-phone2').value.trim();
        const address = document.getElementById('ec-address').value.trim();
        const monthlyPrice = parseInt(document.getElementById('ec-price').value, 10) || 0;
        const password = document.getElementById('ec-password').value;

        if (!name) {
            toast('Kafe nomini kiriting', true);
            return;
        }

        const btnEl = document.querySelector('.modal .btn.primary');
        if (btnEl) btnEl.disabled = true;

        const {error} = await sb.rpc('super_admin_update_cafe', {
            p_cafe_id: cafeId,
            p_name: name,
            p_phone: phone || null,
            p_phone2: phone2 || null,
            p_address: address || null,
            p_monthly_price: monthlyPrice,
            p_admin_password: password || null,
        });
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }

        Modal.close();
        await UI.loadSuperData();
        toast('Kafe ma\'lumotlari saqlandi');
    },

    /* MAVJUD KAFENI O'CHIRISH — nomini tasdiqlash bilan */
    openDeleteCafeModal(cafeId) {
        const c = UI.cafeById(cafeId);
        if (!c) return;
        Modal.open(`
      <div class="modal-head"><h3>Kafeni o'chirish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>

      <div class="modal-note warn">
        <b>${esc(c.name)}</b> kafesi va unga tegishli <b>barcha</b> ma'lumotlar
        (menyu, bo'limlar, stollar, xodimlar, buyurtmalar va obuna to'lovlari)
        butunlay o'chiriladi. Bu amalni <b>qaytarib bo'lmaydi</b>.
      </div>

      <div class="field"><label>Tasdiqlash uchun kafe nomini yozing</label>
        <input type="text" id="dc-confirm" placeholder="${esc(c.name)}" autocomplete="off"></div>

      <div class="row" style="gap:10px;">
        <button class="btn ghost" style="flex:1" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn danger" style="flex:1" onclick="UI.deleteCafe('${cafeId}')">${icon('trash', 15)} Butunlay o'chirish</button>
      </div>
    `);
    },

    async deleteCafe(cafeId) {
        const c = UI.cafeById(cafeId);
        if (!c) return;
        const typed = document.getElementById('dc-confirm').value.trim();

        if (typed.toLowerCase() !== String(c.name).toLowerCase()) {
            toast("Kafe nomini to'g'ri yozing", true);
            return;
        }

        const btnEl = document.querySelector('.modal .btn.danger');
        if (btnEl) btnEl.disabled = true;

        const {error} = await sb.rpc('super_admin_delete_cafe', {
            p_cafe_id: cafeId,
            p_confirm_name: typed,
        });
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }

        Modal.close();
        await UI.loadSuperData();
        toast(`"${c.name}" kafesi o'chirildi`);
    },

    /* OBUNANI UZAYTIRISH */
    openExtendModal(cafeId) {
        const c = UI.cafeById(cafeId);
        if (!c) return;
        const presets = [1, 3, 6, 12].map(m =>
            `<button class="qm ${m === 1 ? 'active' : ''}" onclick="UI.pickExtend(this, ${m})">${m} oy</button>`
        ).join('');
        Modal.open(`
      <div class="modal-head"><h3>Obunani uzaytirish</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="extend-preview">
        <span>${esc(c.name)}</span>
        <b>${expiryText(c.days_left, c.is_expired)}</b>
      </div>
      <div class="field"><label>Necha oy?</label>
        <div class="quick-months" id="ex-months">${presets}</div>
        <input type="number" id="ex-custom" min="1" max="60" value="1" style="margin-top:10px;" placeholder="Boshqa oy soni">
      </div>
      <div class="field"><label>To'lov summasi (so'm)</label>
        <input type="number" id="ex-amount" value="0" min="0"></div>
      <div class="field"><label>Izoh</label>
        <input type="text" id="ex-note" placeholder="Masalan: naqd to'lov"></div>
      <button class="btn primary block" onclick="UI.extendCafe('${cafeId}')">${icon('check', 16)} Uzaytirish</button>
    `);
    },

    pickExtend(btn, m) {
        btn.parentElement.querySelectorAll('.qm').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ex-custom').value = m;
    },

    async extendCafe(cafeId) {
        const months = parseInt(document.getElementById('ex-custom').value, 10) || 1;
        const amount = parseInt(document.getElementById('ex-amount').value, 10) || 0;
        const note = document.getElementById('ex-note').value.trim();

        if (months < 1 || months > 60) {
            toast("Oy soni 1 dan 60 gacha bo'lishi kerak", true);
            return;
        }

        const btnEl = document.querySelector('.modal .btn.primary');
        if (btnEl) btnEl.disabled = true;

        const {error} = await sb.rpc('super_admin_extend_custom', {
            p_cafe_id: cafeId,
            p_months: months,
            p_amount: amount,
            p_note: note || null,
        });
        if (error) {
            toast(supaErrorMessage(error), true);
            if (btnEl) btnEl.disabled = false;
            return;
        }

        Modal.close();
        await UI.loadSuperData();
        toast(`Obuna ${months} oyga uzaytirildi`);
    },

    /* OBUNA TO'LOVLARI */
    async renderSuperPayments() {
        let rows;
        try {
            rows = await fetchSuperPayments();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }
        document.getElementById('super-payments-table').querySelector('tbody').innerHTML = rows.map(p => `
      <tr>
        <td><b>${esc(p.cafes ? p.cafes.name : '—')}</b></td>
        <td class="muted">${dmyLabel(p.period_start)} → ${dmyLabel(p.period_end)}</td>
        <td><b>${money(p.amount)}</b></td>
        <td class="muted">${esc(p.note || `${p.months} oy`)}</td>
        <td class="muted">${esc(nowStrFromISO(p.created_at))}</td>
        <td>
          <button class="icon-btn sm danger" title="To'lovni o'chirish" onclick="UI.deletePayment('${p.id}')">${icon('trash', 14)}</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6" class="empty-hint">To'lovlar yo'q</td></tr>`;
    },

    async deletePayment(id) {
        if (!confirm("Ushbu obuna to'lovini o'chirmoqchimisiz?")) return;
        const {error} = await sb.from('subscription_payments').delete().eq('id', id);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await UI.renderSuperPayments();
        toast("To'lov o'chirildi");
    },

    populateSuperReportCafes() {
        const sel = document.getElementById('super-report-cafe');
        sel.innerHTML = superCafes.map(c =>
            `<option value="${c.cafe_id}">${esc(c.name)}</option>`).join('');
    },

    async renderSuperReport() {
        const cafeId = document.getElementById('super-report-cafe').value;
        if (!cafeId) return;
        const {data, error} = await sb.rpc('super_admin_cafe_report', {p_cafe_id: cafeId});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        const rep = data || {};
        const daily = reportList(rep, 'daily');
        const allTime = daily.reduce((a, d) => ({
            revenue: a.revenue + Number(d.revenue),
            paid_orders: a.paid_orders + Number(d.paid_orders),
            tips: a.tips + Number(d.tips)
        }), {revenue: 0, paid_orders: 0, tips: 0});

        const cafe = rep.cafe || UI.cafeById(cafeId);

        document.getElementById('super-report-stats').innerHTML = `
      <div class="stat"><div class="stat-ico" style="background:var(--green-soft);color:var(--green-darker);">${icon('cash', 20)}</div><div><div class="num">${money(allTime.revenue)}</div><div class="lbl">Jami tushum</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--blue-soft);color:#2E56BE;">${icon('clipboard', 20)}</div><div><div class="num">${cafe ? (cafe.subscription_months || 0) : 0} oy</div><div class="lbl">Obuna (oy)</div></div></div>
      <div class="stat"><div class="stat-ico" style="background:var(--orange-soft);color:#93650F;">${icon('wallet', 20)}</div><div><div class="num">${money(reportTotalPayments(rep))}</div><div class="lbl">Jami obuna to'lovi</div></div></div>
    `;

        const cats = reportList(rep, 'categories');
        const maxCat = Math.max(1, ...cats.map(c => Number(c.revenue)));
        document.getElementById('super-report-category').innerHTML = cats.map(c => `
      <div style="margin-bottom:14px;">
        <div class="row" style="justify-content:space-between; font-size:13px; margin-bottom:5px;">
          <span>${esc(c.category_name)}</span><b>${money(c.revenue)}</b></div>
        <div style="background:var(--surface-soft);border-radius:6px;height:8px;overflow:hidden;">
          <div style="background:var(--green);width:${Number(c.revenue) / maxCat * 100}%;height:100%;"></div></div>
      </div>`).join('') || `<div class="empty-hint">Ma'lumot yo'q</div>`;

        const tops = reportList(rep, 'top_items');
        document.getElementById('super-report-top').innerHTML = tops.length ? tops.map((it, i) => `
      <div class="row" style="justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:13.5px;">
        <span>${i + 1}. ${esc(it.item_name)}</span><b>${it.qty_sold} dona</b></div>`).join('')
            : `<div class="empty-hint">Ma'lumot yo'q</div>`;

        const pays = reportList(rep, 'payments');
        document.getElementById('super-report-payments').querySelector('tbody').innerHTML =
            pays.map(p => `<tr><td>${p.months} oy</td><td><b>${money(p.amount)}</b></td>
              <td class="muted">${dmyLabel(p.period_start)} → ${dmyLabel(p.period_end)}</td>
              <td class="muted">${esc(nowStrFromISO(p.created_at))}</td></tr>`).join('')
            || `<tr><td colspan="4" class="empty-hint">To'lov yo'q</td></tr>`;

        const rp = document.getElementById('range-preview');
        if (rp && !SESSION.cafeId) rp.classList.remove('show');
    },

    /* =========================================================
       AFITSANT PANELI
    ========================================================= */
    renderWaiterTablesGridSync() {
        document.getElementById('waiter-tables-grid').innerHTML = DB.tables.map(t => `
      <div class="table-tile ${t.status === 'bosh' ? 'empty' : 'busy'}" onclick="UI.selectTable('${t.id}')">
        <div class="tt-ico">${icon(t.status === 'bosh' ? 'table' : 'clipboard', 20)}</div>
        <div class="tt-name">${esc(t.name)}</div>
        <div class="tt-status">${t.status === 'bosh' ? "Bo'sh" : 'Band'}</div>
        <div class="tt-seats">${icon('users', 12)} ${t.seats || 4} kishi</div>
      </div>
    `).join('') || `<div class="empty-hint">Stol qo'shilmagan</div>`;
    },

    async renderWaiterTablesGrid() {
        await refreshFromDB();
        UI.renderWaiterTablesGridSync();
    },

    changeTable() {
        waiterSelectedTableId = null;
        waiterCart = {};
        currentOrderType = 'ichkarida';
        currentPayMethod = 'naqd';
        document.getElementById('waiter-order-area').classList.add('hidden');
        document.getElementById('waiter-table-picker').classList.remove('hidden');
        UI.renderWaiterTablesGrid();
    },

    async selectTable(id) {
        const t = DB.tables.find(x => x.id === id);
        if (!t) return;
        const openOrder = DB.orders.find(o => o.table_id === id && o.status !== 'tolangan');
        if (t.status === 'band' && openOrder && openOrder.waiter_id !== SESSION.staffId) {
            toast('Bu stolga boshqa afitsant xizmat qilyapti', true);
            return;
        }
        waiterSelectedTableId = id;
        waiterCart = {};
        currentOrderType = 'ichkarida';
        currentPayMethod = 'naqd';

        document.getElementById('waiter-table-picker').classList.add('hidden');
        document.getElementById('waiter-order-area').classList.remove('hidden');
        document.getElementById('waiter-selected-table').textContent = `${t.name} · ${t.seats || 4} kishi`;
        document.getElementById('waiter-panel-waiter-name').textContent = SESSION.staffName || '—';

        document.querySelectorAll('#order-type-tabs button').forEach(b => b.classList.toggle('active', b.dataset.type === 'ichkarida'));
        document.querySelectorAll('#pay-methods .pay-method').forEach(b => b.classList.toggle('active', b.dataset.pay === 'naqd'));

        UI.renderWaiterMenuCatTiles();
        UI.renderWaiterMenuGrid();
        UI.renderWaiterCart();
        UI.renderActiveTablesStrip();
    },

    setOrderType(type) {
        currentOrderType = type;
        document.querySelectorAll('#order-type-tabs button').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    },

    setPayMethod(method) {
        currentPayMethod = method;
        document.querySelectorAll('#pay-methods .pay-method').forEach(b => b.classList.toggle('active', b.dataset.pay === method));
    },

    renderWaiterMenuCatTiles() {
        const tiles = [{id: 'barchasi', name: 'Barchasi', icon: 'grid', kind: null}, ...DB.categories];
        document.getElementById('waiter-menu-cat-tiles').innerHTML = tiles.map(c => {
            const count = c.id === 'barchasi'
                ? DB.menu.filter(m => m.is_available).length
                : DB.menu.filter(m => m.category_id === c.id && m.is_available).length;
            return `
        <button class="cat-tile ${waiterMenuCatFilter === c.id ? 'active' : ''}" onclick="UI.setWaiterMenuCat('${c.id}')">
          <div class="ci">${icon(c.icon, 18)}</div>
          <div class="cn">${esc(c.name)}</div>
          <div class="cc">${count} ta</div>
        </button>`;
        }).join('');
    },

    setWaiterMenuCat(id) {
        waiterMenuCatFilter = id;
        UI.renderWaiterMenuCatTiles();
        UI.renderWaiterMenuGrid();
    },

    renderWaiterMenuGrid() {
        const q = (document.getElementById('waiter-menu-search').value || '').toLowerCase().trim();
        const items = DB.menu.filter(m => m.is_available &&
            (waiterMenuCatFilter === 'barchasi' || m.category_id === waiterMenuCatFilter) &&
            (!q || m.name.toLowerCase().includes(q))
        );
        document.getElementById('waiter-menu-grid').innerHTML = items.map(m => {
            const qty = waiterCart[m.id] || 0;
            return `
        <div class="product-card ${qty > 0 ? 'selected' : ''}">
          <div class="product-thumb" style="background:${catBg(m.category_id)};">${esc(m.emoji || '🍽️')}</div>
          <span class="pill ${catBadgeClass(m.category_id)} dot p-cat">${esc(catName(m.category_id))}</span>
          <div class="p-name">${esc(m.name)}</div>
          <div class="p-price">${money(m.price)}</div>
          <div class="p-actions">
            ${qty > 0 ? `
              <div class="qty-stepper">
                <button onclick="UI.changeCartQty('${m.id}',-1)">${icon('minus', 14)}</button>
                <span class="qv">${qty}</span>
                <button onclick="UI.changeCartQty('${m.id}',1)">${icon('plus', 14)}</button>
              </div>
            ` : `<button class="btn outline small block" onclick="UI.addToCart('${m.id}')">${icon('plus', 14)} Qo'shish</button>`}
          </div>
        </div>`;
        }).join('') || `<div class="empty-hint">Mahsulot topilmadi</div>`;
    },

    addToCart(menuId) {
        waiterCart[menuId] = (waiterCart[menuId] || 0) + 1;
        UI.renderWaiterMenuGrid();
        UI.renderWaiterCart();
    },

    changeCartQty(menuId, delta) {
        waiterCart[menuId] = (waiterCart[menuId] || 0) + delta;
        if (waiterCart[menuId] <= 0) delete waiterCart[menuId];
        UI.renderWaiterMenuGrid();
        UI.renderWaiterCart();
    },

    renderWaiterCart() {
        const entries = Object.entries(waiterCart);
        let total = 0, count = 0;
        document.getElementById('waiter-cart-list').innerHTML = entries.map(([menuId, qty]) => {
            const m = DB.menu.find(x => x.id === menuId);
            if (!m) return '';
            total += m.price * qty;
            count += qty;
            return `
        <div class="order-item-row">
          <div class="oi-thumb" style="background:${catBg(m.category_id)};">${esc(m.emoji || '🍽️')}</div>
          <div class="oi-info">
            <div class="oi-name">${esc(m.name)}</div>
            <div class="oi-qty">${qty} × ${money(m.price)}</div>
          </div>
          <div class="oi-price">${money(m.price * qty)}</div>
          <button class="icon-btn sm oi-remove" onclick="UI.changeCartQty('${menuId}', -${qty})">${icon('trash', 14)}</button>
        </div>`;
        }).join('') || `<div class="empty-hint">Savat bo'sh — menyudan tanlang</div>`;
        document.getElementById('sum-count').textContent = count + ' ta';
        document.getElementById('waiter-cart-total').textContent = money(total);
    },

    renderActiveTablesStrip() {
        const busy = DB.tables.filter(t => t.status === 'band' && t.id !== waiterSelectedTableId);
        document.getElementById('waiter-active-strip').innerHTML = busy.map(t => {
            const order = DB.orders.find(o => o.table_id === t.id && o.status !== 'tolangan');
            const waiterName = order ? order.waiterName : '—';
            const itemCount = order ? order.items.reduce((s, it) => s + it.quantity, 0) : 0;
            const statusLabel = order && STATUS_META[order.status] ? STATUS_META[order.status].label : '';
            return `
        <button class="table-strip-pill" onclick="UI.selectTable('${t.id}')">
          <div class="av">${initials(waiterName)}</div>
          <div class="tsi">
            <div class="t1">${esc(t.name)} · ${t.seats || 4} kishi</div>
            <div class="t2">${itemCount} taom → ${esc(statusLabel)}</div>
          </div>
        </button>`;
        }).join('') || `<div class="empty-hint" style="padding:10px 0;">Hozircha band stollar yo'q</div>`;
    },

    async submitOrder() {
        const entries = Object.entries(waiterCart);
        if (!waiterSelectedTableId) {
            toast('Avval stol tanlang', true);
            return;
        }
        if (entries.length === 0) {
            toast("Savat bo'sh", true);
            return;
        }

        const btn = document.getElementById('submit-order-btn');
        btn.disabled = true;
        const items = entries.map(([menu_item_id, quantity]) => ({menu_item_id, quantity}));

        const {error} = await sb.rpc('create_order', {
            p_cafe_id: SESSION.cafeId,
            p_table_id: waiterSelectedTableId,
            p_waiter_id: SESSION.staffId,
            p_order_type: currentOrderType,
            p_payment_method: currentPayMethod,
            p_items: items,
        });
        btn.disabled = false;

        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        toast('Buyurtma yuborildi!');
        await refreshFromDB();
        UI.renderWaiterMyOrders();
        UI.changeTable();
    },

    /* =========================================================
       BILDIRISHNOMA (qongiroq) — UI dan chaqiriladigan metodlar
    ========================================================= */
    toggleBell()       { Notif.toggleBell(); },
    toggleSound()      { Notif.toggleSound(); },
    markAllRead()      { Notif.markAllRead(); },
    openNotifOrder(id) { Notif.openNotifOrder(id); },

    async renderWaiterMyOrders() {
        const mine = DB.orders.filter(o => o.waiter_id === SESSION.staffId);
        document.getElementById('waiter-my-orders-table').querySelector('tbody').innerHTML = mine.map(o => `
      <tr>
        <td><b>${esc(o.tableName)}</b></td>
        <td class="muted">${esc(o.items.map(it => it.item_name + ' ×' + it.quantity).join(', ')) || '—'}</td>
        <td>${UI.payPill(o.payment_method)}</td>
        <td><b>${money(o.total_amount)}</b></td>
        <td>${UI.statusPill(o.status)}</td>
        <td class="muted">${esc(o.createdAtLabel)}</td>
      </tr>
    `).join('') || `<tr><td colspan="6" class="empty-hint">Hali buyurtma yo'q</td></tr>`;
    },
};

/* -------------------------------------------------------------------------
   10. SUPER PANEL uchun qo'shimcha render chaqiruvlari
------------------------------------------------------------------------- */
const _originalSwitchSuperPanel = UI.switchSuperPanel;
UI.switchSuperPanel = function (id) {
    _originalSwitchSuperPanel.call(UI, id);
    if (id === 's-payments') UI.renderSuperPayments();
};

/* -------------------------------------------------------------------------
   11. INIT
------------------------------------------------------------------------- */
(function init() {
    hydrateIcons(document);
    UI.checkConnection();
    UI.setRangePresetDefaults();
    setInterval(() => { if (SESSION.role === 'admin') UI.updateRangePreview(); }, 60000);
})();
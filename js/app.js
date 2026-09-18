/* =========================================================================
   QORABUG' POS — Application logic (Multi-tenant SaaS edition)
   Cafe isolation is enforced by filtering every query with SESSION.cafeId.
   ========================================================================= */

/* -------------------------------------------------------------------------
   0. CONFIG
------------------------------------------------------------------------- */
const CONFIG = {
    SUPABASE_URL: 'https://cunpybjqngnskrjjevyi.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bnB5Ympxbmduc2tyampldnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjI1MjgsImV4cCI6MjEwNTI5ODUyOH0.v9-FrBbRnWQWCg_BTcguW1Az6jaWiJiGZ6DJOxT7vbY',
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
   2. LABELS
------------------------------------------------------------------------- */
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
const CAT_BADGE = ['orange', 'blue', 'green'];
const CAT_BG = ['var(--orange-soft)', 'var(--blue-soft)', 'var(--green-soft)'];

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
   3. STATE  (SESSION now carries cafeId / cafeName)
------------------------------------------------------------------------- */
let DB = {categories: [], menu: [], tables: [], staffDirectory: [], orders: []};
let SESSION = {role: null, cafeId: null, cafeName: null, staffId: null, staffName: null};
let loginRole = null;               // 'admin' | 'waiter' (chosen before login)
let realtimeChannel = null;
let refreshTimer = null;

let waiterSelectedTableId = null;
let waiterCart = {};
let currentOrderType = 'ichkarida';
let currentPayMethod = 'naqd';

let adminMenuCatFilter = 'barchasi';
let waiterMenuCatFilter = 'barchasi';

/* -------------------------------------------------------------------------
   4. HELPERS
------------------------------------------------------------------------- */
function money(n) {
    return Math.round(n || 0).toLocaleString('fr-FR').replace(/,/g, ' ') + " so'm";
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

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function toast(msg, isErr) {
    const el = document.getElementById('toast');
    el.classList.toggle('err', !!isErr);
    el.innerHTML = icon(isErr ? 'x' : 'check', 15) + `<span>${msg}</span>`;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2600);
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
    return c ? c.icon : 'grid';
}

/* -------------------------------------------------------------------------
   5. DATA LAYER — every read is scoped to SESSION.cafeId
------------------------------------------------------------------------- */
async function fetchCategories() {
    const {data, error} = await sb.from('categories').select('*')
        .eq('cafe_id', SESSION.cafeId).order('sort_order');
    if (error) throw error;
    return data;
}

async function fetchMenu() {
    const {data, error} = await sb.from('menu_items').select('*')
        .eq('cafe_id', SESSION.cafeId).order('created_at');
    if (error) throw error;
    return data;
}

async function fetchTables() {
    const {data, error} = await sb.from('restaurant_tables').select('*')
        .eq('cafe_id', SESSION.cafeId).order('created_at');
    if (error) throw error;
    return data;
}

async function fetchStaffDirectory() {
    const {data, error} = await sb.from('staff_directory').select('*')
        .eq('cafe_id', SESSION.cafeId).order('full_name');
    if (error) throw error;
    return data;
}

async function fetchOrders() {
    const {data, error} = await sb
        .from('orders')
        .select('*, order_items(*), restaurant_tables(name)')
        .eq('cafe_id', SESSION.cafeId)
        .order('created_at', {ascending: false});
    if (error) throw error;
    return data;
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
   6. REALTIME
------------------------------------------------------------------------- */
function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
        try {
            await refreshFromDB();
            UI.rerenderActive();
        } catch (e) {
            console.error(e);
        }
    }, 350);
}

function subscribeRealtime() {
    if (realtimeChannel) return;
    // Realtime filtri cafe_id bo'yicha — faqat shu kafe o'zgarishlari keladi
    const filter = `cafe_id=eq.${SESSION.cafeId}`;
    realtimeChannel = sb.channel('qorabug-pos-' + SESSION.cafeId)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'orders', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'order_items'}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'restaurant_tables', filter}, scheduleRefresh)
        .on('postgres_changes', {event: '*', schema: 'public', table: 'menu_items', filter}, scheduleRefresh)
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
   7. MODAL
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
   8. UI CONTROLLER
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
            el.innerHTML = icon('x', 14) + ` Ulanish xatosi: ${supaErrorMessage(e)} — app.js dagi CONFIG ni tekshiring`;
        }
    },

    /* ---------- LOGIN FLOW ---------- */
    chooseRole(role) {
        loginRole = role;
        document.getElementById('role-grid').style.display = 'none';
        document.getElementById('login-foot').classList.add('hidden');
        document.getElementById('register-form').classList.remove('show');
        document.getElementById('login-form').classList.add('show');
        document.getElementById('login-form-title').textContent =
            role === 'admin' ? 'Admin sifatida kirish' : 'Afitsant sifatida kirish';
        document.getElementById('login-title').textContent =
            role === 'admin' ? 'Admin kirishi' : 'Afitsant kirishi';
        document.getElementById('login-err').textContent = '';
    },
    showRegister() {
        loginRole = null;
        document.getElementById('role-grid').style.display = 'none';
        document.getElementById('login-form').classList.remove('show');
        document.getElementById('login-foot').classList.add('hidden');
        document.getElementById('register-form').classList.add('show');
        document.getElementById('login-title').textContent = "Ro'yxatdan o'tish";
        document.getElementById('login-sub').textContent = 'Yangi kafe va admin hisobini yarating';
        document.getElementById('register-err').textContent = '';
    },
    backToRoles() {
        loginRole = null;
        document.getElementById('role-grid').style.display = 'grid';
        document.getElementById('login-form').classList.remove('show');
        document.getElementById('register-form').classList.remove('show');
        document.getElementById('login-foot').classList.remove('hidden');
        document.getElementById('login-title').textContent = 'Xush kelibsiz';
        document.getElementById('login-sub').textContent = 'Tizimga kirish uchun telefon raqam va parolni kiriting';
        document.getElementById('login-phone').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-err').textContent = '';
    },

    async login() {
        if (loginRole === 'super') { return UI.superLogin(); }
        const phone = document.getElementById('login-phone').value.trim();
        const password = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-err');
        errEl.textContent = '';
        if (!phone || !password) {
            errEl.textContent = 'Telefon va parolni kiriting';
            return;
        }

        const {data, error} = await sb.rpc('staff_login', {p_phone: phone, p_password: password});
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
            errEl.textContent = "Telefon yoki parol noto'g'ri";
            return;
        }
        if (error || !row) {
            // Muddat tugaganini tekshiramiz — aniq xabar berish uchun
            const {data: st} = await sb.rpc('cafe_status_by_phone', {p_phone: phone});
            const info = Array.isArray(st) ? st[0] : st;
            if (info && info.expired) {
                errEl.innerHTML = `<b>${info.cafe_name}</b> obuna muddati tugagan ` +
                    `(${nowStrFromISO(info.expires_at)}). Tizim egasiga murojaat qiling.`;
                return;
            }
            errEl.textContent = "Telefon yoki parol noto'g'ri";
            return;
        }
        if (loginRole && row.role !== loginRole) {
            errEl.textContent = `Bu hisob ${row.role === 'admin' ? 'Admin' : 'Afitsant'} hisobi. To'g'ri panelni tanlang.`;
            return;
        }

        SESSION = {
            role: row.role,
            cafeId: row.cafe_id,
            cafeName: row.cafe_name,
            staffId: row.id,
            staffName: row.full_name
        };
        document.getElementById('login-phone').value = '';
        document.getElementById('login-password').value = '';

        if (SESSION.role === 'admin') {
            document.getElementById('admin-cafe-name').textContent = SESSION.cafeName;
            document.getElementById('screen-login').classList.add('hidden');
            document.getElementById('screen-admin').classList.remove('hidden');
            subscribeRealtime();
            await refreshFromDB();
            UI.renderAll();
        } else {
            document.getElementById('waiter-cafe-name').textContent = SESSION.cafeName;
            document.getElementById('screen-login').classList.add('hidden');
            document.getElementById('screen-waiter').classList.remove('hidden');
            subscribeRealtime();
            await refreshFromDB();
            UI.renderWaiterPeople();
            UI.changeTable();
            UI.renderWaiterMyOrders();
        }
    },

    /* =========================================================
   SUPER ADMIN
========================================================= */
    async superLogin() {
        const phone = document.getElementById('login-phone').value.trim();
        const password = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-err');
        errEl.textContent = '';
        if (!phone || !password) {
            errEl.textContent = 'Telefon va parolni kiriting';
            return;
        }

        const {data, error} = await sb.rpc('super_admin_login', {p_phone: phone, p_password: password});
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
            errEl.textContent = "Telefon yoki parol noto'g'ri";
            return;
        }

        SUPER = {id: row.id, name: row.full_name, phone: row.phone};
        document.getElementById('login-phone').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('screen-login').classList.add('hidden');
        document.getElementById('screen-super').classList.remove('hidden');
        document.getElementById('super-people').innerHTML = `
          <div class="avatar-chip"><div class="av">${initials(SUPER.name)}</div>
          <div class="info"><div class="n">${SUPER.name}</div><div class="r">Super Admin</div></div></div>`;
        await UI.loadSuperDashboard();
        await UI.renderSuperPayments();
        UI.populateSuperReportCafes();
        toast('Super admin sifatida kirdingiz');
    },

    switchSuperPanel(id) {
        document.querySelectorAll('#screen-super .panel').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#screen-super .nav-list button')
            .forEach(b => b.classList.toggle('active', b.dataset.panel === id));
        if (id === 's-subs') UI.renderSuperPayments();
        if (id === 's-report') UI.renderSuperReport();
    },

    async loadSuperDashboard() {
        try {
            superCafes = await fetchSuperDashboard();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }

        const total = superCafes.length;
        const active = superCafes.filter(c => !c.expired && c.is_active).length;
        const expired = superCafes.filter(c => c.expired).length;
        const revenue = superCafes.reduce((s, c) => s + Number(c.total_revenue), 0);

        document.getElementById('super-stats').innerHTML = `
          <div class="stat"><div class="stat-ico" style="background:var(--blue-soft);color:#2E56BE;">${icon('grid', 20)}</div><div><div class="num">${total}</div><div class="lbl">Jami kafelar</div></div></div>
          <div class="stat"><div class="stat-ico" style="background:var(--green-soft);color:var(--green-darker);">${icon('check', 20)}</div><div><div class="num">${active}</div><div class="lbl">Faol obunalar</div></div></div>
          <div class="stat"><div class="stat-ico" style="background:var(--red-soft);color:#B8362C;">${icon('x', 20)}</div><div><div class="num">${expired}</div><div class="lbl">Muddati o'tgan</div></div></div>`;

        document.getElementById('super-cafes-table').querySelector('tbody').innerHTML =
            superCafes.map(c => `
          <tr>
            <td><b>${c.name}</b></td>
            <td class="muted">${c.owner_name || '—'}<br>${c.phone || '—'}</td>
            <td class="muted">${c.expires_at ? nowStrFromISO(c.expires_at) : '—'}</td>
            <td><span class="expiry-chip ${expiryClass(c.days_left, c.expired)}">${expiryText(c.days_left, c.expired)}</span></td>
            <td><b>${money(c.total_revenue)}</b><div class="muted">${c.paid_orders} ta to'lov</div></td>
            <td>${c.is_active ? '<span class="pill green dot">Faol</span>' : '<span class="pill red dot">Bloklangan</span>'}</td>
            <td><div class="row" style="gap:6px;">
  <button class="btn outline small" onclick="UI.openExtendModal('${c.cafe_id}')">Boshqarish</button>
  <div class="dropdown-inline">
    <button class="btn ghost small" onclick="UI.quickExtend('${c.cafe_id}', 1)">+1 oy</button>
    <button class="btn ghost small" onclick="UI.quickExtend('${c.cafe_id}', 3)">+3 oy</button>
    <button class="btn ghost small" onclick="UI.quickExtend('${c.cafe_id}', 12)">+1 yil</button>
  </div>
  <button class="icon-btn sm" title="${c.is_active ? 'Bloklash' : 'Yoqish'}"
    onclick="UI.toggleCafeActive('${c.cafe_id}', ${!c.is_active})">${icon(c.is_active ? 'x' : 'check', 14)}</button>
</div></td>

          </tr>`).join('') || `<tr><td colspan="7" class="empty-hint">Kafelar yo'q</td></tr>`;
    },

    // Bir tugma bilan tez uzaytirish (summasiz)
    async quickExtend(cafeId, months) {
        const {error} = await sb.rpc('super_admin_extend_custom', {
            p_cafe_id: cafeId, p_months: months, p_days: 0,
            p_amount: 0, p_method: 'naqd', p_note: null
        });
        if (error) { toast(supaErrorMessage(error), true); return; }
        await UI.loadSuperDashboard();
        toast(`+${months} oy qo'shildi`);
    },


    openExtendModal(cafeId) {
        const c = superCafes.find(x => x.cafe_id === cafeId);
        Modal.open(`
          <div class="modal-head"><h3>Obunani belgilash</h3>
            <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
          <p class="muted" style="margin-bottom:16px;"><b>${c.name}</b><br>
             Hozirgi muddat: ${c.expires_at ? nowStrFromISO(c.expires_at) : '—'}
             ${c.days_left !== null ? ' · ' + expiryText(c.days_left, c.expired) : ''}</p>

          <div class="field">
            <label>Tez tanlash</label>
            <div class="quick-months" id="ex-quick">
              <button type="button" class="qm" data-months="1">1 oy</button>
              <button type="button" class="qm" data-months="3">3 oy</button>
              <button type="button" class="qm" data-months="6">6 oy</button>
              <button type="button" class="qm" data-months="12">1 yil</button>
              <button type="button" class="qm" data-days="7">7 kun</button>
              <button type="button" class="qm" data-days="15">15 kun</button>
              <button type="button" class="qm" data-days="30">30 kun</button>
            </div>
          </div>

          <div class="row" style="gap:12px; align-items:flex-end;">
            <div class="field" style="flex:1;">
              <label>Oy</label>
              <input type="number" id="ex-months" min="0" max="120" value="1">
            </div>
            <div class="field" style="flex:1;">
              <label>Yoki kun</label>
              <input type="number" id="ex-days" min="0" max="3650" value="0" placeholder="0">
            </div>
          </div>
          <p class="muted" style="margin:-8px 0 14px;">Oy va kunni birga kiritishingiz ham mumkin (ikkisi qo'shiladi).</p>

          <div class="field"><label>To'lov summasi (so'm)</label>
            <input type="number" id="ex-amount" placeholder="0" value="0"></div>
          <div class="field"><label>To'lov usuli</label>
            <select id="ex-method">
              <option value="naqd">Naqd</option><option value="karta">Karta</option>
              <option value="qr">QR kod</option><option value="bank">Bank</option>
            </select></div>
          <div class="field"><label>Izoh (ixtiyoriy)</label>
            <input type="text" id="ex-note" placeholder="Masalan: yanvar to'lovi"></div>

          <div class="extend-preview" id="ex-preview"></div>
          <button class="btn primary block" onclick="UI.saveExtend('${cafeId}')">${icon('check', 16)} Saqlash</button>
        `);

        // tez tugmalar
        document.querySelectorAll('#ex-quick .qm').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#ex-quick .qm').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (btn.dataset.months) {
                    document.getElementById('ex-months').value = btn.dataset.months;
                    document.getElementById('ex-days').value = 0;
                } else {
                    document.getElementById('ex-days').value = btn.dataset.days;
                    document.getElementById('ex-months').value = 0;
                }
                UI.updateExtendPreview(c);
            };
        });
        ['ex-months', 'ex-days'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => UI.updateExtendPreview(c));
        });
        UI.updateExtendPreview(c);
    },

    updateExtendPreview(c) {
        const months = parseInt(document.getElementById('ex-months').value, 10) || 0;
        const days   = parseInt(document.getElementById('ex-days').value, 10) || 0;
        const el = document.getElementById('ex-preview');

        const base = c.expires_at && !c.expired ? new Date(c.expires_at) : new Date();
        const end = new Date(base);
        end.setMonth(end.getMonth() + months);
        end.setDate(end.getDate() + days);

        if (months <= 0 && days <= 0) {
            el.innerHTML = `<span class="muted">Muddatni kiriting</span>`;
            return;
        }
        el.innerHTML = `<span class="muted">Yangi muddat:</span>
            <b>${end.toLocaleDateString('uz-UZ')}</b>`;
    },

    async saveExtend(cafeId) {
        const months = parseInt(document.getElementById('ex-months').value, 10) || 0;
        const days   = parseInt(document.getElementById('ex-days').value, 10) || 0;
        const amount = parseFloat(document.getElementById('ex-amount').value) || 0;
        const method = document.getElementById('ex-method').value;
        const note   = document.getElementById('ex-note').value.trim() || null;

        if (months <= 0 && days <= 0) {
            toast('Oy yoki kun kiritilishi shart', true);
            return;
        }

        const {error} = await sb.rpc('super_admin_extend_custom', {
            p_cafe_id: cafeId,
            p_months: months,
            p_days: days,
            p_amount: amount,
            p_method: method,
            p_note: note
        });
        if (error) { toast(supaErrorMessage(error), true); return; }
        Modal.close();
        await UI.loadSuperDashboard();
        await UI.renderSuperPayments();
        UI.populateSuperReportCafes();
        toast('Obuna belgilandi');
    },


    async toggleCafeActive(cafeId, makeActive) {
        const {error} = await sb.rpc('super_admin_set_active', {p_cafe_id: cafeId, p_active: makeActive});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await UI.loadSuperDashboard();
        toast(makeActive ? 'Kafe yoqildi' : 'Kafe bloklandi');
    },

    async renderSuperPayments() {
        let rows = [];
        try {
            rows = await fetchSuperPayments();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }
        document.getElementById('super-payments-table').querySelector('tbody').innerHTML =
            rows.map(p => `
          <tr>
            <td><b>${p.cafes ? p.cafes.name : '—'}</b></td>
            <td>${p.months} oy</td>
            <td><b>${money(p.amount)}</b></td>
            <td class="muted">${(PAY_META[p.payment_method] || {}).label || p.payment_method}</td>
            <td class="muted">${nowStrFromISO(p.period_start)} → ${nowStrFromISO(p.period_end)}</td>
            <td class="muted">${p.note || '—'}</td>
            <td class="muted">${nowStrFromISO(p.created_at)}</td>
          </tr>`).join('') || `<tr><td colspan="7" class="empty-hint">To'lovlar yo'q</td></tr>`;
    },

    populateSuperReportCafes() {
        const sel = document.getElementById('super-report-cafe');
        sel.innerHTML = superCafes.map(c =>
            `<option value="${c.cafe_id}">${c.name}</option>`).join('');
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

        const daily = data.daily || [];
        const allTime = data.daily.reduce((a, d) => ({
            revenue: a.revenue + Number(d.revenue),
            paid_orders: a.paid_orders + Number(d.paid_orders),
            tips: a.tips + Number(d.tips)
        }), {revenue: 0, paid_orders: 0, tips: 0});

        document.getElementById('super-report-stats').innerHTML = `
          <div class="stat"><div class="stat-ico" style="background:var(--green-soft);color:var(--green-darker);">${icon('cash', 20)}</div><div><div class="num">${money(allTime.revenue)}</div><div class="lbl">Jami tushum</div></div></div>
          <div class="stat"><div class="stat-ico" style="background:var(--blue-soft);color:#2E56BE;">${icon('clipboard', 20)}</div><div><div class="num">${data.cafe ? data.cafe.subscription_months : 0} oy</div><div class="lbl">Obuna (oy)</div></div></div>
          <div class="stat"><div class="stat-ico" style="background:var(--orange-soft);color:#93650F;">${icon('cash', 20)}</div><div><div class="num">${money(reportTotalPayments(data))}</div><div class="lbl">Jami obuna to'lovi</div></div></div>`;

        const cats = reportList(data, 'categories');
        const maxCat = Math.max(1, ...cats.map(c => Number(c.revenue)));
        document.getElementById('super-report-category').innerHTML = cats.map(c => `
          <div style="margin-bottom:14px;">
            <div class="row" style="justify-content:space-between; font-size:13px; margin-bottom:5px;">
              <span>${c.category_name}</span><b>${money(c.revenue)}</b></div>
            <div style="background:var(--surface-soft);border-radius:6px;height:8px;overflow:hidden;">
              <div style="background:var(--green);width:${Number(c.revenue) / maxCat * 100}%;height:100%;"></div></div>
          </div>`).join('') || `<div class="empty-hint">Ma'lumot yo'q</div>`;

        const tops = reportList(data, 'top_items');
        document.getElementById('super-report-top').innerHTML = tops.length ? tops.map((it, i) => `
          <div class="row" style="justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:13.5px;">
            <span>${i + 1}. ${it.item_name}</span><b>${it.qty_sold} dona</b></div>`).join('')
            : `<div class="empty-hint">Ma'lumot yo'q</div>`;

        const pays = reportList(data, 'payments');
        document.getElementById('super-report-payments').querySelector('tbody').innerHTML =
            pays.map(p => `<tr><td>${p.months} oy</td><td><b>${money(p.amount)}</b></td>
              <td class="muted">${nowStrFromISO(p.period_start)} → ${nowStrFromISO(p.period_end)}</td>
              <td class="muted">${nowStrFromISO(p.created_at)}</td></tr>`).join('')
            || `<tr><td colspan="4" class="empty-hint">To'lov yo'q</td></tr>`;
    },


    async registerCafe() {
        const name = document.getElementById('reg-cafe').value.trim();
        const adminName = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const errEl = document.getElementById('register-err');
        errEl.textContent = '';
        if (!name || !adminName || !phone || !password) {
            errEl.textContent = "Barcha maydonlarni to'ldiring";
            return;
        }

        const {error} = await sb.rpc('register_cafe', {
            p_cafe_name: name, p_admin_name: adminName, p_phone: phone, p_password: password
        });
        if (error) {
            errEl.textContent = supaErrorMessage(error);
            return;
        }
        toast('Kafe yaratildi! Endi telefon va parol bilan kiring');
        document.getElementById('reg-cafe').value = '';
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-phone').value = '';
        document.getElementById('reg-password').value = '';
        UI.chooseRole('admin');
    },

    logout() {
        SUPER = {id: null, name: null, phone: null};
        superCafes = [];
        document.getElementById('screen-super').classList.add('hidden');
        unsubscribeRealtime();
        SESSION = {role: null, cafeId: null, cafeName: null, staffId: null, staffName: null};
        waiterSelectedTableId = null;
        waiterCart = {};
        currentOrderType = 'ichkarida';
        currentPayMethod = 'naqd';
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
    },
    switchWaiterPanel(id) {
        document.querySelectorAll('#screen-waiter .panel').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('#screen-waiter .nav-list button').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
        if (id === 'w-myorders') UI.renderWaiterMyOrders();
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
          <div class="info"><div class="n">${w.full_name}</div><div class="r">${w.is_active ? 'Afitsant' : 'Nofaol'}</div></div>
        </div>
      `).join('');
    },
    renderWaiterPeople() {
        document.getElementById('waiter-people').innerHTML = `
      <div class="avatar-chip">
        <div class="av">${initials(SESSION.staffName)}</div>
        <div class="info"><div class="n">${SESSION.staffName || '—'}</div><div class="r">Afitsant</div></div>
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
            {
                lbl: 'Bugungi tushum',
                num: money(revenue),
                ic: 'cash',
                bg: 'var(--green-soft)',
                fg: 'var(--green-darker)'
            },
            {lbl: 'Bugungi buyurtmalar', num: todays.length, ic: 'clipboard', bg: 'var(--blue-soft)', fg: '#2E56BE'},
            {
                lbl: 'Band stollar',
                num: busy + ' / ' + DB.tables.length,
                ic: 'table',
                bg: 'var(--orange-soft)',
                fg: '#93650F'
            },
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
        <td><b>${o.tableName}</b></td>
        <td>${o.waiterName}</td>
        <td>${money(o.total_amount)}</td>
        <td>${UI.statusPill(o.status)}</td>
        <td class="muted">${o.createdAtLabel}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" class="empty-hint">Hali buyurtma yo'q</td></tr>`;
    },

    /* =========================================================
       MENU
    ========================================================= */
    renderAdminMenuCatTiles() {
        const tiles = [{id: 'barchasi', name: 'Barchasi', icon: 'grid'}, ...DB.categories];
        document.getElementById('admin-menu-cat-tiles').innerHTML = tiles.map(c => {
            const count = c.id === 'barchasi' ? DB.menu.length : DB.menu.filter(m => m.category_id === c.id).length;
            return `
        <button class="cat-tile ${adminMenuCatFilter === c.id ? 'active' : ''}" onclick="UI.setAdminMenuCat('${c.id}')">
          <div class="ci">${icon(c.icon, 18)}</div>
          <div class="cn">${c.name}</div>
          <div class="cc">${count} ta</div>
        </button>`;
        }).join('');
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
          <button class="icon-btn sm" title="O'chirish" onclick="UI.deleteMenuItem('${m.id}')">${icon('trash', 14)}</button>
        </div>
        <div class="product-thumb" style="background:${catBg(m.category_id)};">${m.emoji || '🍽️'}</div>
        <span class="pill ${catBadgeClass(m.category_id)} dot p-cat">${catName(m.category_id)}</span>
        <div class="p-name">${m.name}</div>
        <div class="p-price">${money(m.price)}</div>
      </div>
    `).join('') || `<div class="empty-hint">Mahsulot topilmadi</div>`;
    },

    openMenuModal(id) {
        const item = id ? DB.menu.find(m => m.id === id) : null;
        const catOptions = DB.categories.map(c => `<option value="${c.id}" ${item && item.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
        Modal.open(`
      <div class="modal-head"><h3>${item ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
        <button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div class="field"><label>Nomi</label><input type="text" id="mm-name" value="${item ? item.name : ''}" placeholder="Masalan: Lag'mon"></div>
      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Toifa</label><select id="mm-cat">${catOptions}</select></div>
        <div class="field" style="width:90px;"><label>Emoji</label><input type="text" id="mm-emoji" value="${item ? (item.emoji || '') : ''}" placeholder="🍜"></div>
      </div>
      <div class="field"><label>Narxi (so'm)</label><input type="number" id="mm-price" value="${item ? item.price : ''}" placeholder="30000"></div>
      <button class="btn primary block" onclick="UI.saveMenuItem('${item ? item.id : ''}')">${icon('check', 16)} Saqlash</button>
    `);
    },
    async saveMenuItem(id) {
        const name = document.getElementById('mm-name').value.trim();
        const category_id = document.getElementById('mm-cat').value;
        const price = parseInt(document.getElementById('mm-price').value, 10);
        let emoji = document.getElementById('mm-emoji').value.trim() || '🍽️';
        if (!name || !price || price <= 0 || !category_id) {
            toast("Ma'lumotlarni to'liq kiriting", true);
            return;
        }

        const payload = {name, category_id, price, emoji, cafe_id: SESSION.cafeId};
        const {error} = id
            ? await sb.from('menu_items').update(payload).eq('id', id).eq('cafe_id', SESSION.cafeId)
            : await sb.from('menu_items').insert(payload);
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
        const {error} = await sb.from('menu_items').update({is_available: makeAvailable}).eq('id', id).eq('cafe_id', SESSION.cafeId);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminMenuGrid();
    },
    async deleteMenuItem(id) {
        if (!confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;
        const {error} = await sb.from('menu_items').delete().eq('id', id).eq('cafe_id', SESSION.cafeId);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminMenuCatTiles();
        UI.renderAdminMenuGrid();
    },

    /* =========================================================
       TABLES
    ========================================================= */
    renderAdminTablesGrid() {
        document.getElementById('admin-tables-grid').innerHTML = DB.tables.map(t => `
      <div class="table-tile ${t.status === 'bosh' ? 'empty' : 'busy'}" onclick="UI.toggleTableStatus('${t.id}')">
        <div class="tt-ico">${icon(t.status === 'bosh' ? 'table' : 'clipboard', 20)}</div>
        <div class="tt-name">${t.name}</div>
        <div class="tt-status">${t.status === 'bosh' ? "Bo'sh" : 'Band'}</div>
      </div>
    `).join('');
    },
    async toggleTableStatus(id) {
        const t = DB.tables.find(t => t.id === id);
        const hasOpenOrder = DB.orders.some(o => o.table_id === id && o.status !== 'tolangan');
        if (t.status === 'band' && hasOpenOrder) {
            toast("Bu stolda faol buyurtma bor. Avval 'Buyurtmalar' bo'limidan yakunlang.", true);
            return;
        }
        const {error} = await sb.from('restaurant_tables')
            .update({status: t.status === 'bosh' ? 'band' : 'bosh'})
            .eq('id', id).eq('cafe_id', SESSION.cafeId);
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminTablesGrid();
    },
    async addTable() {
        const nextNum = DB.tables.length + 1;
        const {error} = await sb.from('restaurant_tables').insert({name: 'Stol ' + nextNum, cafe_id: SESSION.cafeId});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAdminTablesGrid();
    },

    /* =========================================================
       ORDERS
    ========================================================= */
    renderOrdersTable() {
        const filter = document.getElementById('orders-filter').value;
        const rows = DB.orders.filter(o => filter === 'all' || o.status === filter);
        document.getElementById('admin-orders-table').querySelector('tbody').innerHTML = rows.map(o => `
      <tr>
        <td class="muted">#${o.id.slice(0, 8)}</td>
        <td><b>${o.tableName}</b></td>
        <td>${o.waiterName}</td>
        <td class="muted">${o.items.map(it => it.item_name + ' ×' + it.quantity).join(', ')}</td>
        <td>${UI.payPill(o.payment_method)}</td>
        <td><b>${money(o.total_amount)}</b></td>
        <td>
          <select class="status-select st-${o.status}" onchange="UI.setOrderStatus('${o.id}', this.value)">
            ${Object.keys(STATUS_META).map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_META[s].label}</option>`).join('')}
          </select>
        </td>
        <td class="muted">${o.createdAtLabel}</td>
        <td><button class="btn outline small" onclick="UI.openReceipt('${o.id}')">Chek</button></td>
      </tr>
    `).join('') || `<tr><td colspan="9" class="empty-hint">Buyurtmalar topilmadi</td></tr>`;
    },
    async setOrderStatus(id, status) {
        const {error} = await sb.rpc('set_order_status', {p_cafe_id: SESSION.cafeId, p_order_id: id, p_status: status});
        if (error) {
            toast(supaErrorMessage(error), true);
            return;
        }
        await refreshFromDB();
        UI.renderAll();
        toast('Holat yangilandi');
    },
    openReceipt(id) {
        const o = DB.orders.find(o => o.id === id);
        Modal.open(`
      <div class="modal-head"><h3>Chek</h3><button class="icon-btn sm" onclick="Modal.close()">${icon('x', 15)}</button></div>
      <div id="print-area">
        <div class="receipt">
          <h3 class="r-brand">☕ ${SESSION.cafeName || "Qorabug' Kafe"}</h3>
          <div class="r-sub">${o.tableName} · ${o.createdAtLabel}</div>
          <hr>
          ${o.items.map(it => `<div class="r-line"><span>${it.item_name} ×${it.quantity}</span><span>${money(it.line_total)}</span></div>`).join('')}
          <hr>
          <div class="r-line"><span>Taomlar summasi</span><span>${money(o.subtotal)}</span></div>
          <div class="r-line"><span>Choyxaqa (${o.tip_percent_snapshot}%)</span><span>${money(o.tip_amount)}</span></div>
          <div class="r-line r-total"><span>Jami to'lov</span><span>${money(o.total_amount)}</span></div>
          <hr>
          <div class="r-line"><span>To'lov usuli</span><span>${(PAY_META[o.payment_method] || PAY_META.naqd).label}</span></div>
          <div class="r-sub" style="margin-top:4px;">Afitsant: ${o.waiterName}</div>
          <div class="r-sub" style="margin-top:10px;">Xaridingiz uchun rahmat!</div>
        </div>
      </div>
      <div class="row" style="margin-top:18px;">
        <button class="btn ghost" onclick="Modal.close()">Yopish</button>
        <button class="btn primary" style="flex:1" onclick="window.print()">Chop etish</button>
        ${o.status !== 'tolangan' ? `<button class="btn outline" onclick="UI.setOrderStatus('${o.id}','tolangan'); Modal.close();">To'landi deb belgilash</button>` : ''}
      </div>
    `, 'wide');
    },

    /* =========================================================
       STAFF CRUD (admin) — endi to'liq CRUD
    ========================================================= */
    async renderStaffTable() {
        let reportRows = [];
        try {
            const {data, error} = await sb.from('v_waiter_report').select('*').eq('cafe_id', SESSION.cafeId);
            if (error) throw error;
            reportRows = data;
        } catch (e) {
            toast(supaErrorMessage(e), true);
        }

        const reportByWaiter = {};
        reportRows.forEach(r => reportByWaiter[r.waiter_id] = r);

        const rows = DB.staffDirectory.map(s => {
            const rep = reportByWaiter[s.id] || {paid_orders_count: 0, total_sales: 0, total_tip_amount: 0};
            const isWaiter = s.role === 'waiter';
            return `
      <tr style="${s.is_active ? '' : 'opacity:.55;'}">
        <td>
          <div class="row">
            <div class="av" style="width:28px;height:28px;border-radius:50%;background:var(--green-soft);color:var(--green-darker);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;">${initials(s.full_name)}</div>
            <b>${s.full_name}</b> ${s.is_active ? '' : '<span class="pill grey">Nofaol</span>'}
          </div>
        </td>
        <td class="muted">${s.phone || '—'}</td>
        <td>${s.role === 'admin' ? '<span class="pill blue">Admin</span>' : '<span class="pill green">Afitsant</span>'}</td>
        <td>${isWaiter ? (rep.paid_orders_count + ' ta · ' + money(rep.total_sales)) : '—'}</td>
        <td>${isWaiter ? `<input type="number" value="${s.tip_percent}" min="0" max="100" style="width:78px;" onchange="UI.setStaffTip('${s.id}', this.value)">` : '—'}</td>
        <td>${isWaiter ? `<b style="color:var(--green-darker)">${money(rep.total_tip_amount)}</b>` : '—'}</td>
        <td>
          <div class="row" style="gap:6px;">
            <button class="icon-btn sm" title="Tahrirlash" onclick="UI.openStaffModal('${s.id}')">${icon('edit', 14)}</button>
            <button class="icon-btn sm" title="${s.is_active ? 'Nofaol qilish' : 'Faollashtirish'}" onclick="UI.toggleStaffActive('${s.id}', ${!s.is_active})">${icon(s.is_active ? 'x' : 'check', 14)}</button>
            ${isWaiter ? `<button class="icon-btn sm" title="O'chirish" onclick="UI.deleteStaff('${s.id}')">${icon('trash', 14)}</button>` : ''}
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
        <input type="text" id="sm-name" value="${s ? s.full_name : ''}" placeholder="Ism familiya"></div>

      <div class="field"><label>Telefon raqam (login)</label>
        <input type="tel" id="sm-phone" value="${s ? (s.phone || '') : ''}" placeholder="+998 90 123 45 67" inputmode="tel"></div>

      ${roleLocked ? '' : `
      <div class="field"><label>Rol</label>
        <select id="sm-role">
          <option value="waiter" ${s && s.role === 'waiter' ? 'selected' : ''}>Afitsant</option>
          <option value="admin"  ${s && s.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>`}

      <div class="field"><label>${isEdit ? 'Yangi parol (bo\'sh qoldirsangiz o\'zgarmaydi)' : 'Parol'}</label>
        <input type="password" id="sm-password" placeholder="${isEdit ? 'O\'zgartirmaslik uchun bo\'sh qoldiring' : 'Parol o\'ylab toping'}" autocomplete="new-password"></div>

      <div class="field"><label>Choyxaqa % (afitsant uchun)</label>
        <input type="number" id="sm-tip" value="${s ? s.tip_percent : 10}" min="0" max="100">
      </div>

      <button class="btn primary block" onclick="UI.saveStaff('${isEdit ? s.id : ''}')">${icon('check', 16)} Saqlash</button>
    `);
    },

    async saveStaff(id) {
        const name = document.getElementById('sm-name').value.trim();
        const phone = document.getElementById('sm-phone').value.trim();
        const password = document.getElementById('sm-password').value;
        const tip = parseInt(document.getElementById('sm-tip').value, 10);
        const roleEl = document.getElementById('sm-role');
        const role = roleEl ? roleEl.value : (id ? (DB.staffDirectory.find(x => x.id === id)?.role) : 'waiter');

        if (!name || !phone) {
            toast("Ism va telefon raqamni kiriting", true);
            return;
        }
        if (!id && !password) {
            toast("Yangi xodim uchun parol majburiy", true);
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
        const {error} = await sb.rpc('set_staff_active', {
            p_cafe_id: SESSION.cafeId,
            p_id: id,
            p_is_active: makeActive
        });
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
       REPORT
    ========================================================= */
    async renderReport() {
        let rep;
        try {
            rep = await loadReportData();
        } catch (e) {
            toast(supaErrorMessage(e), true);
            return;
        }

        const today = todayISO();
        const todayRow = rep.daily.find(d => d.day === today) || {revenue: 0, paid_orders: 0, tips: 0};
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

        const maxCat = Math.max(1, ...rep.catRev.map(c => Number(c.revenue)));
        document.getElementById('report-by-category').innerHTML = rep.catRev.map(c => `
      <div style="margin-bottom:14px;">
        <div class="row" style="justify-content:space-between; font-size:13px; margin-bottom:5px;">
          <span class="row" style="gap:6px;">${icon(c.category_icon || 'grid', 15)} ${c.category_name}</span><b>${money(c.revenue)}</b>
        </div>
        <div style="background:var(--surface-soft); border-radius:6px; height:8px; overflow:hidden;">
          <div style="background:var(--green); width:${(Number(c.revenue) / maxCat * 100)}%; height:100%;"></div>
        </div>
      </div>
    `).join('') || `<div class="empty-hint">Ma'lumot yo'q</div>`;

        document.getElementById('report-top-items').innerHTML = rep.topItems.length ? rep.topItems.map((it, i) => `
      <div class="row" style="justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:13.5px;">
        <span>${i + 1}. ${it.item_name}</span><b>${it.qty_sold} dona</b>
      </div>
    `).join('') : `<div class="empty-hint">Ma'lumot yo'q</div>`;
    },

    /* =========================================================
       WAITER PANEL
    ========================================================= */
    renderWaiterTablesGridSync() {
        document.getElementById('waiter-tables-grid').innerHTML = DB.tables.map(t => `
      <div class="table-tile ${t.status === 'bosh' ? 'empty' : 'busy'}" onclick="UI.selectTable('${t.id}')">
        <div class="tt-ico">${icon(t.status === 'bosh' ? 'table' : 'clipboard', 20)}</div>
        <div class="tt-name">${t.name}</div>
        <div class="tt-status">${t.status === 'bosh' ? "Bo'sh" : 'Band'}</div>
      </div>
    `).join('');
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
        const t = DB.tables.find(t => t.id === id);
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
        document.getElementById('waiter-selected-table').textContent = t.name;
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
        const tiles = [{id: 'barchasi', name: 'Barchasi', icon: 'grid'}, ...DB.categories];
        document.getElementById('waiter-menu-cat-tiles').innerHTML = tiles.map(c => {
            const count = c.id === 'barchasi' ? DB.menu.length : DB.menu.filter(m => m.category_id === c.id).length;
            return `
        <button class="cat-tile ${waiterMenuCatFilter === c.id ? 'active' : ''}" onclick="UI.setWaiterMenuCat('${c.id}')">
          <div class="ci">${icon(c.icon, 18)}</div>
          <div class="cn">${c.name}</div>
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
          <div class="product-thumb" style="background:${catBg(m.category_id)};">${m.emoji || '🍽️'}</div>
          <span class="pill ${catBadgeClass(m.category_id)} dot p-cat">${catName(m.category_id)}</span>
          <div class="p-name">${m.name}</div>
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
            const m = DB.menu.find(m => m.id === menuId);
            if (!m) return '';
            total += m.price * qty;
            count += qty;
            return `
        <div class="order-item-row">
          <div class="oi-thumb" style="background:${catBg(m.category_id)};">${m.emoji || '🍽️'}</div>
          <div class="oi-info">
            <div class="oi-name">${m.name}</div>
            <div class="oi-qty">${qty} X · ${money(m.price)}</div>
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
            const statusLabel = order ? STATUS_META[order.status].label : '';
            return `
        <button class="table-strip-pill" onclick="UI.selectTable('${t.id}')">
          <div class="av">${initials(waiterName)}</div>
          <div class="tsi"><div class="t1">${t.name}</div><div class="t2">${itemCount} taom → ${statusLabel}</div></div>
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

    async renderWaiterMyOrders() {
        const mine = DB.orders.filter(o => o.waiter_id === SESSION.staffId);
        document.getElementById('waiter-my-orders-table').querySelector('tbody').innerHTML = mine.map(o => `
      <tr>
        <td><b>${o.tableName}</b></td>
        <td class="muted">${o.items.map(it => it.item_name + ' ×' + it.quantity).join(', ')}</td>
        <td>${UI.payPill(o.payment_method)}</td>
        <td><b>${money(o.total_amount)}</b></td>
        <td>${UI.statusPill(o.status)}</td>
        <td class="muted">${o.createdAtLabel}</td>
      </tr>
    `).join('') || `<tr><td colspan="6" class="empty-hint">Hali buyurtma yo'q</td></tr>`;
    },
};

/* -------------------------------------------------------------------------
   9. INIT
------------------------------------------------------------------------- */
(async function init() {
    hydrateIcons(document);
    await UI.checkConnection();
})();

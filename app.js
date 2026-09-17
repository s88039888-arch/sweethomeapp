/* =========================================================
   SWEET HOME — إدارة الحلويات
   تطبيق ويب تقدمي (PWA) يعمل بالكامل من المتصفح/الجهاز
   جميع البيانات محفوظة محلياً على الجهاز (localStorage)
   ========================================================= */

const STORAGE_KEY = 'sweethome_state_v1';

const DEFAULT_STATE = {
  settings:{
    storeName:'Sweet Home',
    tagline:'بيت الحلويات... دائماً أحلى',
    logo:'logo.png',
    primary:'#B3122E',
    accent:'#C89B3C',
    bg:'#FBEFDA',
    ink:'#3B2417',
    font:'lalezar'
  },
  categories:['كيك','معجنات','حلويات شرقية','كوكيز وبسكويت'],
  branches:[
    {id:1,name:'فرع مدينة السلام', phone:'01094004001'},
    {id:2,name:'فرع قناة السويس', phone:'01090881475'},
    {id:3,name:'فرع الترعة', phone:'01022266663'},
    {id:4,name:'فرع النخلة', phone:'01002999907'}
  ],
  payment:{
    vodafoneCash:'01094004001',
    instapay:'SweetHome@instapay',
    codEnabled:true
  },
  products:[
    {id:'p1', name:'كيك شوكولاتة بالفراولة', category:'كيك', price:150, oldPrice:0, desc:'كيك طبقات شوكولاتة بالفراولة الطازجة وصوص شوكولاتة سائل', emoji:'🍰', image:''},
    {id:'p2', name:'ريد فيلفيت', category:'كيك', price:120, oldPrice:0, desc:'كيك ريد فيلفيت بكريمة الجبن الطرية', emoji:'❤️', image:''},
    {id:'p3', name:'تشيز كيك فراولة', category:'كيك', price:110, oldPrice:130, desc:'تشيز كيك كريمي بصوص الفراولة الطبيعي', emoji:'🍓', image:''},
    {id:'p4', name:'كب كيك مشكل (4 قطع)', category:'كيك', price:60, oldPrice:0, desc:'تشكيلة كب كيك بالكريمة الملونة', emoji:'🧁', image:''},
    {id:'p5', name:'كرواسون بالشوكولاتة', category:'معجنات', price:35, oldPrice:0, desc:'كرواسون فرنساوي هش محشو شوكولاتة', emoji:'🥐', image:''},
    {id:'p6', name:'دانيش بالجبنة', category:'معجنات', price:30, oldPrice:0, desc:'معجنات طازجة محشوة جبنة كريمي', emoji:'🥮', image:''},
    {id:'p7', name:'فطيرة السبانخ', category:'معجنات', price:25, oldPrice:0, desc:'فطيرة بيتي بالسبانخ الطازجة', emoji:'🥟', image:''},
    {id:'p8', name:'كنافة بالجبنة', category:'حلويات شرقية', price:75, oldPrice:0, desc:'كنافة طازجة محشوة جبنة مع قطر بلدي', emoji:'🧡', image:''},
    {id:'p9', name:'بقلاوة مشكل', category:'حلويات شرقية', price:90, oldPrice:0, desc:'تشكيلة بقلاوة بالفستق واللوز', emoji:'🥮', image:''},
    {id:'p10', name:'بسبوسة بالقشطة', category:'حلويات شرقية', price:50, oldPrice:0, desc:'بسبوسة طرية بالقشطة الطازجة', emoji:'🍯', image:''},
    {id:'p11', name:'كوكيز شوكولاتة تشيب', category:'كوكيز وبسكويت', price:45, oldPrice:0, desc:'كوكيز مقرمش من الخارج طري من الداخل بقطع شوكولاتة', emoji:'🍪', image:''},
    {id:'p12', name:'بسكويت زبدة دنماركي', category:'كوكيز وبسكويت', price:40, oldPrice:0, desc:'بسكويت زبدة فاخر بطعم غني', emoji:'🍪', image:''}
  ],
  orders:[],
  adminPassword:'admin123',
  categoryImages:{}
};

const CATEGORY_EMOJI = {
  'كيك':'🎂','معجنات':'🥐','حلويات شرقية':'🧡','كوكيز وبسكويت':'🍪'
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // merge with defaults to survive future updates
    return Object.assign(structuredClone(DEFAULT_STATE), parsed);
  }catch(e){ return structuredClone(DEFAULT_STATE); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
let cart = JSON.parse(localStorage.getItem('sweethome_cart')||'[]');
let activeCategory = 'الكل';
let searchTerm = '';
let adminAuthed = false;
let adminTab = 'products';

/* ---------------- helpers ---------------- */
function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function money(n){ return Number(n).toLocaleString('ar-EG') + ' ج.م'; }
function saveCart(){ localStorage.setItem('sweethome_cart', JSON.stringify(cart)); }
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function normalizeEgyptPhone(phone){
  let p = (phone||'').replace(/\D/g,'');
  if(p.startsWith('20')) return p;
  if(p.startsWith('0')) return '2'+p;
  return '20'+p;
}

/* ---------------- theming ---------------- */
function applyTheme(){
  const s = state.settings;
  document.documentElement.style.setProperty('--primary', s.primary);
  document.documentElement.style.setProperty('--accent', s.accent);
  document.documentElement.style.setProperty('--bg', s.bg);
  document.documentElement.style.setProperty('--ink', s.ink);
  const fonts = {
    lalezar:"'Lalezar', cursive",
    aref:"'Aref Ruqaa', serif",
    cairo:"'Cairo', sans-serif"
  };
  document.documentElement.style.setProperty('--font-display', fonts[s.font] || fonts.lalezar);
  document.getElementById('headerLogo').src = s.logo || 'logo.png';
  document.getElementById('headerName').textContent = s.storeName;
  document.getElementById('headerTag').textContent = s.tagline;
  document.getElementById('heroName').textContent = s.storeName;
  document.getElementById('heroTag').textContent = s.tagline + ' ♡';
  const splashLogo = document.getElementById('splashLogo');
  const splashName = document.getElementById('splashName');
  if(splashLogo) splashLogo.src = s.logo || 'logo.png';
  if(splashName) splashName.textContent = s.storeName;
  document.title = s.storeName + ' | بيت الحلويات';
  const meta = document.querySelector('meta[name=theme-color]');
  if(meta) meta.setAttribute('content', s.primary);
}

/* ---------------- categories ---------------- */
function renderCats(){
  const row = document.getElementById('catsRow');
  const cats = ['الكل', ...state.categories];
  row.innerHTML = cats.map(c=>`<button class="cat-pill ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`).join('');
  row.querySelectorAll('.cat-pill').forEach(btn=>{
    btn.onclick = ()=>{ activeCategory = btn.dataset.cat; renderCats(); renderProducts(); scrollToProducts(); };
  });
  renderQuickCats();
}

function renderQuickCats(){
  const grid = document.getElementById('quickCatsGrid');
  if(!grid) return;
  grid.innerHTML = state.categories.map(c=>{
    const img = state.categoryImages && state.categoryImages[c];
    const visual = img ? `<img src="${img}" alt="${c}">` : `<span class="qc-emoji">${CATEGORY_EMOJI[c] || '🍬'}</span>`;
    return `
    <button class="quick-cat" data-qcat="${c}">
      <div class="qc-icon">${visual}</div>
      <div class="qc-label">${c}</div>
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-qcat]').forEach(btn=>{
    btn.onclick = ()=>{ activeCategory = btn.dataset.qcat; renderCats(); renderProducts(); scrollToProducts(); };
  });
}

function scrollToProducts(){
  document.getElementById('productsGrid').scrollIntoView({behavior:'smooth', block:'start'});
}
function scrollToCats(){
  document.getElementById('catsRow').scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------------- products ---------------- */
function getCartQty(id){ const it = cart.find(c=>c.id===id); return it? it.qty : 0; }
function setCartQty(id, qty){
  const p = state.products.find(p=>p.id===id);
  if(!p) return;
  let item = cart.find(c=>c.id===id);
  if(qty<=0){ cart = cart.filter(c=>c.id!==id); }
  else if(item){ item.qty = qty; }
  else { cart.push({id, qty}); }
  saveCart(); renderCartBadge(); renderProducts();
}
function renderProducts(){
  const grid = document.getElementById('productsGrid');
  let list = state.products.filter(p=>{
    const matchCat = activeCategory==='الكل' || p.category===activeCategory;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });
  if(list.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">لا توجد منتجات في هذا القسم حالياً 🍽️</div>`;
    return;
  }
  grid.innerHTML = list.map(p=>{
    const qty = getCartQty(p.id);
    const imgHtml = p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji;
    return `
    <div class="card" data-id="${p.id}">
      <div class="card-img" data-open="${p.id}">${imgHtml}</div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc||''}</div>
        <div>
          <span class="card-price">${money(p.price)}</span>
          ${p.oldPrice>0?`<span class="card-old-price">${money(p.oldPrice)}</span>`:''}
        </div>
        <div class="card-foot">
          ${qty>0 ? `
            <div class="stepper">
              <button data-dec="${p.id}">−</button>
              <span>${qty}</span>
              <button data-inc="${p.id}">+</button>
            </div>
          ` : `<button class="add-btn" data-add="${p.id}">أضف للسلة +</button>`}
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{ setCartQty(b.dataset.add, 1); toast('تمت الإضافة للسلة 🛍️'); });
  grid.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>setCartQty(b.dataset.inc, getCartQty(b.dataset.inc)+1));
  grid.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>setCartQty(b.dataset.dec, getCartQty(b.dataset.dec)-1));
  grid.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openProduct(el.dataset.open));
}

function openProduct(id){
  const p = state.products.find(p=>p.id===id);
  if(!p) return;
  const imgHtml = p.image ? `<img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:14px;">` : `<div style="font-size:70px;text-align:center;padding:20px 0;">${p.emoji}</div>`;
  document.getElementById('productSheet').innerHTML = `
    <div class="sheet-head"><h2>${p.name}</h2><button class="close-x" id="closeProduct">✕</button></div>
    ${imgHtml}
    <p style="font-size:13.5px;color:#6a5a4c;line-height:1.7;margin:12px 0;">${p.desc||''}</p>
    <div style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:10px;">${money(p.price)} ${p.oldPrice>0?`<span class="card-old-price">${money(p.oldPrice)}</span>`:''}</div>
    <button class="primary-btn" id="addFromDetail">أضف للسلة</button>
  `;
  document.getElementById('productOverlay').classList.add('show');
  document.getElementById('closeProduct').onclick = ()=>document.getElementById('productOverlay').classList.remove('show');
  document.getElementById('addFromDetail').onclick = ()=>{
    setCartQty(p.id, getCartQty(p.id)+1);
    toast('تمت الإضافة للسلة 🛍️');
    document.getElementById('productOverlay').classList.remove('show');
  };
}
document.getElementById('productOverlay').addEventListener('click', e=>{
  if(e.target.id==='productOverlay') e.target.classList.remove('show');
});

/* ---------------- cart badge / fab ---------------- */
function renderCartBadge(){
  const count = cart.reduce((s,c)=>s+c.qty,0);
  const total = cart.reduce((s,c)=>{
    const p = state.products.find(p=>p.id===c.id);
    return s + (p? p.price*c.qty : 0);
  },0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  badge.style.display = count>0 ? 'flex':'none';
  const fab = document.getElementById('cartFab');
  fab.classList.toggle('show', count>0);
  document.getElementById('cartFabCount').textContent = count + (count===1?' منتج':' عناصر');
  document.getElementById('cartFabTotal').textContent = money(total);
  const navBadge = document.getElementById('navCartBadge');
  if(navBadge){ navBadge.textContent = count; navBadge.style.display = count>0 ? 'flex':'none'; }
}

/* ---------------- cart sheet / checkout ---------------- */
let checkoutStep = 'cart'; // cart | form
function openCart(){ checkoutStep='cart'; renderCartSheet(); document.getElementById('cartOverlay').classList.add('show'); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('show'); }
document.getElementById('cartOpenBtn').onclick = openCart;
document.getElementById('cartFab').onclick = openCart;
document.getElementById('cartOverlay').addEventListener('click', e=>{ if(e.target.id==='cartOverlay') closeCart(); });

function cartTotal(){
  return cart.reduce((s,c)=>{ const p = state.products.find(p=>p.id===c.id); return s + (p? p.price*c.qty : 0); },0);
}

function renderCartSheet(){
  const sheet = document.getElementById('cartSheet');
  if(checkoutStep==='cart'){
    if(cart.length===0){
      sheet.innerHTML = `
        <div class="sheet-head"><h2>سلة الطلبات</h2><button class="close-x" id="closeCartX">✕</button></div>
        <div class="empty-state">السلة فارغة حالياً 🧺<br>أضف بعض الحلويات اللذيذة!</div>`;
      document.getElementById('closeCartX').onclick = closeCart;
      return;
    }
    const itemsHtml = cart.map(c=>{
      const p = state.products.find(p=>p.id===c.id);
      if(!p) return '';
      const imgHtml = p.image ? `<img src="${p.image}">` : p.emoji;
      return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="name">${p.name}</div>
          <div class="price">${money(p.price)} × ${c.qty} = ${money(p.price*c.qty)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="stepper">
            <button data-dec="${p.id}">−</button><span>${c.qty}</span><button data-inc="${p.id}">+</button>
          </div>
        </div>
      </div>`;
    }).join('');
    sheet.innerHTML = `
      <div class="sheet-head"><h2>سلة الطلبات</h2><button class="close-x" id="closeCartX">✕</button></div>
      ${itemsHtml}
      <div class="summary-row total"><span>الإجمالي</span><span>${money(cartTotal())}</span></div>
      <button class="primary-btn" id="goCheckout">متابعة الطلب ←</button>
    `;
    document.getElementById('closeCartX').onclick = closeCart;
    sheet.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>{ setCartQty(b.dataset.inc, getCartQty(b.dataset.inc)+1); renderCartSheet(); });
    sheet.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{ setCartQty(b.dataset.dec, getCartQty(b.dataset.dec)-1); renderCartSheet(); });
    document.getElementById('goCheckout').onclick = ()=>{ checkoutStep='form'; renderCartSheet(); };
  } else {
    const branchOptions = state.branches.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
    sheet.innerHTML = `
      <div class="sheet-head"><h2>بيانات الطلب</h2><button class="close-x" id="closeCartX">✕</button></div>
      <div class="field"><label>الاسم</label><input type="text" id="custName" placeholder="اكتب اسمك" value="${getProfile()?getProfile().name:''}"></div>
      <div class="field"><label>رقم الموبايل</label><input type="tel" id="custPhone" placeholder="01xxxxxxxxx" value="${getProfile()?getProfile().phone:''}"></div>
      <div class="field">
        <label>طريقة الاستلام</label>
        <div class="radio-group">
          <label class="radio-opt"><input type="radio" name="delivery" value="pickup" checked> استلام من الفرع</label>
          <label class="radio-opt"><input type="radio" name="delivery" value="delivery"> توصيل للمنزل</label>
        </div>
      </div>
      <div class="field" id="addressField" style="display:none;">
        <label>العنوان بالتفصيل (داخل المنصورة)</label>
        <textarea id="custAddress" placeholder="اسم الحي في المنصورة، الشارع، أقرب علامة مميزة"></textarea>
      </div>
      <div class="field">
        <label>الفرع الأقرب</label>
        <select id="branchSelect">${branchOptions}</select>
        <div class="pay-info" id="nearestHint" style="display:none;"></div>
      </div>
      <div class="field">
        <label>طريقة الدفع</label>
        <div class="radio-group">
          <label class="radio-opt"><input type="radio" name="pay" value="vodafone" checked> فودافون كاش</label>
          <label class="radio-opt"><input type="radio" name="pay" value="instapay"> انستاباي</label>
          ${state.payment.codEnabled ? `<label class="radio-opt"><input type="radio" name="pay" value="cod"> الدفع عند الاستلام</label>` : ''}
        </div>
        <div class="pay-info" id="payInfo"></div>
      </div>
      <div class="field"><label>ملاحظات إضافية (اختياري)</label><textarea id="custNotes" placeholder="مثال: بدون مكسرات، ميعاد التسليم..."></textarea></div>
      <button class="primary-btn" id="sendOrder">إرسال الطلب عبر واتساب 🟢</button>
      <button class="secondary-btn" id="backToCart">◄ رجوع للسلة</button>
    `;
    document.getElementById('closeCartX').onclick = closeCart;
    document.getElementById('backToCart').onclick = ()=>{ checkoutStep='cart'; renderCartSheet(); };
    const addressField = document.getElementById('addressField');
    const branchSelect = document.getElementById('branchSelect');
    const nearestHint = document.getElementById('nearestHint');

    function guessNearestBranch(text){
      const clean = (text||'').trim();
      if(!clean) return null;
      let best = null;
      state.branches.forEach(b=>{
        const keyword = b.name.replace('فرع','').trim();
        if(keyword && clean.includes(keyword)) best = b;
      });
      return best;
    }
    document.getElementById('custAddress').addEventListener('input', (e)=>{
      const match = guessNearestBranch(e.target.value);
      if(match){
        branchSelect.value = match.id;
        nearestHint.style.display = 'block';
        nearestHint.innerHTML = `✅ تم اختيار <b>${match.name}</b> تلقائياً كأقرب فرع لعنوانك، وهيتبعتله الطلب مباشرة على واتساب. تقدر تغيّره يدوي من القائمة لو حبيت.`;
      } else {
        nearestHint.style.display = 'block';
        nearestHint.innerHTML = `اكتب اسم الحي عشان نختارلك أقرب فرع تلقائياً، أو اختار الفرع يدوي من القائمة.`;
      }
    });
    sheet.querySelectorAll('input[name=delivery]').forEach(r=>r.onchange = ()=>{
      addressField.style.display = document.querySelector('input[name=delivery]:checked').value==='delivery' ? 'block':'none';
    });
    function updatePayInfo(){
      const val = document.querySelector('input[name=pay]:checked').value;
      const info = document.getElementById('payInfo');
      if(val==='vodafone') info.innerHTML = `حوّل قيمة الطلب على رقم فودافون كاش: <b>${state.payment.vodafoneCash}</b> ثم أرسل صورة إثبات التحويل في رسالة الواتساب.`;
      else if(val==='instapay') info.innerHTML = `حوّل قيمة الطلب عبر انستاباي على: <b>${state.payment.instapay}</b> ثم أرسل صورة إثبات التحويل في رسالة الواتساب.`;
      else info.innerHTML = `سيتم الدفع نقداً عند استلام الطلب.`;
    }
    sheet.querySelectorAll('input[name=pay]').forEach(r=>r.onchange = updatePayInfo);
    updatePayInfo();

    document.getElementById('sendOrder').onclick = ()=>{
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const deliveryType = document.querySelector('input[name=delivery]:checked').value;
      const address = document.getElementById('custAddress').value.trim();
      const branchId = document.getElementById('branchSelect').value;
      const payType = document.querySelector('input[name=pay]:checked').value;
      const notes = document.getElementById('custNotes').value.trim();
      const branch = state.branches.find(b=>b.id==branchId);

      if(!name || !phone){ toast('من فضلك اكتب الاسم ورقم الموبايل'); return; }
      if(deliveryType==='delivery' && !address){ toast('من فضلك اكتب عنوان التوصيل'); return; }
      if(cart.length===0){ toast('السلة فارغة'); return; }

      const payLabel = payType==='vodafone' ? 'فودافون كاش' : payType==='instapay' ? 'انستاباي' : 'الدفع عند الاستلام';
      const deliveryLabel = deliveryType==='delivery' ? 'توصيل للمنزل' : 'استلام من الفرع';

      let msg = `مرحباً *${state.settings.storeName}* 🍰\nأريد تقديم طلب جديد:\n\n`;
      cart.forEach(c=>{
        const p = state.products.find(p=>p.id===c.id);
        if(p) msg += `• ${p.name} × ${c.qty} = ${money(p.price*c.qty)}\n`;
      });
      msg += `\n*الإجمالي: ${money(cartTotal())}*\n\n`;
      msg += `👤 الاسم: ${name}\n📱 الموبايل: ${phone}\n`;
      msg += `🏠 طريقة الاستلام: ${deliveryLabel}\n`;
      if(deliveryType==='delivery') msg += `📍 العنوان: ${address}\n`;
      msg += `🏪 الفرع: ${branch? branch.name : ''}\n`;
      msg += `💳 الدفع: ${payLabel}\n`;
      if(notes) msg += `📝 ملاحظات: ${notes}\n`;

      const order = { id: uid('ord_'), date: new Date().toISOString(), name, phone, deliveryType, address, branch: branch?branch.name:'', pay: payLabel, notes, items: cart.map(c=>({...c, name: state.products.find(p=>p.id===c.id)?.name})), total: cartTotal() };
      state.orders.unshift(order);
      saveState();

      const waNumber = normalizeEgyptPhone(branch ? branch.phone : state.payment.vodafoneCash);
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      cart = []; saveCart(); renderCartBadge(); renderProducts();
      closeCart();
      toast('تم إرسال طلبك عبر واتساب ✅');
    };
  }
}

/* ---------------- search ---------------- */
document.getElementById('searchInput').addEventListener('input', e=>{
  searchTerm = e.target.value;
  renderProducts();
});

function openAdmin(){
  adminAuthed = false;
  document.getElementById('adminScreen').classList.add('show');
  renderAdmin();
}
document.getElementById('adminCloseBtn').onclick = ()=>{
  document.getElementById('adminScreen').classList.remove('show');
};

/* =========================================================
   MENU (STORE INFO) + ACCOUNT PROFILE + BOTTOM NAV
   ========================================================= */
function openMenu(){
  document.getElementById('menuSheet').innerHTML = `
    <div class="sheet-head"><h2>${state.settings.storeName}</h2><button class="close-x" id="closeMenuX">✕</button></div>
    <div class="admin-card">
      <h3>من نحن</h3>
      <p style="font-size:13px;color:#6a5a4c;line-height:1.8;">${state.settings.storeName} — ${state.settings.tagline}. نقدملكم أجمل الحلويات الشرقية والغربية بأعلى جودة، مع خدمة توصيل لجميع مناطق وأحياء المنصورة.</p>
    </div>
    <div class="admin-card">
      <h3>تواصل معنا</h3>
      ${state.branches.map(b=>`<div class="admin-list-item"><div class="ph">📍</div><div class="meta"><b>${b.name}</b>${b.phone}</div></div>`).join('')}
    </div>
    <button class="secondary-btn" id="openAdminFromMenu">⚙️ لوحة الإدارة</button>
  `;
  document.getElementById('closeMenuX').onclick = closeMenu;
  document.getElementById('openAdminFromMenu').onclick = ()=>{ closeMenu(); openAdmin(); };
  document.getElementById('menuOverlay').classList.add('show');
}
function closeMenu(){ document.getElementById('menuOverlay').classList.remove('show'); }
document.getElementById('menuOverlay').addEventListener('click', e=>{ if(e.target.id==='menuOverlay') closeMenu(); });
document.getElementById('menuOpenBtn').onclick = openMenu;

/* ---------------- local profile (no password, per device) ---------------- */
function getProfile(){
  try{ return JSON.parse(localStorage.getItem('sweethome_profile')||'null'); }catch(e){ return null; }
}
function saveProfile(p){ localStorage.setItem('sweethome_profile', JSON.stringify(p)); }
function clearProfile(){ localStorage.removeItem('sweethome_profile'); }

function openAccount(){
  const profile = getProfile();
  const sheet = document.getElementById('menuSheet');
  if(profile){
    sheet.innerHTML = `
      <div class="sheet-head"><h2>حسابي</h2><button class="close-x" id="closeMenuX">✕</button></div>
      <div class="admin-card">
        <h3>👋 أهلاً بيك يا ${profile.name}</h3>
        <p style="font-size:12.5px;color:#6a5a4c;line-height:1.8;">📧 ${profile.email||'—'}<br>📱 ${profile.phone}</p>
        <p class="note" style="margin-top:8px;">بياناتك محفوظة على جهازك ده بس، وهتتعبى تلقائياً في أي طلب جديد.</p>
      </div>
      <button class="secondary-btn" id="editProfileBtn">تعديل البيانات</button>
      <button class="secondary-btn" id="logoutProfileBtn" style="color:#a83030;">تسجيل خروج من هذا الجهاز</button>
    `;
    document.getElementById('editProfileBtn').onclick = ()=>renderProfileForm(profile);
    document.getElementById('logoutProfileBtn').onclick = ()=>{ clearProfile(); toast('تم تسجيل الخروج'); openAccount(); };
  } else {
    renderProfileForm(null);
  }
  document.getElementById('closeMenuX') && (document.getElementById('closeMenuX').onclick = closeMenu);
  document.getElementById('menuOverlay').classList.add('show');
}
function renderProfileForm(existing){
  const sheet = document.getElementById('menuSheet');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>${existing?'تعديل بياناتي':'إنشاء حسابي'}</h2><button class="close-x" id="closeMenuX">✕</button></div>
    <p style="font-size:12.5px;color:#6a5a4c;margin-bottom:10px;">سجّل بياناتك مرة واحدة، وهتتعبى تلقائياً في كل طلب جديد — من غير باسورد.</p>
    <div class="field"><label>الاسم</label><input type="text" id="prof_name" value="${existing?existing.name:''}"></div>
    <div class="field"><label>البريد الإلكتروني (اختياري)</label><input type="email" id="prof_email" value="${existing?existing.email||'':''}"></div>
    <div class="field"><label>رقم الموبايل</label><input type="tel" id="prof_phone" value="${existing?existing.phone:''}"></div>
    <button class="primary-btn" id="saveProfileBtn">حفظ</button>
  `;
  document.getElementById('closeMenuX').onclick = closeMenu;
  document.getElementById('saveProfileBtn').onclick = ()=>{
    const name = document.getElementById('prof_name').value.trim();
    const email = document.getElementById('prof_email').value.trim();
    const phone = document.getElementById('prof_phone').value.trim();
    if(!name || !phone){ toast('اكتب الاسم ورقم الموبايل على الأقل'); return; }
    saveProfile({name, email, phone});
    toast('تم حفظ بياناتك');
    openAccount();
  };
}
document.getElementById('navAccount').onclick = openAccount;

document.getElementById('navHome').onclick = ()=>{ window.scrollTo({top:0, behavior:'smooth'}); };
document.getElementById('navCats').onclick = ()=>{ scrollToCats(); };
document.getElementById('navCart').onclick = openCart;

/* =========================================================
   WEDDING "SABAHEYA" BOOKING
   ========================================================= */
function openBooking(){
  renderBookingSheet();
  document.getElementById('bookingOverlay').classList.add('show');
}
function closeBooking(){ document.getElementById('bookingOverlay').classList.remove('show'); }
document.getElementById('openBookingBtn').onclick = openBooking;
document.getElementById('bookingOverlay').addEventListener('click', e=>{ if(e.target.id==='bookingOverlay') closeBooking(); });

function renderBookingSheet(){
  const profile = getProfile();
  const branchOptions = state.branches.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
  const sheet = document.getElementById('bookingSheet');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>🎊 حجز صباحية العروسة</h2><button class="close-x" id="closeBookingX">✕</button></div>
    <p style="font-size:12.5px;color:#6a5a4c;margin-bottom:10px;line-height:1.7;">احجزلنا تفاصيل المناسبة، وهنتواصل معاك على واتساب لتأكيد الباقة والسعر.</p>
    <div class="field"><label>اسم العروسة / صاحب المناسبة</label><input type="text" id="bk_occasion" placeholder="مثال: صباحية فرح سارة"></div>
    <div class="field"><label>تاريخ المناسبة</label><input type="date" id="bk_date"></div>
    <div class="field"><label>عدد الأفراد أو الباقة المطلوبة</label><input type="text" id="bk_qty" placeholder="مثال: 30 فرد، أو باقة فاخرة"></div>
    <div class="field"><label>الفرع الأقرب</label><select id="bk_branch">${branchOptions}</select></div>
    <div class="field"><label>اسمك</label><input type="text" id="bk_name" value="${profile?profile.name:''}"></div>
    <div class="field"><label>رقم موبايلك</label><input type="tel" id="bk_phone" value="${profile?profile.phone:''}"></div>
    <div class="field"><label>تفاصيل إضافية (اختياري)</label><textarea id="bk_notes" placeholder="ألوان، أذواق معينة، أي طلبات خاصة"></textarea></div>
    <button class="primary-btn" id="sendBooking">إرسال طلب الحجز عبر واتساب 🟢</button>
  `;
  document.getElementById('closeBookingX').onclick = closeBooking;
  document.getElementById('sendBooking').onclick = ()=>{
    const occasion = document.getElementById('bk_occasion').value.trim();
    const date = document.getElementById('bk_date').value;
    const qty = document.getElementById('bk_qty').value.trim();
    const branchId = document.getElementById('bk_branch').value;
    const name = document.getElementById('bk_name').value.trim();
    const phone = document.getElementById('bk_phone').value.trim();
    const notes = document.getElementById('bk_notes').value.trim();
    const branch = state.branches.find(b=>b.id==branchId);

    if(!occasion || !name || !phone){ toast('اكتب اسم المناسبة والاسم ورقم الموبايل'); return; }

    let msg = `مرحباً *${state.settings.storeName}* 🎊\nأريد حجز صباحية عروسة:\n\n`;
    msg += `💐 المناسبة: ${occasion}\n`;
    if(date) msg += `📅 التاريخ: ${date}\n`;
    if(qty) msg += `👥 العدد/الباقة: ${qty}\n`;
    msg += `👤 الاسم: ${name}\n📱 الموبايل: ${phone}\n`;
    msg += `🏪 الفرع: ${branch? branch.name : ''}\n`;
    if(notes) msg += `📝 ملاحظات: ${notes}\n`;

    const waNumber = normalizeEgyptPhone(branch ? branch.phone : state.payment.vodafoneCash);
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    closeBooking();
    toast('تم إرسال طلب الحجز عبر واتساب ✅');
  };
}

/* =========================================================
   ADMIN PANEL
   ========================================================= */

function renderAdmin(){
  const content = document.getElementById('adminContent');
  if(!adminAuthed){
    content.innerHTML = `
      <div class="login-box">
        <img src="${state.settings.logo||'logo.png'}">
        <h3>دخول لوحة الإدارة</h3>
        <div class="field"><input type="password" id="adminPass" placeholder="كلمة المرور"></div>
        <button class="primary-btn" id="adminLoginBtn">دخول</button>
        <p style="font-size:11px;color:#8a7057;margin-top:14px;">كلمة المرور الافتراضية: admin123 — غيّرها فوراً من تبويب الإعدادات بعد الدخول.</p>
      </div>`;
    document.getElementById('adminLoginBtn').onclick = ()=>{
      const val = document.getElementById('adminPass').value;
      if(val === state.adminPassword){ adminAuthed = true; adminTab='products'; renderAdmin(); }
      else toast('كلمة المرور غير صحيحة');
    };
    return;
  }

  const tabs = [
    ['products','المنتجات'],['branches','الفروع'],['appearance','المظهر'],
    ['payment','الدفع'],['orders','الطلبات'],['settings','الإعدادات']
  ];
  content.innerHTML = `
    <div class="admin-tabs">${tabs.map(([k,l])=>`<button class="admin-tab ${adminTab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="admin-body" id="adminBody"></div>
  `;
  content.querySelectorAll('.admin-tab').forEach(b=>b.onclick=()=>{ adminTab=b.dataset.tab; renderAdmin(); });

  const body = document.getElementById('adminBody');
  if(adminTab==='products') renderAdminProducts(body);
  if(adminTab==='branches') renderAdminBranches(body);
  if(adminTab==='appearance') renderAdminAppearance(body);
  if(adminTab==='payment') renderAdminPayment(body);
  if(adminTab==='orders') renderAdminOrders(body);
  if(adminTab==='settings') renderAdminSettings(body);
}

/* ---- products tab ---- */
function renderAdminProducts(body){
  body.innerHTML = `
    <div class="admin-card">
      <h3>➕ إضافة منتج جديد</h3>
      ${productFormHtml()}
      <button class="primary-btn" id="saveNewProduct">حفظ المنتج</button>
    </div>
    <div class="admin-card"><h3>قائمة المنتجات (${state.products.length})</h3><div id="prodList"></div></div>
  `;
  bindProductForm('', ()=>{ renderAdmin(); toast('تمت إضافة المنتج'); });
  const list = document.getElementById('prodList');
  list.innerHTML = state.products.map(p=>`
    <div class="admin-list-item">
      ${p.image?`<img src="${p.image}">`:`<div class="ph">${p.emoji}</div>`}
      <div class="meta"><b>${p.name}</b>${p.category} — ${money(p.price)}</div>
      <button class="small-btn edit" data-edit="${p.id}">تعديل</button>
      <button class="small-btn del" data-del="${p.id}">حذف</button>
    </div>`).join('');
  list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(confirm('هل تريد حذف هذا المنتج؟')){
      state.products = state.products.filter(p=>p.id!==b.dataset.del);
      saveState(); renderAdmin(); renderProducts(); toast('تم الحذف');
    }
  });
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditProduct(b.dataset.edit));
}

function productFormHtml(prefix=''){
  const cats = state.categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  return `
    <div class="field"><label>اسم المنتج</label><input type="text" id="${prefix}pf_name"></div>
    <div class="row2">
      <div class="field"><label>السعر</label><input type="number" id="${prefix}pf_price"></div>
      <div class="field"><label>السعر قبل الخصم (اختياري)</label><input type="number" id="${prefix}pf_oldprice"></div>
    </div>
    <div class="field"><label>القسم</label><select id="${prefix}pf_cat">${cats}</select></div>
    <div class="field"><label>الوصف</label><textarea id="${prefix}pf_desc"></textarea></div>
    <div class="field"><label>صورة المنتج (اختياري — إذا لم تُضف صورة سيظهر إيموجي)</label><input type="file" accept="image/*" id="${prefix}pf_img"></div>
    <div id="${prefix}pf_preview" style="margin-bottom:10px;"></div>
  `;
}

function readImageResized(file, maxW=480, quality=0.72){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, maxW/img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width*scale; canvas.height = img.height*scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindProductForm(prefix, onSave, existing){
  let tempImage = existing? existing.image : '';
  const imgInput = document.getElementById(prefix+'pf_img');
  const preview = document.getElementById(prefix+'pf_preview');
  if(existing && existing.image) preview.innerHTML = `<img src="${existing.image}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;">`;
  imgInput.onchange = async ()=>{
    if(imgInput.files[0]){
      tempImage = await readImageResized(imgInput.files[0]);
      preview.innerHTML = `<img src="${tempImage}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;">`;
    }
  };
  if(existing){
    document.getElementById(prefix+'pf_name').value = existing.name;
    document.getElementById(prefix+'pf_price').value = existing.price;
    document.getElementById(prefix+'pf_oldprice').value = existing.oldPrice||'';
    document.getElementById(prefix+'pf_cat').value = existing.category;
    document.getElementById(prefix+'pf_desc').value = existing.desc||'';
  }
  const saveBtnId = existing ? prefix+'saveEditProduct' : 'saveNewProduct';
  document.getElementById(saveBtnId).onclick = ()=>{
    const name = document.getElementById(prefix+'pf_name').value.trim();
    const price = parseFloat(document.getElementById(prefix+'pf_price').value)||0;
    const oldPrice = parseFloat(document.getElementById(prefix+'pf_oldprice').value)||0;
    const category = document.getElementById(prefix+'pf_cat').value;
    const desc = document.getElementById(prefix+'pf_desc').value.trim();
    if(!name || !price){ toast('اكتب اسم المنتج والسعر'); return; }
    if(existing){
      Object.assign(existing, {name, price, oldPrice, category, desc, image: tempImage});
    } else {
      state.products.push({id:uid('p_'), name, price, oldPrice, category, desc, emoji:'🍬', image:tempImage});
    }
    saveState(); renderProducts(); onSave();
  };
}

function openEditProduct(id){
  const p = state.products.find(p=>p.id===id);
  if(!p) return;
  document.getElementById('productSheet').innerHTML = `
    <div class="sheet-head"><h2>تعديل المنتج</h2><button class="close-x" id="closeEditProduct">✕</button></div>
    ${productFormHtml('e_')}
    <button class="primary-btn" id="e_saveEditProduct">حفظ التعديلات</button>
  `;
  document.getElementById('productOverlay').classList.add('show');
  document.getElementById('closeEditProduct').onclick = ()=>document.getElementById('productOverlay').classList.remove('show');
  bindProductForm('e_', ()=>{
    document.getElementById('productOverlay').classList.remove('show');
    renderAdmin(); toast('تم حفظ التعديلات');
  }, p);
}

/* ---- branches tab ---- */
function renderAdminBranches(body){
  body.innerHTML = `
    <div class="admin-card">
      <h3>➕ إضافة فرع</h3>
      <div class="field"><label>اسم الفرع</label><input type="text" id="br_name"></div>
      <div class="field"><label>رقم الواتساب (بصيغة محلية: 01xxxxxxxxx)</label><input type="text" id="br_phone"></div>
      <button class="primary-btn" id="addBranch">حفظ الفرع</button>
    </div>
    <div class="admin-card"><h3>الفروع الحالية</h3><div id="branchList"></div></div>
  `;
  document.getElementById('addBranch').onclick = ()=>{
    const name = document.getElementById('br_name').value.trim();
    const phone = document.getElementById('br_phone').value.trim();
    if(!name||!phone){ toast('اكتب اسم الفرع والرقم'); return; }
    state.branches.push({id:Date.now(), name, phone});
    saveState(); renderAdmin(); toast('تمت إضافة الفرع');
  };
  const list = document.getElementById('branchList');
  list.innerHTML = state.branches.map(b=>`
    <div class="admin-list-item">
      <div class="ph">🏪</div>
      <div class="meta"><b>${b.name}</b>${b.phone}</div>
      <button class="small-btn del" data-del="${b.id}">حذف</button>
    </div>`).join('');
  list.querySelectorAll('[data-del]').forEach(btn=>btn.onclick=()=>{
    if(state.branches.length<=1){ toast('لازم يبقى فرع واحد على الأقل'); return; }
    if(confirm('حذف هذا الفرع؟')){
      state.branches = state.branches.filter(b=>b.id!=btn.dataset.del);
      saveState(); renderAdmin(); toast('تم الحذف');
    }
  });
}

/* ---- appearance tab ---- */
function renderAdminAppearance(body){
  const s = state.settings;
  body.innerHTML = `
    <div class="admin-card">
      <h3>هوية المتجر</h3>
      <div class="field"><label>اسم المتجر</label><input type="text" id="ap_name" value="${s.storeName}"></div>
      <div class="field"><label>الشعار النصي (تحت الاسم)</label><input type="text" id="ap_tag" value="${s.tagline}"></div>
      <div class="field"><label>تغيير اللوجو</label><input type="file" accept="image/*" id="ap_logo"></div>
      <div id="ap_logo_preview" style="margin-bottom:10px;"><img src="${s.logo}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;"></div>
    </div>
    <div class="admin-card">
      <h3>الألوان</h3>
      <div class="field"><label>اللون الأساسي (الأحمر)</label><div class="swatch-row"><input type="color" id="ap_primary" value="${s.primary}"></div></div>
      <div class="field"><label>لون التمييز (الذهبي)</label><div class="swatch-row"><input type="color" id="ap_accent" value="${s.accent}"></div></div>
      <div class="field"><label>لون الخلفية</label><div class="swatch-row"><input type="color" id="ap_bg" value="${s.bg}"></div></div>
      <div class="field"><label>لون النصوص</label><div class="swatch-row"><input type="color" id="ap_ink" value="${s.ink}"></div></div>
    </div>
    <div class="admin-card">
      <h3>الخط</h3>
      <div class="field"><label>خط العناوين</label>
        <select id="ap_font">
          <option value="lalezar" ${s.font==='lalezar'?'selected':''}>لاليزار (مرح وبارز)</option>
          <option value="cairo" ${s.font==='cairo'?'selected':''}>القاهرة (بسيط وواضح)</option>
        </select>
      </div>
    </div>
    <button class="primary-btn" id="saveAppearance">حفظ المظهر</button>
  `;
  let tempLogo = s.logo;
  document.getElementById('ap_logo').onchange = async ()=>{
    const f = document.getElementById('ap_logo').files[0];
    if(f){ tempLogo = await readImageResized(f, 300, 0.85); document.getElementById('ap_logo_preview').innerHTML = `<img src="${tempLogo}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`; }
  };
  document.getElementById('saveAppearance').onclick = ()=>{
    s.storeName = document.getElementById('ap_name').value.trim() || s.storeName;
    s.tagline = document.getElementById('ap_tag').value.trim() || s.tagline;
    s.logo = tempLogo;
    s.primary = document.getElementById('ap_primary').value;
    s.accent = document.getElementById('ap_accent').value;
    s.bg = document.getElementById('ap_bg').value;
    s.ink = document.getElementById('ap_ink').value;
    s.font = document.getElementById('ap_font').value;
    saveState(); applyTheme(); toast('تم حفظ المظهر');
  };
}

/* ---- payment tab ---- */
function renderAdminPayment(body){
  const pay = state.payment;
  body.innerHTML = `
    <div class="admin-card">
      <h3>وسائل الدفع</h3>
      <div class="field"><label>رقم فودافون كاش</label><input type="text" id="pay_vf" value="${pay.vodafoneCash}"></div>
      <div class="field"><label>رقم / معرف انستاباي</label><input type="text" id="pay_ip" value="${pay.instapay}"></div>
      <label class="radio-opt" style="width:fit-content;"><input type="checkbox" id="pay_cod" ${pay.codEnabled?'checked':''}> تفعيل الدفع عند الاستلام</label>
    </div>
    <button class="primary-btn" id="savePayment">حفظ إعدادات الدفع</button>
  `;
  document.getElementById('savePayment').onclick = ()=>{
    pay.vodafoneCash = document.getElementById('pay_vf').value.trim();
    pay.instapay = document.getElementById('pay_ip').value.trim();
    pay.codEnabled = document.getElementById('pay_cod').checked;
    saveState(); toast('تم حفظ وسائل الدفع');
  };
}

/* ---- orders tab ---- */
function renderAdminOrders(body){
  if(state.orders.length===0){
    body.innerHTML = `<div class="note">لا توجد طلبات مسجلة على هذا الجهاز بعد. كل طلب يرسله الزبون عبر واتساب يُسجَّل هنا تلقائياً كأرشيف محلي.</div>`;
    return;
  }
  body.innerHTML = `
    <div class="note" style="margin-bottom:10px;">هذا الأرشيف محفوظ على هذا الجهاز فقط، وهو سجل مساعد بجانب رسائل واتساب الفعلية.</div>
    <button class="secondary-btn" id="clearOrders" style="margin-bottom:12px;">حذف كل الطلبات المؤرشفة</button>
    <div id="ordersList"></div>
  `;
  document.getElementById('ordersList').innerHTML = state.orders.map(o=>`
    <div class="order-card">
      <div class="top-row"><span>${o.name} — ${o.phone}</span><span>${money(o.total)}</span></div>
      <div>${new Date(o.date).toLocaleString('ar-EG')}</div>
      <div>${o.items.map(i=>i.name+' ×'+i.qty).join('، ')}</div>
      <div>الفرع: ${o.branch} | الدفع: ${o.pay}</div>
    </div>`).join('');
  document.getElementById('clearOrders').onclick = ()=>{
    if(confirm('حذف كل الطلبات المؤرشفة؟')){ state.orders=[]; saveState(); renderAdmin(); }
  };
}

/* ---- settings tab ---- */
function renderAdminSettings(body){
  body.innerHTML = `
    <div class="admin-card">
      <h3>الأقسام (الكاتيجوري)</h3>
      <p style="font-size:11.5px;color:#7a6a5c;margin-bottom:8px;">اكتب اسم صح لو فيه غلط إملائي، وارفع صورة تعبر عن القسم (اختياري)، ثم دوس "حفظ" لكل قسم.</p>
      <div id="catAdminList"></div>
      <div class="row2">
        <div class="field"><input type="text" id="newCatInput" placeholder="اسم قسم جديد"></div>
        <button class="small-btn edit" id="addCatBtn" style="height:44px;">إضافة</button>
      </div>
    </div>
    <div class="admin-card">
      <h3>كلمة مرور الإدارة</h3>
      <div class="field"><label>كلمة مرور جديدة</label><input type="password" id="newPassInput" placeholder="اتركه فارغاً لعدم التغيير"></div>
      <button class="primary-btn" id="savePass">تحديث كلمة المرور</button>
    </div>
    <div class="admin-card">
      <h3>🚀 نشر التحديثات لكل العملاء</h3>
      <p style="font-size:12px;color:#7a6a5c;line-height:1.8;">أي تعديل بتعمله هنا (منتجات، أسعار، صور) بيتخزن على جهازك بس. عشان يظهر عند كل العملاء، دوس الزرار ده وارفع الملف اللي هينزل باسم <b>data.json</b> على نفس مستودع GitHub بتاعك (بيستبدل القديم لو موجود). بعد الرفع والـ Commit، كل حد يفتح التطبيق (حتى لو نسخته مثبتة كـ APK) هيشوف التحديث الجديد.</p>
      <button class="primary-btn" id="publishData">تحميل ملف التحديث (data.json) 🚀</button>
    </div>
    <div class="admin-card">
      <h3>نسخة احتياطية</h3>
      <p style="font-size:12px;color:#7a6a5c;">صدّر بياناتك (منتجات، فروع، إعدادات) كملف، واستورده لاحقاً على نفس الجهاز أو جهاز آخر.</p>
      <button class="secondary-btn" id="exportData">تصدير نسخة احتياطية 📤</button>
      <div class="field" style="margin-top:10px;"><input type="file" accept=".json" id="importFile"></div>
      <button class="secondary-btn" id="importData">استيراد نسخة احتياطية 📥</button>
    </div>
    <div class="admin-card">
      <h3>إعادة الضبط</h3>
      <button class="secondary-btn" id="resetAll" style="color:#a83030;">إعادة كل البيانات للوضع الافتراضي</button>
    </div>
  `;
  const catList = document.getElementById('catAdminList');
  catList.innerHTML = state.categories.map((c,i)=>{
    const img = state.categoryImages && state.categoryImages[c];
    const thumb = img ? `<img src="${img}">` : `<div class="ph">${CATEGORY_EMOJI[c]||'🍬'}</div>`;
    return `
    <div class="admin-list-item" style="align-items:flex-start;flex-wrap:wrap;">
      ${thumb}
      <div class="meta" style="min-width:140px;">
        <input type="text" class="cat-rename" data-idx="${i}" value="${c}" style="width:100%;padding:6px 8px;border-radius:8px;border:1.5px solid var(--accent);background:var(--card);font-size:12.5px;margin-bottom:6px;">
        <input type="file" accept="image/*" class="cat-img-input" data-idx="${i}" style="font-size:11px;">
      </div>
      <button class="small-btn edit cat-save" data-idx="${i}">حفظ</button>
      <button class="small-btn del" data-delcat="${c}">حذف</button>
    </div>`;
  }).join('');
  const pendingCatImages = {};
  catList.querySelectorAll('.cat-img-input').forEach(inp=>{
    inp.onchange = async ()=>{
      if(inp.files[0]){ pendingCatImages[inp.dataset.idx] = await readImageResized(inp.files[0], 300, 0.8); }
    };
  });
  catList.querySelectorAll('.cat-save').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = btn.dataset.idx;
      const oldName = state.categories[idx];
      const newName = catList.querySelector(`.cat-rename[data-idx="${idx}"]`).value.trim();
      if(!newName) { toast('اكتب اسم القسم'); return; }
      if(newName !== oldName){
        state.categories[idx] = newName;
        state.products.forEach(p=>{ if(p.category===oldName) p.category = newName; });
        if(state.categoryImages && state.categoryImages[oldName]){
          state.categoryImages[newName] = state.categoryImages[oldName];
          delete state.categoryImages[oldName];
        }
        if(activeCategory===oldName) activeCategory = newName;
      }
      if(pendingCatImages[idx]){
        if(!state.categoryImages) state.categoryImages = {};
        state.categoryImages[newName] = pendingCatImages[idx];
      }
      saveState(); renderAdmin(); renderCats(); renderProducts();
      toast('تم حفظ القسم');
    };
  });
  catList.querySelectorAll('[data-delcat]').forEach(b=>b.onclick=()=>{
    const name = b.dataset.delcat;
    state.categories = state.categories.filter(c=>c!==name);
    if(state.categoryImages) delete state.categoryImages[name];
    saveState(); renderAdmin(); renderCats(); renderProducts();
  });
  document.getElementById('addCatBtn').onclick = ()=>{
    const v = document.getElementById('newCatInput').value.trim();
    if(v && !state.categories.includes(v)){ state.categories.push(v); saveState(); renderAdmin(); renderCats(); toast('تمت إضافة القسم'); }
  };
  document.getElementById('savePass').onclick = ()=>{
    const v = document.getElementById('newPassInput').value.trim();
    if(v){ state.adminPassword = v; saveState(); toast('تم تحديث كلمة المرور'); }
  };
  document.getElementById('publishData').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    toast('نزّل data.json وارفعه على GitHub عشان التحديثات تظهر للكل');
  };
  document.getElementById('exportData').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sweethome-backup-'+Date.now()+'.json';
    a.click();
  };
  document.getElementById('importData').onclick = ()=>{
    const f = document.getElementById('importFile').files[0];
    if(!f){ toast('اختر ملف النسخة الاحتياطية أولاً'); return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const parsed = JSON.parse(reader.result);
        state = Object.assign(structuredClone(DEFAULT_STATE), parsed);
        saveState(); applyTheme(); renderCats(); renderProducts(); renderAdmin();
        toast('تم استيراد البيانات بنجاح');
      }catch(e){ toast('ملف غير صالح'); }
    };
    reader.readAsText(f);
  };
  document.getElementById('resetAll').onclick = ()=>{
    if(confirm('سيتم حذف كل التعديلات والرجوع للوضع الافتراضي، متابعة؟')){
      state = structuredClone(DEFAULT_STATE);
      saveState(); applyTheme(); renderCats(); renderProducts(); renderAdmin();
      toast('تمت إعادة الضبط');
    }
  };
}

/* =========================================================
   INIT — تحميل بيانات مشتركة (data.json) لو موجودة على الموقع
   ========================================================= */
async function loadSharedDataThenRender(){
  const startTime = Date.now();
  try{
    const res = await fetch('data.json', {cache:'no-store'});
    if(res.ok){
      const remote = await res.json();
      if(remote && remote.products){
        state = Object.assign(structuredClone(DEFAULT_STATE), remote);
        saveState();
      }
    }
  }catch(e){ /* مفيش data.json لسه، أو مفيش إنترنت — هيشتغل بالبيانات المحفوظة محلياً */ }
  applyTheme();
  renderCats();
  renderProducts();
  renderCartBadge();
  const elapsed = Date.now() - startTime;
  const minSplashTime = 750; // أقل مدة لعرض شاشة الافتتاح عشان متلحظش
  setTimeout(()=>{
    const splash = document.getElementById('splashScreen');
    if(splash) splash.classList.add('hide');
  }, Math.max(0, minSplashTime - elapsed));
}
loadSharedDataThenRender();

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

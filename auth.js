/* =========================================================
   SWEET HOME — حسابات العملاء (إيميل + باسورد)
   Firebase Authentication + Firestore (users/{uid})
   بيتحمّل بعد السكريبت الرئيسي في index.html
   ========================================================= */
(function(){
'use strict';

const FB_BASE = 'https://www.gstatic.com/firebasejs/11.0.0/';
const PROFILE_KEY = 'sweethome_profile';

/* ---------- Firebase ---------- */
const fbReady = (async ()=>{
  const [appM, authM, fsM] = await Promise.all([
    import(FB_BASE+'firebase-app.js'),
    import(FB_BASE+'firebase-auth.js'),
    import(FB_BASE+'firebase-firestore.js')
  ]);
  const app = appM.initializeApp({
    apiKey: "AIzaSyAMxZ-Jyh-Al0ZdGspGNylQhxnQDhBo-VI",
    authDomain: "sweet-home-apk.firebaseapp.com",
    projectId: "sweet-home-apk",
    storageBucket: "sweet-home-apk.firebasestorage.app",
    messagingSenderId: "184004168911",
    appId: "1:184004168911:web:739ba9e08aa89e16b7fbba"
  });
  return { auth: authM.getAuth(app), db: fsM.getFirestore(app), A: authM, F: fsM };
})();

/* ---------- helpers ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function getProfile(){ try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null'); }catch(e){ return null; } }
function saveProfile(p){ localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
function clearProfile(){ localStorage.removeItem(PROFILE_KEY); }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authMsg(code){
  switch(code){
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'الإيميل أو كلمة المرور غير صحيحة';
    case 'auth/email-already-in-use': return 'الإيميل مستخدم بالفعل';
    case 'auth/weak-password': return 'كلمة المرور ضعيفة (6 أحرف على الأقل)';
    case 'auth/invalid-email': return 'الإيميل غير صحيح';
    case 'auth/too-many-requests': return 'محاولات كثيرة، حاول بعد قليل';
    case 'auth/network-request-failed': return 'تأكد من اتصال الإنترنت';
    case 'auth/requires-recent-login': return 'سجّل خروج وادخل تاني وبعدين جرّب';
    default: return 'حدث خطأ، حاول مرة أخرى';
  }
}

async function syncProfile(user){
  const fb = await fbReady;
  let d = {};
  try{
    const snap = await fb.F.getDoc(fb.F.doc(fb.db,'users',user.uid));
    if(snap.exists()) d = snap.data();
  }catch(e){}
  const p = { uid:user.uid, name:d.name||'', email:user.email||'', phone:d.phone||'' };
  saveProfile(p);
  return p;
}

/* حالة تسجيل الدخول تفضل متزامنة مع Firebase */
fbReady.then(fb=>{
  fb.A.onAuthStateChanged(fb.auth, async user=>{
    if(user){ await syncProfile(user); } else { clearProfile(); }
  });
}).catch(()=>{});

/* ---------- واجهة حسابي ---------- */
function showSheet(){ document.getElementById('menuOverlay').classList.add('show'); }

function openAccount(){
  const profile = getProfile();
  if(!profile){ renderAuthForm('login'); return; }
  const sheet = document.getElementById('menuSheet');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>حسابي</h2><button class="close-x" id="closeMenuX">✕</button></div>
    <div class="admin-card">
      <h3>أهلاً بيك يا ${esc(profile.name)||'عميلنا'} 👋</h3>
      <p style="font-size:13px;color:#6a5a4c;line-height:1.9;">📧 ${esc(profile.email)||'—'}<br>📱 ${esc(profile.phone)||'—'}</p>
    </div>
    <button class="secondary-btn" id="editProfileBtn">✏️ تعديل بياناتي</button>
    <button class="secondary-btn" id="logoutProfileBtn" style="color:#a83030;">تسجيل الخروج</button>
    <button class="secondary-btn" id="deleteAccountBtn" style="color:#a83030;">🗑️ حذف حسابي نهائياً</button>
    <a class="secondary-btn" href="privacy.html" style="display:block;text-align:center;text-decoration:none;font-size:12.5px;">🔒 سياسة الخصوصية</a>
  `;
  document.getElementById('closeMenuX').onclick = closeMenu;
  document.getElementById('editProfileBtn').onclick = renderProfileForm;
  document.getElementById('deleteAccountBtn').onclick = deleteMyAccount;
  document.getElementById('logoutProfileBtn').onclick = async ()=>{
    try{ const fb = await fbReady; await fb.A.signOut(fb.auth); }catch(e){}
    clearProfile();
    toast('تم تسجيل الخروج');
    renderAuthForm('login');
  };
  showSheet();
}

function renderProfileForm(){
  const p = getProfile() || {};
  const sheet = document.getElementById('menuSheet');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>تعديل بياناتي</h2><button class="close-x" id="closeMenuX">✕</button></div>
    <div class="field"><label>الاسم</label><input type="text" id="prof_name" value="${esc(p.name)}"></div>
    <div class="field"><label>رقم الموبايل</label><input type="tel" id="prof_phone" value="${esc(p.phone)}"></div>
    <p id="prof_err" style="color:#a83030;font-size:12.5px;min-height:18px;"></p>
    <button class="primary-btn" id="saveProfileBtn">حفظ</button>
    <button class="secondary-btn" id="cancelProfileBtn">رجوع</button>
  `;
  document.getElementById('closeMenuX').onclick = closeMenu;
  document.getElementById('cancelProfileBtn').onclick = openAccount;
  document.getElementById('saveProfileBtn').onclick = async ()=>{
    const name = document.getElementById('prof_name').value.trim();
    const phone = document.getElementById('prof_phone').value.trim();
    const err = document.getElementById('prof_err');
    if(!name){ err.textContent='اكتب اسمك'; return; }
    if(!phone){ err.textContent='اكتب رقم موبايلك'; return; }
    try{
      const fb = await fbReady; const u = fb.auth.currentUser;
      if(!u){ err.textContent='سجّل الدخول الأول'; return; }
      await fb.F.setDoc(fb.F.doc(fb.db,'users',u.uid), { name, phone, email:u.email }, { merge:true });
      saveProfile({ uid:u.uid, name, email:u.email, phone });
      toast('تم حفظ بياناتك');
      openAccount();
    }catch(e){ err.textContent = authMsg(e.code); }
  };
}

function renderAuthForm(mode){
  const isSignup = mode === 'signup';
  const sheet = document.getElementById('menuSheet');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>${isSignup?'إنشاء حساب جديد':'تسجيل الدخول'}</h2><button class="close-x" id="closeMenuX">✕</button></div>
    <p style="font-size:12.5px;color:#6a5a4c;margin-bottom:10px;">${isSignup?'اعمل حساب مرة واحدة، وبياناتك هتتحفظ وتتعبى تلقائياً في كل طلب.':'ادخل بإيميلك وكلمة المرور.'}</p>
    ${isSignup?`<div class="field"><label>الاسم</label><input type="text" id="auth_name"></div>
    <div class="field"><label>رقم الموبايل</label><input type="tel" id="auth_phone" placeholder="01xxxxxxxxx"></div>`:''}
    <div class="field"><label>البريد الإلكتروني</label><input type="email" id="auth_email" autocomplete="email" dir="ltr"></div>
    <div class="field"><label>كلمة المرور</label><input type="password" id="auth_pass" autocomplete="${isSignup?'new-password':'current-password'}" dir="ltr"></div>
    <p id="auth_err" style="color:#a83030;font-size:12.5px;min-height:18px;"></p>
    <p style="font-size:11.5px;color:#8A6E55;text-align:center;margin:4px 0 8px;">بالمتابعة أنت توافق على <a href="privacy.html" style="color:#B3122E;font-weight:700;">سياسة الخصوصية</a></p>
    <button class="primary-btn" id="authSubmitBtn">${isSignup?'إنشاء الحساب':'تسجيل الدخول'}</button>
    ${isSignup?'':'<button class="ghost-btn" id="forgotBtn" style="display:block;margin:10px auto 0;">نسيت كلمة المرور؟</button>'}
    <button class="secondary-btn" id="authSwitchBtn">${isSignup?'عندي حساب بالفعل':'ماعنديش حساب، إنشاء حساب جديد'}</button>
  `;
  document.getElementById('closeMenuX').onclick = closeMenu;
  document.getElementById('authSwitchBtn').onclick = ()=>renderAuthForm(isSignup?'login':'signup');
  const btn = document.getElementById('authSubmitBtn');
  const err = document.getElementById('auth_err');
  const forgot = document.getElementById('forgotBtn');
  if(forgot) forgot.onclick = async ()=>{
    err.textContent = '';
    const email = document.getElementById('auth_email').value.trim();
    if(!EMAIL_RE.test(email)){ err.textContent='اكتب إيميلك الأول وبعدين دوس "نسيت كلمة المرور"'; return; }
    try{
      const fb = await fbReady;
      await fb.A.sendPasswordResetEmail(fb.auth, email);
      toast('لو الإيميل مسجل عندنا، هيوصلك رابط لإعادة تعيين كلمة المرور');
    }catch(e){ err.textContent = authMsg(e.code); }
  };
  btn.onclick = async ()=>{
    err.textContent = '';
    const email = document.getElementById('auth_email').value.trim();
    const pass = document.getElementById('auth_pass').value;
    const name = isSignup ? document.getElementById('auth_name').value.trim() : '';
    const phone = isSignup ? document.getElementById('auth_phone').value.trim() : '';
    if(!EMAIL_RE.test(email)){ err.textContent='اكتب إيميل صحيح'; return; }
    if(pass.length < 8){ err.textContent='كلمة المرور لازم تكون 8 أحرف على الأقل'; return; }
    if(isSignup && !name){ err.textContent='اكتب اسمك'; return; }
    if(isSignup && !phone){ err.textContent='اكتب رقم موبايلك'; return; }
    btn.disabled = true; btn.textContent = 'جارٍ التحقق...';
    try{
      const fb = await fbReady;
      if(isSignup){
        const cred = await fb.A.createUserWithEmailAndPassword(fb.auth, email, pass);
        await fb.F.setDoc(fb.F.doc(fb.db,'users',cred.user.uid), { name, phone, email:cred.user.email, createdAt: fb.F.serverTimestamp() });
        saveProfile({ uid:cred.user.uid, name, email:cred.user.email, phone });
      } else {
        const cred = await fb.A.signInWithEmailAndPassword(fb.auth, email, pass);
        await syncProfile(cred.user);
      }
      toast(isSignup ? 'تم إنشاء حسابك 🎉' : 'تم تسجيل الدخول بنجاح');
      if(cart.length>0){ closeMenu(); checkoutStep='form'; openCart(); }
      else { openAccount(); }
    }catch(e){
      err.textContent = authMsg(e.code);
      btn.disabled = false; btn.textContent = isSignup?'إنشاء الحساب':'تسجيل الدخول';
    }
  };
  showSheet();
}

async function deleteMyAccount(){
  const pass = prompt('لحذف حسابك نهائياً، اكتب كلمة المرور للتأكيد:');
  if(!pass) return;
  if(!confirm('سيتم حذف حسابك وبياناتك نهائياً ولا يمكن التراجع. متابعة؟')) return;
  try{
    const fb = await fbReady;
    const u = fb.auth.currentUser;
    if(!u){ toast('سجّل الدخول أولاً'); return; }
    const cred = fb.A.EmailAuthProvider.credential(u.email, pass);
    await fb.A.reauthenticateWithCredential(u, cred);
    await fb.F.deleteDoc(fb.F.doc(fb.db,'users',u.uid));
    await fb.A.deleteUser(u);
    clearProfile();
    try{ localStorage.removeItem(ORDERS_KEY); if(state) state.orders = []; }catch(e){}
    toast('تم حذف حسابك وبياناتك نهائياً');
    closeMenu();
  }catch(e){ toast(authMsg(e.code)); }
}

/* ---------- ربط الحسابات بالتطبيق ---------- */
document.getElementById('navAccount').onclick = openAccount;

/* الطلب لازم يكون بحساب، والاسم والموبايل بيتعبّوا تلقائياً */
const origRenderCartSheet = window.renderCartSheet;
window.renderCartSheet = function(){
  if(checkoutStep === 'form' && !getProfile()) checkoutStep = 'cart';
  origRenderCartSheet();
  const p = getProfile();
  if(checkoutStep === 'cart'){
    const go = document.getElementById('goCheckout');
    if(go && !p){
      go.onclick = ()=>{
        closeCart();
        renderAuthForm('login');
        toast('سجّل الدخول الأول عشان تكمل طلبك');
      };
    }
  } else if(p){
    const n = document.getElementById('custName'), t = document.getElementById('custPhone');
    if(n && !n.value) n.value = p.name || '';
    if(t && !t.value) t.value = p.phone || '';
  }
};

})();

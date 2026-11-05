import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, onSnapshot, waitForPendingWrites } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const PM = window.PM;
const configured = firebaseConfig && firebaseConfig.apiKey && !/^PASTE/.test(firebaseConfig.apiKey);
const acctInfo = $('acctInfo'), acctBtn = $('acctBtn'), login = $('login');

if (!configured) {
  acctInfo.textContent = 'Cloud sync is not set up yet. Data is saved on this device only.';
  acctBtn.classList.add('hide');
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  const provider = new GoogleAuthProvider();
  let user = null, unsub = null, skipped = false, prompting = false, timer = null;

  login.classList.remove('hide'); // shown until we know whether you are signed in

  function fail(e) {
    const m = navigator.onLine ? 'Sign-in failed (' + (e.code || e.message) + ')' : 'You need internet to sign in.';
    $('lMsg').textContent = m; PM.toast(m);
  }
  async function signIn() {
    $('lMsg').textContent = '';
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        try { await signInWithRedirect(auth, provider); } catch (e2) { fail(e2); }
      } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') { fail(e); }
    }
  }

  async function push(s, u) {
    s.uid = u.uid; if (!s.updatedAt) s.updatedAt = Date.now(); PM.persist();
    const data = JSON.parse(JSON.stringify({ balances: s.balances, limit: s.limit, payments: s.payments, updatedAt: s.updatedAt }));
    await setDoc(doc(db, 'users', u.uid), data);
  }
  function apply(cloud, u) {
    PM.apply({ balances: cloud.balances, limit: cloud.limit, payments: cloud.payments || [], updatedAt: cloud.updatedAt || 0, uid: u.uid });
  }
  function conflict(local, cloud, u) {
    prompting = true;
    PM.sheet('<p class="msg">This device already has payments, and your account has saved data too. Which should we keep?</p><div class="row" style="flex-direction:column"><button class="primary" style="flex:none" id="cUse" type="button">Use my account data</button><button class="ghost" style="flex:none" id="cDev" type="button">Use this device\u2019s data</button></div>');
    $('cUse').onclick = () => { PM.close(); apply(cloud, u); prompting = false; };
    $('cDev').onclick = () => { PM.close(); local.updatedAt = Date.now(); push(local, u).catch(() => {}); prompting = false; };
  }

  function startSync(u) {
    stopSync();
    unsub = onSnapshot(doc(db, 'users', u.uid), async (snap) => {
      if (snap.metadata.hasPendingWrites || prompting) return;
      const local = PM.get();
      if (!snap.exists()) { await push(local, u).catch(() => {}); return; }
      const cloud = snap.data();
      const cT = cloud.updatedAt || 0, lT = local.updatedAt || 0;
      if (local.uid === u.uid) {
        if (cT > lT) apply(cloud, u); else if (lT > cT) push(local, u).catch(() => {});
        return;
      }
      const hasLocal = (local.payments || []).length > 0, hasCloud = (cloud.payments || []).length > 0;
      if (!hasLocal) apply(cloud, u);
      else if (!hasCloud) { local.updatedAt = Date.now(); push(local, u).catch(() => {}); }
      else conflict(local, cloud, u);
    }, (err) => {
      PM.toast(err.code === 'permission-denied' ? 'Cloud access denied. Check the Firestore rules.' : 'Sync problem. Will retry.');
    });
  }
  function stopSync() { if (unsub) { unsub(); unsub = null; } }

  PM.onSave = function (s) {
    if (!user) return;
    s.uid = user.uid; PM.persist();
    clearTimeout(timer);
    timer = setTimeout(() => { push(s, user).catch(() => {}); }, 400);
  };

  function doSignOut() {
    const warn = navigator.onLine ? '' : ' You are offline, so changes not yet synced will be lost.';
    PM.ask('Sign out? Your data stays safe in your account and is removed from this device.' + warn, 'Sign out', async () => {
      PM.toast('Signing out\u2026');
      try { await Promise.race([waitForPendingWrites(db), new Promise((r) => setTimeout(r, 4000))]); } catch (e) {}
      stopSync();
      await signOut(auth);
      PM.reset(); skipped = false; location.hash = '#home';
    });
  }

  $('gSign').onclick = signIn;
  $('skip').onclick = () => { skipped = true; login.classList.add('hide'); };
  acctBtn.onclick = () => (user ? doSignOut() : signIn());

  onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) {
      login.classList.add('hide');
      acctInfo.textContent = 'Signed in as ' + (u.email || u.displayName || 'your Google account') + '. Your data syncs to your account.';
      acctBtn.textContent = 'Sign out';
      startSync(u);
    } else {
      stopSync();
      acctInfo.textContent = 'Not signed in. Data is saved on this device only.';
      acctBtn.textContent = 'Sign in with Google';
      $('lBtns').classList.remove('hide');
      if (!skipped) login.classList.remove('hide');
    }
  });
}

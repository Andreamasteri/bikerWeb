/* Shared session controls for the public site, portal and planner. */
(function () {
  'use strict';
  const IDLE_MS = 30 * 60 * 1000;
  const KEY = 'bl_web_activity';
  let user = null;
  let lastActivity = 0;
  let lastSent = 0;
  let pendingActivity = null;
  let timer = null;
  let loggingOut = false;
  const style = document.createElement('style');
  style.textContent = '[data-web-logout][hidden],#navAccountLink[hidden]{display:none!important}';
  document.head.appendChild(style);

  function readActivity() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value && value.userId === user?.id && Number.isFinite(value.at)) {
        lastActivity = Math.max(lastActivity, value.at);
      }
    } catch { /* Storage can be disabled; the server still enforces expiry. */ }
  }
  function publish() {
    document.dispatchEvent(new CustomEvent('bikerlink:auth', { detail: user }));
    document.querySelectorAll('[data-web-logout]').forEach(button => {
      button.hidden = !user;
      button.disabled = loggingOut;
    });
  }
  function schedule() {
    clearTimeout(timer);
    if (!user) return;
    readActivity();
    timer = setTimeout(checkIdle, Math.max(0, IDLE_MS - (Date.now() - lastActivity)));
  }
  function authenticated(value, fresh) {
    if (value?.id !== user?.id) lastActivity = 0;
    user = value;
    if (user) {
      if (fresh) {
        lastActivity = Date.now();
        try { localStorage.setItem(KEY, JSON.stringify({ userId: user.id, at: lastActivity })); } catch {}
      } else {
        readActivity();
        if (!lastActivity) lastActivity = Date.now();
      }
    }
    publish();
    schedule();
  }
  async function refresh() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      if (response.ok) authenticated(await response.json(), false);
      else if (response.status === 401) authenticated(null, false);
      // A temporary backend/network error is not a logout.
    } catch {}
  }
  async function logout(idle) {
    if (loggingOut) return;
    loggingOut = true;
    publish();
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok && response.status !== 401) throw new Error('logout');
      try {
        localStorage.removeItem('@bikerlink/session_token');
        localStorage.removeItem(KEY);
        localStorage.setItem('bl_web_logout', String(Date.now()));
      } catch {}
      authenticated(null, false);
      location.replace(idle ? '/accedi?reason=inactivity' : '/accedi');
    } catch {
      if (!idle) window.alert('Impossibile uscire. Riprova.');
      else timer = setTimeout(checkIdle, 5000);
    } finally {
      loggingOut = false;
      publish();
    }
  }
  function checkIdle() {
    if (!user) return;
    readActivity();
    if (Date.now() - lastActivity >= IDLE_MS) void logout(true);
    else schedule();
  }
  async function sendActivity() {
    pendingActivity = null;
    if (!user || loggingOut) return;
    lastSent = Date.now();
    try {
      const response = await fetch('/api/auth/web-activity', { method: 'POST', credentials: 'same-origin' });
      if (response.status === 401) {
        authenticated(null, false);
        location.replace('/accedi?reason=inactivity');
      }
    } catch {}
  }
  function activity(event) {
    if (!user || loggingOut || !event.isTrusted || document.hidden) return;
    readActivity();
    // A returning interaction must not revive a session that already expired.
    if (Date.now() - lastActivity >= IDLE_MS) return checkIdle();
    lastActivity = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify({ userId: user.id, at: lastActivity })); } catch {}
    schedule();
    // Send the last interaction too, without a request on every key/click.
    if (Date.now() - lastSent >= 15000) void sendActivity();
    else if (!pendingActivity) pendingActivity = setTimeout(sendActivity, 15000 - (Date.now() - lastSent));
  }
  window.BikerLinkSession = { authenticated, refresh, logout };
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-web-logout]')) void logout(false);
  });
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(name => {
    document.addEventListener(name, activity, { passive: true });
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY) schedule();
    if (event.key === 'bl_web_logout') {
      authenticated(null, false);
      location.replace('/accedi');
    }
  });
  window.addEventListener('pageshow', () => { checkIdle(); void refresh(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { checkIdle(); void refresh(); }
  });
  void refresh();
})();

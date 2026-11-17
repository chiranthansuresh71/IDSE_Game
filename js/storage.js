/* LocalStorage wrapper — safe against missing/corrupted data and blocked storage. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const KEY = 'dataLockdown.save.v1';
  let memory = null; // fallback when localStorage is unavailable
  DL.storage = {
    KEY,
    load() {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
      } catch (e) { return memory; }
    },
    save(obj) {
      memory = obj;
      try { window.localStorage.setItem(KEY, JSON.stringify(obj)); return true; } catch (e) { return false; }
    },
    clear() { memory = null; try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  };
})(window.DL);

// Client-side Router and View Switching Logic
export function initRouter() {
  window.switchView = function(viewId) {
    document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('view-' + viewId);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    document.querySelectorAll('[id^="nav-"]').forEach(el => el.classList.remove('tab-active'));
    const navBtn = document.getElementById('nav-' + viewId);
    if (navBtn) navBtn.classList.add('tab-active');
  };
}

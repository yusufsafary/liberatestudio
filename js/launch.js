// Liberate launch gate: mint opens 2 November 2026 at 07.00 UTC.
// Before that instant the site counts down; after it, launch copy flips.
// On-chain mintOpen() remains the source of truth for the mint itself.
const LAUNCH_AT = Date.UTC(2026, 10, 2, 7, 0, 0);
function launchIsOpen() { return Date.now() >= LAUNCH_AT; }
function fmtCountdown(ms) {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return (d > 0 ? d + 'd ' : '') + p(h) + ':' + p(m) + ':' + p(ss);
}
function applyLaunch() {
  const open = launchIsOpen();
  document.querySelectorAll('[data-launch-hide]').forEach((el) => { el.style.display = open ? 'none' : ''; });
  document.querySelectorAll('[data-launch-show]').forEach((el) => { el.style.display = open ? '' : 'none'; });
  document.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = fmtCountdown(LAUNCH_AT - Date.now()); });
  if (open && typeof window.onLaunchFlip === 'function') window.onLaunchFlip();
}
document.addEventListener('DOMContentLoaded', () => {
  applyLaunch();
  if (!launchIsOpen()) setInterval(applyLaunch, 1000);
});

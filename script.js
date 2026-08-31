const music=document.querySelector('#site-music');
// One delegated click listener covers mouse, touch, and keyboard activation.
// Keep this sound independent from the background music and its controls.
const clickSound = new Audio('assets/audio/pop.mp3');
clickSound.preload = 'auto';
clickSound.volume = 0.65;
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest('a[href], button, summary, [role="button"]');
  if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}, true);
function unlockMusic(){if(!music)return;music.play().then(removeUnlock).catch(()=>{});}
function removeUnlock(){document.removeEventListener('pointerdown',unlockMusic);document.removeEventListener('keydown',unlockMusic);}
unlockMusic();
document.addEventListener('pointerdown',unlockMusic,{once:true});
document.addEventListener('keydown',unlockMusic,{once:true});
const mobileMenu=document.querySelector('.mobile-menu');
document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>{if(mobileMenu)mobileMenu.open=false;}));
function installButtonEffects() {
  const selector = '.join,.primary,.secondary,.status-module a,.mobile-menu summary';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  const sparks = new Set();
  let lastSpark = 0;
  const onMove = (event) => {
    if (!(event.target instanceof Element) || event.pointerType === 'touch') return;
    const button = event.target.closest(selector);
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    button.style.setProperty('--glow-x', x + 'px');
    button.style.setProperty('--glow-y', y + 'px');
    if (reducedMotion.matches || performance.now() - lastSpark < 65 || sparks.size >= 20) return;
    lastSpark = performance.now();
    const spark = document.createElement('span');
    spark.className = 'button-spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.setProperty('--drift-x', (Math.random() - .5) * 44 + 'px');
    spark.style.setProperty('--drift-y', -18 - Math.random() * 30 + 'px');
    button.appendChild(spark);
    sparks.add(spark);
    const timer = window.setTimeout(() => {
      spark.remove();
      sparks.delete(spark);
      timers.delete(timer);
    }, 750);
    timers.add(timer);
  };
  const onFocus = (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest(selector);
    if (button) {
      button.style.setProperty('--glow-x', '50%');
      button.style.setProperty('--glow-y', '50%');
    }
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('focusin', onFocus);
  return () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('focusin', onFocus);
    timers.forEach(timer => window.clearTimeout(timer));
    sparks.forEach(spark => spark.remove());
  };
}
installButtonEffects();

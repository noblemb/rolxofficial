const music=document.querySelector('#site-music');
function unlockMusic(){if(!music)return;music.play().then(removeUnlock).catch(()=>{});}
function removeUnlock(){document.removeEventListener('pointerdown',unlockMusic);document.removeEventListener('keydown',unlockMusic);}
unlockMusic();
document.addEventListener('pointerdown',unlockMusic,{once:true});
document.addEventListener('keydown',unlockMusic,{once:true});
const mobileMenu=document.querySelector('.mobile-menu');
document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>{if(mobileMenu)mobileMenu.open=false;}));

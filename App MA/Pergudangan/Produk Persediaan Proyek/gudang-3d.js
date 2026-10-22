// Efek miring halus saat kursor di atas kartu ringkasan. Tidak aktif di layar sentuh.
(function(){
  if(matchMedia('(hover:none)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const S='.summary-card,.mini-card';
  document.addEventListener('pointermove',e=>{
    const c=e.target.closest&&e.target.closest(S);if(!c)return;
    const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.style.setProperty('--ry',(x*8).toFixed(2)+'deg');c.style.setProperty('--rx',(-y*8).toFixed(2)+'deg');
  });
  document.addEventListener('pointerout',e=>{
    const c=e.target.closest&&e.target.closest(S);if(!c||c.contains(e.relatedTarget))return;
    c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg');
  });
})();

(function(){
  var mt=document.getElementById('menuToggle'), nv=document.getElementById('nav');
  if(!mt||!nv) return;
  mt.addEventListener('click', function(e){ e.stopPropagation(); nv.classList.toggle('open'); });
  nv.querySelectorAll('.links a').forEach(function(a){ a.addEventListener('click', function(){ nv.classList.remove('open'); }); });
  document.addEventListener('click', function(e){ if(nv.classList.contains('open') && !nv.contains(e.target)) nv.classList.remove('open'); });
})();

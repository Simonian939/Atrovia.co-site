(function(){
  var root=document.documentElement;
  function apply(t){ t=(t==='light')?'light':'dark'; root.setAttribute('data-theme',t);
    try{localStorage.setItem('atrovia-theme',t)}catch(e){}
    try{ if(window.parent&&window.parent!==window&&window.parent.atroviaTheme) window.parent.atroviaTheme(t); }catch(e){} }
  var stored=null, chosen=false;
  try{ stored=localStorage.getItem('atrovia-theme'); if(stored) chosen=true; }catch(e){}
  if(typeof window.__theme!=='undefined' && window.__theme){ stored=window.__theme; }
  if(window.__themeChosen){ chosen=true; }
  apply(stored||'dark');
  var pop=document.getElementById('themePop');
  if(!chosen && pop){ pop.classList.add('show'); }
  function choose(t){ apply(t); if(pop) pop.classList.remove('show');
    try{ if(window.parent&&window.parent!==window&&window.parent.atroviaThemeChosen) window.parent.atroviaThemeChosen(); }catch(e){} }
  if(pop){ pop.querySelectorAll('[data-pick]').forEach(function(el){ el.addEventListener('click',function(){ choose(el.getAttribute('data-pick')); }); }); }
  var tg=document.getElementById('themeToggle');
  if(tg){ tg.addEventListener('click',function(){ var cur=root.getAttribute('data-theme')==='light'?'light':'dark'; apply(cur==='light'?'dark':'light'); }); }
})();

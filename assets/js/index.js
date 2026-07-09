  const CTA = { signup:'signup.html' };  // signup CTAs go to the plan/sign-up page
  const DEMO_VIDEO_URL = '';             // <-- put your demo video URL here (YouTube/Vimeo embed or .mp4)

  const nav=document.getElementById('nav');
  const onScroll=()=>nav.classList.toggle('scrolled',scrollY>20);
  onScroll(); addEventListener('scroll',onScroll,{passive:true});

  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  const tl=document.getElementById('tl'),line=document.getElementById('tlLine'),mods=[...document.querySelectorAll('.mod')];
  function tlUpdate(){if(!tl)return;const r=tl.getBoundingClientRect();const vh=innerHeight;
    const p=Math.min(1,Math.max(0,(vh*0.6 - r.top)/(r.height)));line.style.setProperty('--p',p.toFixed(3));
    const lr=line.getBoundingClientRect();const fillY=lr.top+p*lr.height;
    mods.forEach(m=>{const node=m.querySelector('.node');const nr=node.getBoundingClientRect();const center=nr.top+nr.height/2;
      if(nr.top<vh*0.85)m.classList.add('in');
      if(center<=fillY+2)node.classList.add('lit');else node.classList.remove('lit');});}
  addEventListener('scroll',tlUpdate,{passive:true});tlUpdate();

  const sp=document.getElementById('sparks');
  if(sp){for(let i=0;i<48;i++){const s=document.createElement('span');s.className='spark';
    s.style.left=(Math.random()*100)+'%';const sz=(2+Math.random()*4);s.style.width=s.style.height=sz+'px';
    s.style.animationDuration=(5+Math.random()*6)+'s';s.style.animationDelay=(-Math.random()*9)+'s';sp.appendChild(s);}}

  // ---- CTA wiring (signup links + demo opens the video modal) ----
  function wireCTA(){
    document.querySelectorAll('[data-cta]').forEach(a=>{
      const k=a.dataset.cta;
      if(k==='demo'){ a.style.cursor='pointer'; a.addEventListener('click',e=>{e.preventDefault();openDemo();}); }
      else if(CTA[k] && CTA[k]!=='#'){ a.href=CTA[k]; }
    });
  }
  wireCTA();

  // ---- Demo video modal ----
  const vmodal=document.getElementById('vmodal'), vframe=document.getElementById('vframe');
  function openDemo(){
    if(DEMO_VIDEO_URL){
      const isFile=/\.(mp4|webm|ogg)(\?|$)/i.test(DEMO_VIDEO_URL);
      vframe.innerHTML = isFile
        ? '<video controls autoplay style="position:absolute;inset:0;width:100%;height:100%;background:#000"><source src="'+DEMO_VIDEO_URL+'"></video>'
        : '<iframe src="'+DEMO_VIDEO_URL+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    }
    vmodal.classList.add('open');
  }
  function closeDemo(){ vmodal.classList.remove('open'); const f=vframe.querySelector('iframe,video'); if(f){ if(f.tagName==='VIDEO'){f.pause();} else {const s=f.src;f.src=s;} } }
  document.getElementById('vclose').addEventListener('click',closeDemo);
  vmodal.addEventListener('click',e=>{ if(e.target===vmodal) closeDemo(); });
  addEventListener('keydown',e=>{ if(e.key==='Escape') closeDemo(); });

  // ---- Business check survey ----
  const surveyGridEl=document.getElementById('surveyGrid');
  document.querySelectorAll('.scard').forEach(card=>{
    const rng=card.querySelector('.rng'), mval=card.querySelector('.mval');
    const col=card.classList.contains('c')?'#34E0C8':'#8B5CF6';
    function upd(){const v=+rng.value;card.dataset.val=v;const pct=v*10;
      rng.style.background='linear-gradient(90deg,'+col+' '+pct+'%,var(--track) '+pct+'%)';
      mval.innerHTML=v+'<span>/10</span>';}
    rng.addEventListener('input',()=>{ if(surveyGridEl) surveyGridEl.classList.remove('hint-active'); upd(); });
    upd();
  });
  const surveyBtn=document.getElementById('surveyBtn');
  if(surveyBtn) surveyBtn.addEventListener('click',()=>{
    const cards=[...document.querySelectorAll('.scard')]; let mS=0,mN=0,cS=0,cN=0,total=0;
    cards.forEach(c=>{const v=+c.dataset.val||0; total+=v; if(v>0){ if(c.dataset.type==='m'){mS+=v;mN++;} else {cS+=v;cN++;} }});
    if(mN+cN<4){document.getElementById('surveyHint').classList.add('show');return;}
    document.getElementById('surveyHint').classList.remove('show');
    const mAvg=mN?mS/mN:0;
    let rec,title,why,tool;
    if(mAvg>=8.5 && mN>=4){ rec='kova'; title='Start with Kova'; tool='Kova';
      why='Your marketing is already dialed in. The fastest win now is organizing your customers and turning follow-up into repeat business — that\'s Kova.'; }
    else { rec='atrium'; title='Start with Atrium'; tool='Atrium';
      why='Most of your growth right now is in marketing. Start with Atrium to build your brand, your plan, and a steady flow of new customers — then add Kova to keep them.'; }
    const r=document.getElementById('surveyResult');
    r.innerHTML='<div class="result-card '+rec+'"><div class="rl">Your business score today</div><div class="score">'+total+'<span>/100</span></div><div class="scoremeter"><div class="fill" id="scoreFill"></div></div><div class="scorelabels"><span>Today: '+total+'</span><span class="goalend">30-day goal: 100</span></div><p class="goaltxt">In your first 30 days, our goal is to close that gap and get you to <b>100 — fully dialed in.</b></p><div class="rdiv"></div><div class="rl">Where to start</div><div class="rt">'+title+'</div><p>'+why+'</p><div class="cta-row"><a class="btn btn-primary btn-lg" href="#" data-cta="signup">Start '+tool+' free — 7-day trial</a><a class="btn btn-outline btn-lg" href="#" data-cta="demo">Explore our demo video</a></div></div>';
    r.classList.add('show'); wireCTA(); requestAnimationFrame(()=>{const f=document.getElementById('scoreFill'); if(f) f.style.width=total+'%';}); r.scrollIntoView({behavior:'smooth',block:'center'});
  });

  

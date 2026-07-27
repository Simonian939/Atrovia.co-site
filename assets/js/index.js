  const CTA = { signup:'signup.html' };  // signup CTAs go to the plan/sign-up page
  const DEMO_VIDEO_URL = 'videos/atrovia-demo.mp4';  // demo: se reproduce en el modal y en la sección #demo

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
    // Pausa el demo inline antes de abrir el modal: si no, sonaban los dos a la vez.
    // stopDemo está más abajo pero es function declaration, así que ya está definida.
    stopDemo();
    if(DEMO_VIDEO_URL){
      const isFile=/\.(mp4|webm|ogg)(\?|$)/i.test(DEMO_VIDEO_URL);
      vframe.innerHTML = isFile
        ? '<video controls autoplay playsinline poster="videos/atrovia-demo-poster.jpg" style="position:absolute;inset:0;width:100%;height:100%;background:#000"><source src="'+DEMO_VIDEO_URL+'"></video>'
        : '<iframe src="'+DEMO_VIDEO_URL+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    }
    vmodal.classList.add('open');
  }
  function closeDemo(){ vmodal.classList.remove('open'); const f=vframe.querySelector('iframe,video'); if(f){ if(f.tagName==='VIDEO'){f.pause();} else {const s=f.src;f.src=s;} } }
  document.getElementById('vclose').addEventListener('click',closeDemo);

  // ---- Demo inline (sección #demo) ----
  // preload="none" en el HTML: el mp4 de 8.8 MB NO se descarga hasta que alguien
  // hace clic. Solo pesa el póster (61 KB) en la carga inicial de la página.
  //
  // El listener va en el OVERLAY (.play), no en el contenedor. Estaba en el
  // contenedor y por eso el video "no paraba": al activar controls=true, el clic en
  // el botón de pausa nativo burbujeaba hasta el contenedor y volvía a llamar play(),
  // así que se repausaba y arrancaba en el mismo clic. Con el listener en el overlay
  // (que se vuelve pointer-events:none al arrancar) los controles nativos mandan.
  const demoFrame=document.getElementById('demoFrame');
  const demoVideo=document.getElementById('demoVideo');
  const demoOverlay=demoFrame && demoFrame.querySelector('.play');
  function startDemo(){
    if(!demoVideo) return;
    demoFrame.classList.add('playing');
    demoVideo.controls=true;
    demoVideo.play().catch(()=>{ demoFrame.classList.remove('playing'); });
  }
  function stopDemo(){
    if(demoVideo && !demoVideo.paused) demoVideo.pause();
  }
  if(demoOverlay) demoOverlay.addEventListener('click',startDemo);
  // Si el usuario lo pausa y lo deja al inicio, vuelve a mostrarse el botón grande.
  if(demoVideo) demoVideo.addEventListener('pause',()=>{
    if(demoVideo.currentTime===0) demoFrame.classList.remove('playing');
  });

  vmodal.addEventListener('click',e=>{ if(e.target===vmodal) closeDemo(); });
  addEventListener('keydown',e=>{ if(e.key==='Escape') closeDemo(); });

  // ---- Reproducción de los videos según visibilidad ----
  // Los <video> de las secciones llevan `autoplay loop muted playsinline`, pero el
  // autoplay por atributo se rechaza en varias situaciones reales de móvil: Low Power
  // Mode en iOS, Ahorro de datos en Android, o simplemente que el video esté fuera de
  // pantalla al cargar. Cuando se rechaza, el <video> se queda en su poster y parece
  // una imagen fija — exactamente lo que se reportó ("work on desktop but not mobile").
  //
  // Por eso no dependemos del atributo: pedimos play() cuando el video entra en
  // pantalla y lo pausamos cuando sale. De paso ahorra batería y datos, y evita que
  // el demo siga corriendo de fondo cuando ya nadie lo está viendo.
  const loopVideos=document.querySelectorAll('.appwin video, .vhero video');
  if('IntersectionObserver' in window){
    const vio=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        const v=e.target;
        if(e.isIntersecting){
          // iOS exige que muted esté puesto en la PROPIEDAD, no solo en el atributo,
          // cuando play() lo dispara el script.
          v.muted=true;
          const p=v.play();
          if(p && p.catch) p.catch(()=>{ v.dataset.autoplayBlocked='1'; });
        } else {
          v.pause();
        }
      });
    },{threshold:.2});
    loopVideos.forEach(v=>{
      v.muted=true; v.playsInline=true;
      vio.observe(v);
      // Último recurso directo: tocar el video lo arranca (eso sí es gesto del usuario).
      v.addEventListener('click',()=>{ if(v.paused) v.play().catch(()=>{}); });
    });

    // Reintento tras el PRIMER gesto del usuario en cualquier parte de la página.
    // En iOS con Low Power Mode (y en Android con Ahorro de datos) el navegador
    // rechaza todo play() hasta que hay una interacción real; a partir de ese momento
    // la concede para toda la página. Sin esto, quien solo hace scroll nunca ve los
    // videos moverse y quedan como imágenes fijas — el síntoma reportado. Con esto,
    // el primer toque/scroll-tap reactiva los que estén en pantalla.
    const retryBlocked=()=>{
      loopVideos.forEach(v=>{
        if(!v.paused || !v.dataset.autoplayBlocked) return;
        const r=v.getBoundingClientRect();
        if(r.top<innerHeight && r.bottom>0) v.play().then(()=>{ delete v.dataset.autoplayBlocked; },()=>{});
      });
    };
    ['touchstart','pointerdown','keydown'].forEach(ev=>
      addEventListener(ev,retryBlocked,{once:true,passive:true}));

    // El demo inline se pausa solo al salir de pantalla. Es el único con audio y con
    // 8.8 MB: dejarlo corriendo de fondo era parte del "just keeps running".
    if(demoVideo){
      new IntersectionObserver((es)=>{
        es.forEach(e=>{ if(!e.isIntersecting) stopDemo(); });
      },{threshold:0}).observe(demoVideo);
    }
  }

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
    if(mAvg>=8.5 && mN>=4){ rec='kova'; title='Start with CRM &amp; Sales'; tool='CRM &amp; Sales';
      why='Your marketing is already dialed in. The fastest win now is organizing your customers and turning follow-up into repeat business — that\'s CRM &amp; Sales.'; }
    else { rec='atrium'; title='Start with Marketing'; tool='Marketing';
      why='Most of your growth right now is in marketing. Start with Marketing to build your brand, your plan, and a steady flow of new customers — then add CRM &amp; Sales to keep them.'; }
    const r=document.getElementById('surveyResult');
    r.innerHTML='<div class="result-card '+rec+'"><div class="rl">Your business score today</div><div class="score">'+total+'<span>/100</span></div><div class="scoremeter"><div class="fill" id="scoreFill"></div></div><div class="scorelabels"><span>Today: '+total+'</span><span class="goalend">30-day goal: 100</span></div><p class="goaltxt">In your first 30 days, our goal is to close that gap and get you to <b>100 — fully dialed in.</b></p><div class="rdiv"></div><div class="rl">Where to start</div><div class="rt">'+title+'</div><p>'+why+'</p><div class="cta-row"><a class="btn btn-primary btn-lg" href="#" data-cta="signup">Start '+tool+' free — 7-day trial</a><a class="btn btn-outline btn-lg" href="#" data-cta="demo">Explore our demo video</a></div></div>';
    r.classList.add('show'); wireCTA(); requestAnimationFrame(()=>{const f=document.getElementById('scoreFill'); if(f) f.style.width=total+'%';}); r.scrollIntoView({behavior:'smooth',block:'center'});
  });

  

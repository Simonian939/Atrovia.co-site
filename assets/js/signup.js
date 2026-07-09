  const APP_URL = '';  // optional: direct redirect to the atrovia.co app after submit
  // Backend según el dominio: prod (atrovia.co) → prod.atrovia.co · resto (Vercel/UAT) → api.atrovia.co
  const API_BASE = location.hostname.endsWith('atrovia.co') ? 'https://prod.atrovia.co' : 'https://api.atrovia.co';
  const PRICE = { q:99, m:99 };                 // canonical: $99/mo per tool
  const state = { atrium:false, kova:false, cyc:'m' };  // monthly-only (backend bills monthly)

  const nav=document.getElementById('nav');
  const onScroll=()=>nav.classList.toggle('scrolled',scrollY>20);
  onScroll(); addEventListener('scroll',onScroll,{passive:true});
  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  function each(){ return PRICE[state.cyc]; }        // monthly rate
  function count(){ return (state.atrium?1:0)+(state.kova?1:0); }
  function totalCharge(){ return state.cyc==='q' ? count()*PRICE.q*3 : count()*PRICE.m; }
  function perUnit(){ return state.cyc==='q' ? '/quarter' : '/mo'; }
  function lineVal(){ return state.cyc==='q' ? '$'+(PRICE.q*3) : '$'+PRICE.m+'/mo'; }
  function cycLabel(){ return state.cyc==='q' ? 'Billed quarterly' : 'Billed monthly'; }

  function toggle(which){ state[which]=!state[which]; render(); }
  document.querySelectorAll('.selbtn[data-toggle]').forEach(b=>b.addEventListener('click',()=>toggle(b.dataset.toggle)));
  document.getElementById('signup-form').addEventListener('submit',e=>e.preventDefault());

  document.getElementById('pickboth').addEventListener('click',()=>{
    state.atrium=true; state.kova=true; render();
    document.getElementById('bar').scrollIntoView({behavior:'smooth'});
  });

  document.querySelectorAll('#cycle button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#cycle button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); state.cyc=b.dataset.cyc; render();
  }));

  // Monthly-only billing (backend creates monthly subscriptions) — hide the cycle chooser.
  const cycEl=document.getElementById('cycle'); if(cycEl) cycEl.style.display='none';

  function render(){
    // prices on cards (headline monthly rate)
    document.querySelectorAll('[data-price]').forEach(e=>e.textContent=each());
    document.querySelectorAll('[data-cyclabel]').forEach(e=>e.textContent=cycLabel());
    // card selected states
    document.getElementById('plan-atrium').classList.toggle('sel',state.atrium);
    document.getElementById('plan-kova').classList.toggle('sel',state.kova);
    // build selection
    const items=[]; if(state.atrium)items.push('atrium'); if(state.kova)items.push('kova');
    const total=totalCharge();
    // bottom bar
    const bar=document.getElementById('bar');
    bar.classList.toggle('show',items.length>0);
    document.getElementById('sel-list').innerHTML=items.map(k=>
      '<span class="chipb '+k+'">'+(k==='atrium'?'Atrium':'Kova')+' · $'+each()+'/mo</span>').join('');
    document.getElementById('bar-amt').textContent=total;
    document.getElementById('bar-per').textContent=perUnit();
    // order summary
    document.getElementById('sum-rows').innerHTML=items.map(k=>
      '<div class="sum-row"><span class="nm"><span class="dot '+(k==='atrium'?'a':'k')+'"></span>'+(k==='atrium'?'Atrium — Marketing & Growth':'Kova — CRM & Sales')+'</span><span class="v">'+lineVal()+'</span></div>').join('');
    document.getElementById('sum-amt').textContent=total;
    document.getElementById('sum-per').textContent=perUnit();
    document.getElementById('sum-cyc').textContent = state.cyc==='q'
      ? '$'+PRICE.q+'/mo per tool, billed quarterly (3 months) · $'+PRICE.m+'/mo if monthly'
      : '$'+PRICE.m+'/mo per tool, billed monthly';
  }

  document.getElementById('continue').addEventListener('click',()=>{
    document.getElementById('signup').classList.add('show');
    document.getElementById('signup').scrollIntoView({behavior:'smooth'});
  });

  // billing address "same as business" toggle
  const sameBill=document.getElementById('samebill');
  if(sameBill) sameBill.addEventListener('change',()=>{
    document.getElementById('bill-fields').classList.toggle('hide',sameBill.checked);
  });

  const val = id => { const el=document.getElementById(id); return el ? el.value.trim() : ''; };

  document.getElementById('create').addEventListener('click', async (e)=>{
    e.preventDefault();
    const btn = e.currentTarget;
    const em = val('em'), ein = val('ein'), pw = document.getElementById('password').value;
    const company = val('company_name');

    // Plan selection -> backend planTier
    if(!state.atrium && !state.kova){ toast('Please choose Atrium, Kova, or both above first.','error'); return; }
    const planTier = (state.atrium && state.kova) ? 'combo' : (state.atrium ? 'atrium' : 'kova');

    if(!emailOk(em)){ bad('em','Please enter a valid email address.'); return; }
    if(!pw || pw.length < 8){ bad('password','Your password needs at least 8 characters.'); return; }
    if(!company){ bad('company_name','Please enter your legal business name.'); return; }
    if(!einOk(ein)){ bad('ein','Enter your EIN as 9 digits (e.g. 12-3456789).'); return; }

    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Creating your account…';

    try {
      // 1) Create the account (tenant + user) in the Atrovia backend
      const regRes = await fetch(API_BASE + '/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          firstName: val('rep_first'), lastName: val('rep_last'),
          email: em, phone: val('phone'), password: pw,
          companyName: company,
          companyOwner: (val('rep_first') + ' ' + val('rep_last')).trim(),
          ein: ein, stateLicense: '',
          vertical: val('industry'), state: val('business_state'),
          address: val('business_address1'),
          atriumEnabled: state.atrium, kovaEnabled: state.kova, planTier
        })
      });
      const reg = await regRes.json();
      if(!regRes.ok){
        toast(reg.error || 'Could not create your account. Please try again.','error');
        btn.disabled=false; btn.textContent=orig; return;
      }

      // 2) Start Stripe Checkout (7-day trial, monthly) and redirect to pay
      const coRes = await fetch(API_BASE + '/api/checkout-session', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ planTier, email: em, companyName: company, userData: {} })
      });
      const co = await coRes.json();
      if(coRes.ok && co.url){ window.location.href = co.url; return; }  // -> Stripe hosted checkout

      // Payment not available yet (e.g. Stripe not configured): account is created, confirm by email.
      document.getElementById('done-email').textContent = em;
      document.querySelector('.su-grid').style.display='none';
      document.getElementById('done').classList.add('show');
      document.getElementById('done').scrollIntoView({behavior:'smooth'});
      if(APP_URL){ setTimeout(()=>{ window.location.href=APP_URL; }, 2200); }
    } catch(err){
      toast("Couldn't reach the server. Check your connection and try again.",'error');
      btn.disabled=false; btn.textContent=orig;
    }
  });

  // ---------- Form UX: states, city autofill, formatting, toast ----------
  const US_STATES=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  function fillStates(id){ const s=document.getElementById(id); if(!s) return; const cur=s.value; s.innerHTML='<option value="">Select…</option>'; US_STATES.forEach(([c,n])=>{ const o=document.createElement('option'); o.value=c; o.textContent=n; s.appendChild(o); }); if(cur) s.value=cur; }
  fillStates('business_state'); fillStates('billing_state');

  // ponytail: ~120 largest US cities — auto-fills state for most users; datalist still lets them type any city. Grow the list if coverage matters.
  const US_CITIES=[
    {c:'New York',s:'NY',z:'10001'},{c:'Los Angeles',s:'CA',z:'90001'},{c:'Chicago',s:'IL',z:'60601'},{c:'Houston',s:'TX',z:'77001'},{c:'Phoenix',s:'AZ',z:'85001'},{c:'Philadelphia',s:'PA',z:'19101'},{c:'San Antonio',s:'TX',z:'78201'},{c:'San Diego',s:'CA',z:'92101'},{c:'Dallas',s:'TX',z:'75201'},{c:'San Jose',s:'CA',z:'95101'},{c:'Austin',s:'TX',z:'73301'},{c:'Jacksonville',s:'FL',z:'32099'},{c:'Fort Worth',s:'TX',z:'76101'},{c:'Columbus',s:'OH',z:'43085'},{c:'Charlotte',s:'NC',z:'28201'},{c:'San Francisco',s:'CA',z:'94102'},{c:'Indianapolis',s:'IN',z:'46201'},{c:'Seattle',s:'WA',z:'98101'},{c:'Denver',s:'CO',z:'80201'},{c:'Washington',s:'DC',z:'20001'},{c:'Boston',s:'MA',z:'02108'},{c:'El Paso',s:'TX',z:'79901'},{c:'Nashville',s:'TN',z:'37201'},{c:'Detroit',s:'MI',z:'48201'},{c:'Oklahoma City',s:'OK',z:'73101'},{c:'Portland',s:'OR',z:'97201'},{c:'Las Vegas',s:'NV',z:'89101'},{c:'Memphis',s:'TN',z:'38101'},{c:'Louisville',s:'KY',z:'40201'},{c:'Baltimore',s:'MD',z:'21201'},{c:'Milwaukee',s:'WI',z:'53201'},{c:'Albuquerque',s:'NM',z:'87101'},{c:'Tucson',s:'AZ',z:'85701'},{c:'Fresno',s:'CA',z:'93701'},{c:'Sacramento',s:'CA',z:'94203'},{c:'Kansas City',s:'MO',z:'64101'},{c:'Mesa',s:'AZ',z:'85201'},{c:'Atlanta',s:'GA',z:'30301'},{c:'Omaha',s:'NE',z:'68101'},{c:'Colorado Springs',s:'CO',z:'80901'},{c:'Raleigh',s:'NC',z:'27601'},{c:'Long Beach',s:'CA',z:'90801'},{c:'Virginia Beach',s:'VA',z:'23450'},{c:'Miami',s:'FL',z:'33101'},{c:'Oakland',s:'CA',z:'94601'},{c:'Minneapolis',s:'MN',z:'55401'},{c:'Tulsa',s:'OK',z:'74101'},{c:'Bakersfield',s:'CA',z:'93301'},{c:'Wichita',s:'KS',z:'67201'},{c:'Arlington',s:'TX',z:'76001'},{c:'Aurora',s:'CO',z:'80010'},{c:'Tampa',s:'FL',z:'33601'},{c:'New Orleans',s:'LA',z:'70112'},{c:'Cleveland',s:'OH',z:'44101'},{c:'Honolulu',s:'HI',z:'96801'},{c:'Anaheim',s:'CA',z:'92801'},{c:'Lexington',s:'KY',z:'40501'},{c:'Stockton',s:'CA',z:'95201'},{c:'Corpus Christi',s:'TX',z:'78401'},{c:'Henderson',s:'NV',z:'89002'},{c:'Riverside',s:'CA',z:'92501'},{c:'Newark',s:'NJ',z:'07101'},{c:'Saint Paul',s:'MN',z:'55101'},{c:'Santa Ana',s:'CA',z:'92701'},{c:'Cincinnati',s:'OH',z:'45201'},{c:'Irvine',s:'CA',z:'92602'},{c:'Orlando',s:'FL',z:'32801'},{c:'Pittsburgh',s:'PA',z:'15201'},{c:'St. Louis',s:'MO',z:'63101'},{c:'Greensboro',s:'NC',z:'27401'},{c:'Jersey City',s:'NJ',z:'07302'},{c:'Anchorage',s:'AK',z:'99501'},{c:'Lincoln',s:'NE',z:'68501'},{c:'Plano',s:'TX',z:'75023'},{c:'Durham',s:'NC',z:'27701'},{c:'Buffalo',s:'NY',z:'14201'},{c:'Chandler',s:'AZ',z:'85224'},{c:'Chula Vista',s:'CA',z:'91909'},{c:'Toledo',s:'OH',z:'43601'},{c:'Madison',s:'WI',z:'53701'},{c:'Gilbert',s:'AZ',z:'85234'},{c:'Reno',s:'NV',z:'89501'},{c:'Fort Wayne',s:'IN',z:'46801'},{c:'North Las Vegas',s:'NV',z:'89030'},{c:'Scottsdale',s:'AZ',z:'85251'},{c:'Boise',s:'ID',z:'83701'},{c:'Richmond',s:'VA',z:'23218'},{c:'Baton Rouge',s:'LA',z:'70801'},{c:'Des Moines',s:'IA',z:'50301'},{c:'Spokane',s:'WA',z:'99201'},{c:'Birmingham',s:'AL',z:'35201'},{c:'Modesto',s:'CA',z:'95350'},{c:'Salt Lake City',s:'UT',z:'84101'},{c:'Tacoma',s:'WA',z:'98401'},{c:'Fontana',s:'CA',z:'92335'},{c:'Fayetteville',s:'NC',z:'28301'},{c:'Montgomery',s:'AL',z:'36101'},{c:'Little Rock',s:'AR',z:'72201'},{c:'Grand Rapids',s:'MI',z:'49501'},{c:'Providence',s:'RI',z:'02901'},{c:'Knoxville',s:'TN',z:'37901'},{c:'Worcester',s:'MA',z:'01601'},{c:'Sioux Falls',s:'SD',z:'57101'},{c:'Columbia',s:'SC',z:'29201'},{c:'Charleston',s:'SC',z:'29401'},{c:'Chattanooga',s:'TN',z:'37401'},{c:'Wilmington',s:'DE',z:'19801'},{c:'Manchester',s:'NH',z:'03101'},{c:'Portland',s:'ME',z:'04101'},{c:'Billings',s:'MT',z:'59101'},{c:'Fargo',s:'ND',z:'58102'},{c:'Burlington',s:'VT',z:'05401'},{c:'Jackson',s:'MS',z:'39201'},{c:'Charleston',s:'WV',z:'25301'},{c:'Cheyenne',s:'WY',z:'82001'},{c:'Bridgeport',s:'CT',z:'06601'},{c:'Salem',s:'OR',z:'97301'},{c:'Tallahassee',s:'FL',z:'32301'},{c:'Cedar Rapids',s:'IA',z:'52401'}
  ];
  const CITY_MAP={};
  const dl=document.getElementById('us-cities');
  US_CITIES.forEach(o=>{ const k=o.c.toLowerCase(); if(CITY_MAP[k]) return; CITY_MAP[k]={s:o.s,z:o.z}; if(dl){ const opt=document.createElement('option'); opt.value=o.c; dl.appendChild(opt); } });
  function wireCity(cityId,stateId,zipId){ const c=document.getElementById(cityId); if(!c) return; c.addEventListener('input',()=>{ const hit=CITY_MAP[c.value.trim().toLowerCase()]; if(!hit) return; const s=document.getElementById(stateId); if(s) s.value=hit.s; const z=document.getElementById(zipId); if(z && !z.value.trim()) z.value=hit.z; }); }
  wireCity('business_city','business_state','business_zip');
  wireCity('billing_city','billing_state','billing_zip');

  // live input formatting
  function onInput(id,fn){ const el=document.getElementById(id); if(el) el.addEventListener('input',()=>{ el.value=fn(el.value); }); }
  onInput('ein',v=>{ const d=v.replace(/\D/g,'').slice(0,9); return d.length>2?d.slice(0,2)+'-'+d.slice(2):d; });
  onInput('phone',v=>{ const d=v.replace(/\D/g,'').slice(0,10); if(d.length>6)return'('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6); if(d.length>3)return'('+d.slice(0,3)+') '+d.slice(3); return d.length?'('+d:''; });
  const zipFmt=v=>{ const d=v.replace(/\D/g,'').slice(0,9); return d.length>5?d.slice(0,5)+'-'+d.slice(5):d; };
  onInput('business_zip',zipFmt); onInput('billing_zip',zipFmt);

  // validation
  function emailOk(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function einOk(v){ return v.replace(/\D/g,'').length===9; }

  // toast (replaces window.alert)
  const TOAST_ICON={
    error:'<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.3" r=".6" fill="currentColor" stroke="none"/>',
    success:'<path d="M20 6L9 17l-5-5"/>',
    info:'<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.7" r=".6" fill="currentColor" stroke="none"/>'
  };
  function toast(msg,type){
    const wrap=document.getElementById('toast'); if(!wrap){ alert(msg); return; }
    const t=document.createElement('div'); t.className='toast '+(type||'info');
    const i=document.createElement('span'); i.className='ti'; i.innerHTML='<svg viewBox="0 0 24 24">'+(TOAST_ICON[type]||TOAST_ICON.info)+'</svg>';
    const x=document.createElement('span'); x.className='tx'; x.textContent=msg; // textContent: safe for backend-supplied errors
    const b=document.createElement('button'); b.className='tc'; b.type='button'; b.setAttribute('aria-label','Dismiss'); b.textContent='×';
    t.append(i,x,b); wrap.appendChild(t); requestAnimationFrame(()=>t.classList.add('in'));
    const close=()=>{ t.classList.remove('in'); setTimeout(()=>t.remove(),260); };
    b.addEventListener('click',close); setTimeout(close,5200);
  }
  function bad(id,msg){ const el=document.getElementById(id); if(el){ el.classList.add('invalid'); el.addEventListener('input',()=>el.classList.remove('invalid'),{once:true}); try{el.focus();}catch(e){} } toast(msg,'error'); }

  render();

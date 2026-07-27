/* Atrovia Marketplace — CSP-safe (script-src 'self'). Talks to api.atrovia.co.
   Public catalog is in the HTML; sign-in unlocks the live wallet + real purchases. */
(function(){
  var API = 'https://api.atrovia.co';
  var TKEY = 'atrovia_token';
  function token(){ try{ return localStorage.getItem(TKEY) || ''; }catch(e){ return ''; } }
  function setToken(t){ try{ localStorage.setItem(TKEY, t); }catch(e){} }
  function clearToken(){ try{ localStorage.removeItem(TKEY); }catch(e){} }
  function headers(){ var h={'Content-Type':'application/json'}; var t=token(); if(t) h['Authorization']='Bearer '+t; return h; }
  function api(path, opts){
    opts = opts || {}; opts.headers = headers();
    return fetch(API+path, opts).then(function(r){
      return r.json().catch(function(){ return null; }).then(function(body){
        if(!r.ok){ var e=new Error((body&&(body.error||body.code))||('http_'+r.status)); e.status=r.status; e.code=body&&body.code; throw e; }
        return body;
      });
    });
  }
  function num(n){ return Number(n||0).toLocaleString('en-US'); }
  function toast(msg){ var t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 3400); }
  function el(id){ return document.getElementById(id); }

  var wallet=el('wallet'), signinRow=el('signinRow');
  function showSignedOut(){ if(wallet) wallet.hidden=true; if(signinRow) signinRow.hidden=false; }
  function showWallet(b){
    if(!wallet) return;
    el('walTotal').textContent=num(b.total);
    el('walAllot').textContent=num(b.allotment_balance);
    el('walPurch').textContent=num(b.purchased_balance);
    var tier=(b.tier||'basic'); el('walTier').textContent=tier.charAt(0).toUpperCase()+tier.slice(1)+' plan';
    wallet.hidden=false; if(signinRow) signinRow.hidden=true;
  }
  function markOwned(){
    if(!token()) return;
    return api('/api/shell/store/mine').then(function(m){
      var owned={}; ((m&&m.addons)||[]).forEach(function(a){ owned[a.id]=true; });
      document.querySelectorAll('[data-addon]').forEach(function(btn){
        if(owned[btn.getAttribute('data-addon')]){
          var foot=btn.parentNode; btn.parentNode.removeChild(btn);
          var s=document.createElement('span'); s.className='it-owned'; s.textContent='Active'; foot.appendChild(s);
        }
      });
    }).catch(function(){});
  }
  function refreshWallet(){
    if(!token()){ showSignedOut(); return Promise.resolve(); }
    return api('/api/shell/tokens/balance').then(function(b){ showWallet(b); return markOwned(); })
      .catch(function(e){ if(e.status===401) clearToken(); showSignedOut(); });
  }

  // ---- sign-in modal ----
  var siModal=el('siModal');
  function openSignin(){ if(siModal) siModal.classList.add('show'); var em=el('siEmail'); if(em) em.focus(); }
  function closeSignin(){ if(siModal) siModal.classList.remove('show'); }
  var ob=el('openSignin'); if(ob) ob.addEventListener('click', openSignin);
  var sc=el('siClose'); if(sc) sc.addEventListener('click', closeSignin);
  if(siModal) siModal.addEventListener('click', function(e){ if(e.target===siModal) closeSignin(); });
  var siForm=el('siForm');
  if(siForm) siForm.addEventListener('submit', function(e){
    e.preventDefault();
    var err=el('siErr'); if(err) err.hidden=true;
    var btn=el('siSubmit'); btn.disabled=true; btn.textContent='Signing in…';
    var email=el('siEmail').value.trim(), pass=el('siPass').value;
    fetch(API+'/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:email, password:pass }) })
      .then(function(r){ return r.json().catch(function(){ return null; }).then(function(b){ if(!r.ok||!b||!b.token) throw new Error('login_failed'); return b; }); })
      .then(function(b){ setToken(b.token); closeSignin(); toast('Signed in.'); return refreshWallet(); })
      .catch(function(){ if(err){ err.textContent='That email or password didn\'t work. Please try again.'; err.hidden=false; } })
      .then(function(){ btn.disabled=false; btn.textContent='Sign in'; });
  });
  var so=el('signOut'); if(so) so.addEventListener('click', function(){ clearToken(); showSignedOut(); toast('Signed out.'); });

  // ---- buy token pack ----
  document.querySelectorAll('.buy').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(!token()){ openSignin(); return; }
      var packId=btn.getAttribute('data-pack'); btn.disabled=true; var old=btn.textContent; btn.textContent='Redirecting…';
      api('/api/shell/tokens/checkout', { method:'POST', body:JSON.stringify({ packId:packId }) })
        .then(function(r){ if(r&&r.url){ window.location.href=r.url; return; } throw new Error('no_url'); })
        .catch(function(e){ btn.disabled=false; btn.textContent=old; if(e.status===401){ clearToken(); showSignedOut(); openSignin(); } else toast('Could not start checkout. Please try again.'); });
    });
  });

  // ---- add paid add-on (module / product / agent) ----
  document.querySelectorAll('.add').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(!token()){ openSignin(); return; }
      var id=btn.getAttribute('data-addon'); btn.disabled=true; var old=btn.textContent; btn.textContent='…';
      api('/api/shell/store/addons/'+encodeURIComponent(id)+'/checkout', { method:'POST' })
        .then(function(r){ if(r&&r.url){ window.location.href=r.url; return; } throw new Error('no_url'); })
        .catch(function(e){ btn.disabled=false; btn.textContent=old; if(e.status===401){ clearToken(); showSignedOut(); openSignin(); } else toast('Could not start checkout. Please try again.'); });
    });
  });

  // ---- connect integration ----
  document.querySelectorAll('.connect').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(!token()){ openSignin(); return; }
      var id=btn.getAttribute('data-addon'); btn.disabled=true;
      api('/api/shell/store/addons/'+encodeURIComponent(id)+'/activate', { method:'POST' })
        .then(function(r){ if(r&&r.deepLink){ window.location.href=r.deepLink; return; } if(r&&r.activated){ toast('Connected.'); return; } toast('Open your workspace to finish connecting.'); btn.disabled=false; })
        .catch(function(e){ btn.disabled=false; if(e.status===401){ clearToken(); showSignedOut(); openSignin(); } else toast('Could not connect right now.'); });
    });
  });

  // ---- confirm return from Stripe hosted checkout ----
  function confirmReturn(){
    var q=new URLSearchParams(location.search);
    var tp=q.get('token_purchase'), ap=q.get('addon_purchase');
    var chain=Promise.resolve();
    if(tp&&token()){ chain=chain.then(function(){ return api('/api/shell/tokens/confirm-checkout',{method:'POST',body:JSON.stringify({sessionId:tp})}).then(function(r){ if(r&&(r.credited||r.duplicate)) toast('Payment received — tokens added.'); }).catch(function(){}); }); }
    if(ap&&token()){ chain=chain.then(function(){ return api('/api/shell/store/confirm-checkout',{method:'POST',body:JSON.stringify({sessionId:ap})}).then(function(r){ if(r&&r.activated) toast('Payment received — add-on activated.'); }).catch(function(){}); }); }
    if(tp||ap){ chain=chain.then(function(){ try{ history.replaceState({},'', '/marketplace'); }catch(e){} }); }
    return chain;
  }

  confirmReturn().then(refreshWallet);
})();

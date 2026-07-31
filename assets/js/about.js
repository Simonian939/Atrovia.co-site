  const nav=document.getElementById('nav');
  const onScroll=()=>nav.classList.toggle('scrolled',scrollY>20);
  onScroll(); addEventListener('scroll',onScroll,{passive:true});
  

  // The contact form is now the hosted CRM embed; this mailto fallback only
  // binds if the old fields are still on the page.
  const csend=document.getElementById('csend');
  if(csend) csend.addEventListener('click',()=>{
    const name=encodeURIComponent(document.getElementById('cname').value||'');
    const email=document.getElementById('cemail').value||'';
    const msg=document.getElementById('cmsg').value||'';
    const subject=encodeURIComponent('Atrovia inquiry from '+(name||'website'));
    const body=encodeURIComponent(msg+'\n\n— '+name+(email?(' ('+email+')'):''));
    window.location.href='mailto:info@atrovia.co?subject='+subject+'&body='+body;
  });

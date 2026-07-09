  const nav=document.getElementById('nav');
  const onScroll=()=>nav.classList.toggle('scrolled',scrollY>20);
  onScroll(); addEventListener('scroll',onScroll,{passive:true});
  

  document.getElementById('csend').addEventListener('click',()=>{
    const name=encodeURIComponent(document.getElementById('cname').value||'');
    const email=document.getElementById('cemail').value||'';
    const msg=document.getElementById('cmsg').value||'';
    const subject=encodeURIComponent('Atrovia inquiry from '+(name||'website'));
    const body=encodeURIComponent(msg+'\n\n— '+name+(email?(' ('+email+')'):''));
    window.location.href='mailto:info@atrovia.co?subject='+subject+'&body='+body;
  });

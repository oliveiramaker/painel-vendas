// Ecomfy — sessão persistente e navegação da página de planos.
(function(){
  'use strict';
  if(!/planos\.html$/i.test(location.pathname)) return;

  async function sync(){
    var c=window.ecomfySupabase;
    if(!c) return false;
    try{
      var result=await c.auth.getSession();
      var session=result.data&&result.data.session;
      var login=document.querySelector('.public-login');
      var signup=document.querySelector('.public-primary');
      if(session){
        if(login){login.href='app.html';login.textContent='Painel';login.classList.add('public-session-link');}
        if(signup){signup.href='app.html';signup.textContent='Minha conta';signup.classList.remove('public-primary');signup.classList.add('public-session-link');}
        document.documentElement.dataset.ecomfyAuthenticated='true';
      }else{
        document.documentElement.dataset.ecomfyAuthenticated='false';
      }
      window.dispatchEvent(new CustomEvent('ecomfy-plans-session-ready',{detail:{session:session||null}}));
      return true;
    }catch(e){
      console.warn('Não foi possível verificar a sessão na página de planos.',e);
      return false;
    }
  }

  function boot(){
    if(!window.ecomfySupabase){setTimeout(boot,150);return;}
    sync();
    window.ecomfySupabase.auth.onAuthStateChange(function(event,session){
      if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION'||event==='SIGNED_OUT'){
        setTimeout(function(){sync();},0);
      }
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

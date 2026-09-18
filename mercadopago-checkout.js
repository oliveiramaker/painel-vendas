// Ecomfy — checkout da assinatura Premium via Mercado Pago.
(function(){
  'use strict';
  var ENDPOINT='https://pupbizieipwnssyotepw.supabase.co/functions/v1/mercadopago-create-checkout';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function show(message,error){var box=document.getElementById('premium-status');if(!box)return;box.innerHTML='<i class="fa-solid '+(error?'fa-circle-exclamation text-red-400':'fa-circle-check text-emerald-400')+' mr-2"></i>'+esc(message);box.classList.remove('hidden');}
  function render(){
    var mount=document.getElementById('premium-offer');
    if(!mount||mount.dataset.premiumRendered==='1')return;
    mount.dataset.premiumRendered='1';
    mount.innerHTML='<div class="tool-panel border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><span class="eyebrow blue-text">PREMIUM</span><h2 class="text-2xl font-black mt-2">Desbloqueie todo o Ecomfy</h2><p class="text-zinc-400 mt-2">Tenha acesso completo às ferramentas e recursos Premium.</p><div class="flex items-baseline gap-1 mt-4"><strong class="text-3xl">R$ 19,90</strong><span class="text-zinc-400">/mês</span></div><p class="text-xs text-zinc-500 mt-2">Cobrança recorrente processada pelo Mercado Pago.</p></div><button id="subscribe-premium" class="primary-cta inline-flex items-center justify-center gap-2 whitespace-nowrap"><i class="fa-solid fa-crown"></i> Assinar Premium</button></div><div id="premium-status" class="hidden mt-4 rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm"></div></div>';
    document.getElementById('subscribe-premium').addEventListener('click',checkout);
  }
  async function checkout(){var btn=document.getElementById('subscribe-premium');if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Preparando checkout...';}try{if(!window.ecomfySupabase)throw new Error('Sessão do Ecomfy ainda não está pronta.');var session=(await window.ecomfySupabase.auth.getSession()).data.session;if(!session)throw new Error('Sua sessão expirou. Faça login novamente.');var r=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'}});var data=await r.json().catch(function(){return{};});if(data.alreadyPremium){show('Sua conta já possui Premium.');return;}if(!r.ok||!data.checkout_url)throw new Error(data.error||'Não foi possível criar o checkout.');show('Checkout criado. Redirecionando para o Mercado Pago...');window.location.href=data.checkout_url;}catch(e){show(e.message||'Não foi possível iniciar a assinatura.',true);}finally{if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-crown"></i> Assinar Premium';}}}
  async function init(){
    if(!window.ecomfySupabase)return false;
    var session=(await window.ecomfySupabase.auth.getSession()).data.session;
    if(!session)return false;
    try{
      var uid=session.user.id;
      var r=await window.ecomfySupabase.from('profiles').select('plan,is_admin').eq('id',uid).single();
      if(r.data&&(r.data.plan==='premium'||r.data.is_admin)){document.getElementById('premium-offer')?.remove();return true;}
    }catch(e){console.warn('Não foi possível consultar o plano.',e);return false;}
    render();
    return true;
  }
  function boot(){init().then(function(ok){if(!ok)setTimeout(boot,300);}).catch(function(){setTimeout(boot,500);});}
  window.addEventListener('ecomfy-auth-ready',function(){init();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

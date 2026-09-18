// Ecomfy — controle de recursos Premium e checkout via Mercado Pago.
(function(){
  'use strict';
  var path=location.pathname.toLowerCase(),plan='free';
  var ENDPOINT='https://pupbizieipwnssyotepw.supabase.co/functions/v1/mercadopago-create-checkout';
  function assets(){
    if(!document.querySelector('link[data-premium-css]')){var l=document.createElement('link');l.rel='stylesheet';l.href='premium.css';l.dataset.premiumCss='1';document.head.appendChild(l);}
  }
  function checkout(){
    if(!window.ecomfySupabase){alert('A sessão do Ecomfy ainda está carregando. Tente novamente.');return;}
    window.ecomfySupabase.auth.getSession().then(function(r){
      var session=r.data&&r.data.session;
      if(!session){alert('Sua sessão expirou. Faça login novamente.');return;}
      return fetch(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'}})
        .then(function(res){return res.json().then(function(data){return {ok:res.ok,data:data};});})
        .then(function(result){
          if(result.data&&result.data.alreadyPremium){alert('Sua conta já possui Premium.');return;}
          if(!result.ok||!result.data||!result.data.checkout_url)throw new Error((result.data&&result.data.error)||'Não foi possível criar o checkout.');
          location.href=result.data.checkout_url;
        });
    }).catch(function(err){alert(err.message||'Não foi possível iniciar a assinatura.');});
  }
  function wire(){
    document.querySelectorAll('[data-premium-checkout]').forEach(function(b){
      if(b.dataset.wired)return;
      b.dataset.wired='1';
      b.addEventListener('click',function(e){e.preventDefault();checkout();});
    });
  }
  function banner(){
    if(document.querySelector('.premium-banner'))return;
    var nav=document.getElementById('ecomfy-global-nav');if(!nav)return;
    var b=document.createElement('div');b.className='premium-banner';
    b.innerHTML='<div><strong><i class="fa-solid fa-crown text-amber-400 mr-2"></i>Plano Free</strong><br><span>Desbloqueie todas as ferramentas e recursos avançados do Ecomfy.</span></div><a href="planos.html">Ver Premium</a>';
    nav.parentNode.insertBefore(b,nav.nextSibling);
  }
  function accountPlan(){
    var p=document.getElementById('popup-plan');
    if(p&&!p.parentNode.querySelector('[data-account-upgrade]')){
      p.textContent='FREE';
      var b=document.createElement('a');b.href='planos.html';b.dataset.accountUpgrade='1';b.className='premium-button';
      b.style.cssText='display:inline-flex;margin-top:10px;padding:9px 13px;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;text-decoration:none';
      b.innerHTML='<i class="fa-solid fa-crown" style="margin-right:7px"></i>Conhecer Premium';p.parentNode.appendChild(b);
    }
  }
  async function init(){
    assets();
    if(!window.ecomfySupabase){setTimeout(init,300);return;}
    try{
      var u=(await window.ecomfySupabase.auth.getUser()).data.user;if(!u)return;
      var p=await window.ecomfySupabase.from('profiles').select('plan,is_admin').eq('id',u.id).maybeSingle();
      plan=(p.data&&(p.data.plan==='premium'||p.data.is_admin))?'premium':'free';
      document.documentElement.dataset.ecomfyPlan=plan;
    }catch(e){console.warn('Plano não carregado',e);return;}
    if(plan==='premium')return;
    banner();accountPlan();wire();
    if(/painel-vendas\.html$/.test(path)||/gerador-zpl\.html$/.test(path)){
      var main=document.querySelector('main')||document.body;main.classList.add('premium-lock-card');
      if(!main.querySelector('.premium-gate-overlay')){var o=document.createElement('div');o.className='premium-gate-overlay';o.innerHTML='<div class="premium-gate-box"><div class="text-3xl text-blue-500"><i class="fa-solid fa-crown"></i></div><h3>Recurso Premium</h3><p>Desbloqueie esta ferramenta com o plano Premium do Ecomfy.</p><a href="planos.html">Ver planos</a></div>';main.appendChild(o);}
    }
    if(/app\.html$/.test(path))document.querySelectorAll('a[href="painel-vendas.html"],a[href="gerador-zpl.html"]').forEach(function(a){a.onclick=function(e){e.preventDefault();location.href='planos.html';};});
    if(/precificador\.html$/.test(path)){
      ['plataforma-tiktok','plataforma-mercadolivre','tab-cpf','modo-reverso-btn'].forEach(function(id){var b=document.getElementById(id);if(b){b.classList.add('premium-disabled');b.onclick=function(e){e.preventDefault();location.href='planos.html';};}});
      var ads=document.getElementById('usarAds');if(ads){ads.disabled=true;var label=ads.closest('label');if(label){label.classList.add('premium-disabled');label.addEventListener('click',function(){location.href='planos.html';});}}
    }
  }
  window.ecomfyBilling={wireCheckoutButtons:wire,goCheckout:checkout,getPlan:function(){return plan;}};
  window.addEventListener('ecomfy-auth-ready',init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// Ecomfy — validação e exibição do ciclo Premium.
(function(){
  'use strict';
  var ENDPOINT='https://pupbizieipwnssyotepw.supabase.co/functions/v1/validate-subscription';
  function formatDate(v){if(!v)return '—';var d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}
  function ensureFields(){
    var body=document.querySelector('.ecomfy-account-body');
    if(!body||document.getElementById('popup-subscription-cycle'))return;
    var sec=document.createElement('div');sec.id='popup-subscription-cycle';sec.className='ecomfy-account-section';
    sec.innerHTML='<div class="ecomfy-account-label">Ciclo da assinatura</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px"><div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px"><div class="ecomfy-account-label">Último pagamento</div><div id="popup-last-payment" class="ecomfy-account-value">—</div></div><div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px"><div class="ecomfy-account-label">Próximo pagamento</div><div id="popup-next-payment" class="ecomfy-account-value">—</div></div></div><div id="popup-cycle-status" class="ecomfy-account-status"></div>';
    var sections=body.querySelectorAll('.ecomfy-account-section');if(sections.length>=2)body.insertBefore(sec,sections[sections.length-1]);else body.appendChild(sec);
  }
  async function validate(){
    if(!window.ecomfySupabase)return null;
    try{
      var session=(await window.ecomfySupabase.auth.getSession()).data.session;if(!session)return null;
      var r=await fetch(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'}});
      return await r.json().catch(function(){return null;});
    }catch(e){console.warn('Validação de assinatura indisponível.',e);return null;}
  }
  async function refresh(){
    var data=await validate();if(!data)return;
    window.ecomfySubscription=data;
    var plan=data.plan||'free';
    var planEl=document.getElementById('popup-plan');if(planEl)planEl.textContent=plan.toUpperCase();
    if(plan==='premium'){
      ensureFields();
      var last=document.getElementById('popup-last-payment'),next=document.getElementById('popup-next-payment');
      if(last)last.textContent=formatDate(data.last_payment_at||data.next_payment_date&&new Date(new Date(data.next_payment_date).setMonth(new Date(data.next_payment_date).getMonth()-1)).toISOString());
      if(next)next.textContent=formatDate(data.next_payment_date);
      var st=document.getElementById('popup-cycle-status');if(st)st.textContent='Assinatura Premium ativa.';
    }else{
      document.getElementById('popup-subscription-cycle')?.remove();
    }
    window.dispatchEvent(new CustomEvent('ecomfy-subscription-ready',{detail:data}));
  }
  function waitForPopup(){ensureFields();}
  window.ecomfyRefreshSubscription=refresh;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForPopup);else waitForPopup();
  var obs=new MutationObserver(function(){if(document.getElementById('ecomfy-account-popup'))ensureFields();});obs.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('ecomfy-auth-ready',refresh);
})();

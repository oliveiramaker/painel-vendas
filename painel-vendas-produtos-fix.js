/* Ecomfy - correcao do Order All: SKU real e quantidade por linha */
(function(){
'use strict';
if(!/painel-vendas\.html$/i.test(location.pathname))return;
function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function fix(){
  var d=window.__ecomfyProduction;
  if(!d||!Array.isArray(d.rs)||!d.rs.length||!d.m)return false;
  var h=d.rs[0].map(norm);
  var sku=h.findIndex(function(x){return x==='numero de referencia sku'||x==='n de referencia sku'||x==='numero referencia sku';});
  var qty=h.findIndex(function(x){return x==='quantidade'||x==='qtd';});
  if(sku<0||qty<0)return false;
  var changed=d.m.sku!==sku||d.m.qty!==qty;
  d.m.sku=sku;
  d.m.qty=qty;
  d.__skuQtyCorrected=true;
  if(changed){
    var trigger=document.getElementById('production-start');
    if(trigger)trigger.dispatchEvent(new Event('change',{bubbles:true}));
  }
  var status=document.getElementById('production-status');
  if(status&&changed){status.textContent='Order All corrigido: SKU pela coluna Numero de referencia SKU e quantidade pela coluna Quantidade.';status.style.color='var(--text-dim)';}
  return true;
}
var tries=0;
function boot(){if(fix())return;if(tries++<120)setTimeout(boot,250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
var s=document.createElement('script');
s.id='ecomfy-products-table-fix';
s.src='painel-vendas-produtos-table-fix.js';
s.async=false;
document.head.appendChild(s);
var h=document.createElement('script');
h.id='ecomfy-sales-time';
h.src='painel-vendas-horarios.js';
h.async=false;
document.head.appendChild(h);
})();

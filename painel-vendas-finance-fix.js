/* Ecomfy — Correção da conciliação: descontos reduzem a renda líquida */
(function(){
'use strict';
if(!/painel-vendas\.html$/i.test(location.pathname))return;
function money(v){
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  var s=String(v??'').trim();
  if(!s)return 0;
  var neg=/^\s*-|\(.*\)/.test(s);
  var n=parseFloat(s.replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'));
  return Number.isFinite(n)?(neg?-Math.abs(n):n):0;
}
function brl(n){return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function fix(){
  var table=document.querySelector('#tblConciliacao');
  if(!table||!table.tBodies.length)return false;
  var heads=[...table.querySelectorAll('thead th')].map(function(x){return norm(x.textContent)});
  var netIdx=heads.findIndex(function(x){return x.includes('renda liquida')||x.includes('valor liquido')||x==='liquido'||x.includes('liquido a receber')||x.includes('renda estimada')});
  var discountIdx=heads.findIndex(function(x){return x.includes('desconto')||x.includes('cupom')||x.includes('descontos')});
  if(netIdx<0||discountIdx<0)return false;
  var changed=0;
  [...table.tBodies[0].rows].forEach(function(tr){
    var c=tr.children;
    if(c.length<=Math.max(netIdx,discountIdx))return;
    var current=money(c[netIdx].textContent);
    var discount=Math.abs(money(c[discountIdx].textContent));
    if(!discount)return;
    /* O valor líquido exibido pelo painel ainda está antes do desconto do produto.
       A correção deve subtrair exatamente o desconto identificado naquele pedido. */
    var expected=current-discount;
    if(Math.abs(current-expected)>0.009){
      c[netIdx].textContent=brl(expected);
      c[netIdx].setAttribute('data-ecomfy-corrected','1');
      c[netIdx].title='Renda líquida corrigida: valor líquido original − desconto';
      changed++;
    }
  });
  if(changed){
    var total=0;
    [...table.tBodies[0].rows].forEach(function(r){var cell=r.children[netIdx];if(cell)total+=money(cell.textContent);});
    var finance=[...document.querySelectorAll('#tblFinanceiro tbody tr')];
    finance.forEach(function(tr){
      var c=tr.children;if(c.length<2)return;
      var label=norm(c[0].textContent);
      if(label.includes('renda estimada')||label.includes('renda liquida'))c[1].textContent=brl(total);
    });
    var center=document.querySelector('#decision-center');
    if(center){
      [...center.querySelectorAll('.bridge>div')].forEach(function(row){
        var label=norm(row.children[0]?.textContent);
        if(label.includes('renda estimada pelo relatorio')){var b=row.querySelector('b');if(b)b.textContent=brl(total);}
      });
    }
  }
  return true;
}
function observe(){
  if(fix())return;
  var mo=new MutationObserver(function(){if(fix())mo.disconnect();});
  mo.observe(document.body,{childList:true,subtree:true});
  setTimeout(function(){mo.disconnect();fix();},10000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();

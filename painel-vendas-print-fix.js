/* Ecomfy — Impressão da relação de produção em janela própria */
(function(){
'use strict';
if(!/painel-vendas\.html$/i.test(location.pathname))return;
function esc(s){return String(s??'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
function printProduction(){
  var sec=document.getElementById('production-sales');
  var table=sec?.querySelector('.production-table');
  if(!table){alert('Gere a relação de produtos antes de imprimir.');return;}
  var start=document.getElementById('production-start')?.value||'';
  var end=document.getElementById('production-end')?.value||'';
  var period=(start&&end)?new Date(start+'T12:00:00').toLocaleDateString('pt-BR')+' a '+new Date(end+'T12:00:00').toLocaleDateString('pt-BR'):'Período selecionado';
  var rows=[...table.querySelectorAll('tbody tr')].map(function(tr){return '<tr>'+[...tr.children].map(function(td){return '<td>'+esc(td.textContent.trim())+'</td>';}).join('')+'</tr>';}).join('');
  var heads=[...table.querySelectorAll('thead th')].map(function(th){return '<th>'+esc(th.textContent.trim())+'</th>';}).join('');
  var total=document.getElementById('production-total')?.textContent||'0';
  var items=document.getElementById('production-items')?.textContent||'0';
  var orders=document.getElementById('production-orders')?.textContent||'0';
  var w=window.open('','_blank','width=1000,height=750');
  if(!w){alert('O navegador bloqueou a janela de impressão. Permita pop-ups para o Ecomfy e tente novamente.');return;}
  w.document.open();
  w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relação de produção — Ecomfy</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;margin:0;font-size:10px}h1{font-size:20px;margin:0 0 3px}h2{font-size:12px;margin:0 0 14px;color:#555;font-weight:normal}.brand{font-size:12px;font-weight:800;margin-bottom:14px}.brand span{color:#2563eb}.meta{display:flex;gap:24px;margin:0 0 14px;padding:9px 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd}.meta b{display:block;font-size:14px;margin-top:2px}.meta span{font-size:8px;color:#666;text-transform:uppercase}table{border-collapse:collapse;width:100%;table-layout:auto}th,td{border-bottom:1px solid #ddd;padding:7px 6px;text-align:left;vertical-align:top}th{background:#f3f4f6;font-size:8px;text-transform:uppercase}td:nth-child(1){width:28px}td:nth-child(5),td:nth-child(6){text-align:right;white-space:nowrap;font-weight:700}tfoot td{font-weight:800;border-top:1px solid #999}footer{margin-top:18px;color:#666;font-size:8px} .no-print{display:none}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="brand"><span>e</span>comfy — Planejamento de produção</div><h1>Relação de produtos mais vendidos</h1><h2>'+esc(period)+'</h2><div class="meta"><div><span>Unidades físicas estimadas</span><b>'+esc(total)+'</b></div><div><span>SKUs/produtos</span><b>'+esc(items)+'</b></div><div><span>Pedidos considerados</span><b>'+esc(orders)+'</b></div></div><table><thead><tr>'+heads+'</tr></thead><tbody>'+rows+'</tbody></table><footer>Relatório gerado pelo Ecomfy a partir do Order All da Shopee. Pedidos não pagos, cancelados, reembolsados e devolvidos são excluídos conforme a análise do painel.</footer><script>window.addEventListener("load",function(){setTimeout(function(){window.print();},250);});</script></body></html>');
  w.document.close();
}
function wire(){
  document.addEventListener('click',function(e){
    var b=e.target.closest?.('#production-print');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();printProduction();
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();

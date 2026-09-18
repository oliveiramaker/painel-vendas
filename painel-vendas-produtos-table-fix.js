/* Ecomfy — correção da tabela principal de produtos
   O Order All possui "Nº de referência do SKU principal" e "Número de referência SKU".
   A tabela principal deve usar o SKU da linha/variação e nunca transformar produtos
   diferentes em um único grupo "(Sem SKU)".
*/
(function(){
'use strict';
if(!/painel-vendas\.html$/i.test(location.pathname))return;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const money=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;let s=String(v??'').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');let n=parseFloat(s);return Number.isFinite(n)?n:0;};
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function date(v){
 if(v instanceof Date&&!isNaN(v))return new Date(v.getFullYear(),v.getMonth(),v.getDate());
 if(typeof v==='number'&&v>20000&&typeof XLSX!=='undefined'){const x=XLSX.SSF.parse_date_code(v);if(x)return new Date(x.y,x.m-1,x.d);}
 const s=String(v??'').trim();let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]);}
 m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);return null;
}
function validStatus(v){return !/(nao pago|não pago|cancelado|cancelada|reembolsado|reembolsada|devolvido|devolvida)/i.test(norm(v));}
function find(h,arr){for(const x of arr){const i=h.findIndex(v=>norm(v)===norm(x));if(i>=0)return i;}return -1;}
function build(){
 const d=window.__ecomfyProduction;if(!d||!d.rs||!d.rs.length||!d.m)return false;
 const table=document.getElementById('tblProdutos');if(!table)return false;
 const h=d.rs[0].map(norm);
 const sku=find(h,['Número de referência SKU','Numero de referencia SKU','Nº de referência SKU','Nº de referencia SKU','Referência SKU','Referencia SKU']);
 const qty=find(h,['Quantidade','Qtd']);
 const name=find(h,['Nome do Produto','Nome do produto','Produto']);
 const variation=find(h,['Nome da variação','Nome da variacao','Variação','Variacao']);
 const order=find(h,['ID do pedido','Número do pedido','Numero do pedido','Order ID']);
 const status=find(h,['Status do pedido','Status do Pedido','Status']);
 const subtotal=find(h,['Subtotal do produto','Subtotal do Produto']);
 const total=find(h,['Valor Total','Valor total']);
 const created=find(h,['Data de criação do pedido','Data de criacao do pedido','Data do pedido']);
 if(sku<0||qty<0||name<0)return false;
 const start=document.getElementById('production-start')?.value;
 const end=document.getElementById('production-end')?.value;
 const sd=start?date(start):null,ed=end?date(end):null;
 const groups=new Map();
 d.rs.slice(1).forEach((r,i)=>{
   if(status>=0&&!validStatus(r[status]))return;
   const dt=created>=0?date(r[created]):null;
   if(sd&&(!dt||dt<sd))return;if(ed&&(!dt||dt>ed))return;
   const s=String(r[sku]??'').trim(), n=String(r[name]??'').trim(), v=variation>=0?String(r[variation]??'').trim():'';
   const q=money(r[qty]);if(q<=0)return;
   /* Nunca usar SKU vazio como chave única. Produto + variação identifica a linha. */
   const key=s?`SKU|${s}|${v}`:`NOSKU|${n}|${v}`;
   let g=groups.get(key);if(!g)groups.set(key,g={sku:s,name:n,variation:v,qty:0,revenue:0,orders:new Set()});
   g.qty+=q;
   g.revenue+=money(r[subtotal>=0?subtotal:total]);
   if(order>=0&&String(r[order]??'').trim())g.orders.add(String(r[order]).trim());
 });
 if(!groups.size)return false;
 const rows=[...groups.values()].sort((a,b)=>b.qty-a.qty||a.name.localeCompare(b.name,'pt-BR'));
 const tbody=table.tBodies[0];if(!tbody)return false;
 const oldRows=[...tbody.rows];
 /* Só corrige a tabela quando existe o agrupamento incorreto "Sem SKU".
    Assim, CMV/margem das linhas já calculadas pelo painel continuam intactos. */
 const hasBad=oldRows.some(tr=>/sem sku/i.test(tr.textContent||''));
 if(!hasBad)return false;
 const headers=[...table.querySelectorAll('thead th')].map(x=>norm(x.textContent));
 const template=oldRows.find(tr=>!/^\s*\(?(sem sku|—|-)?\)?\s*$/i.test(tr.cells[0]?.textContent||''))||oldRows[0];
 if(!template)return false;
 tbody.innerHTML='';
 function setCell(c,text){if(c)c.textContent=text;}
 rows.forEach(g=>{
   const tr=template.cloneNode(true),cells=[...tr.cells];
   headers.forEach((head,idx)=>{
     const c=cells[idx];if(!c)return;
     if(head==='sku'||head.includes('sku'))setCell(c,g.sku||'—');
     else if(head.includes('produto')&&!head.includes('variacao')&&!head.includes('variação'))setCell(c,g.name||'—');
     else if(head.includes('variacao')||head.includes('variação'))setCell(c,g.variation||'—');
     else if(head==='qtd'||head.includes('quantidade'))setCell(c,g.qty.toLocaleString('pt-BR'));
     else if(head.includes('receita')||head.includes('faturamento')||head.includes('valor vendido'))setCell(c,brl(g.revenue));
     else if(head.includes('pedido')||head.includes('pedidos'))setCell(c,g.orders.size.toLocaleString('pt-BR'));
     else if(head.includes('cmv')||head.includes('margem'))setCell(c,'—');
   });
   tr.dataset.ecomfyCorrected='1';
   tbody.appendChild(tr);
 });
 let note=table.parentElement?.querySelector('.ecomfy-products-correction-note');
 if(!note){note=document.createElement('div');note.className='ecomfy-products-correction-note';note.style.cssText='margin-top:8px;padding:9px 11px;border-radius:7px;background:var(--blue-light);color:var(--text-dim);font-size:11px;line-height:1.45';table.parentElement?.appendChild(note);}
 note.textContent='Tabela corrigida pelo Order All: SKU usa “Número de referência SKU”; SKU vazio é separado por produto + variação. “Número de produtos pedidos” não é somado por linha.';
 return true;
}
let tries=0;
function boot(){if(build())return;if(tries++<160)setTimeout(boot,250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

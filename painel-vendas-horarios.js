/* Ecomfy — análise de vendas por dia da semana e hora */
(function(){
'use strict';
if(!/painel-vendas\.html$/i.test(location.pathname))return;

var DAYS=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
var SHORT=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
var state={data:null,start:null,end:null};

function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function validStatus(v){return !/(nao pago|não pago|cancelado|cancelada|reembolsado|reembolsada|devolvido|devolvida)/i.test(norm(v));}
function parseDateTime(v){
  if(v instanceof Date&&!isNaN(v.getTime()))return new Date(v.getTime());
  if(typeof v==='number'&&v>20000&&typeof XLSX!=='undefined'){
    var x=XLSX.SSF.parse_date_code(v);
    if(x)return new Date(x.y,x.m-1,x.d,x.H||0,x.M||0,x.S||0);
  }
  var s=String(v??'').trim();
  if(!s)return null;
  var m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+|T)?(\d{1,2})?(?::(\d{2}))?(?::(\d{2}))?/);
  if(m){var y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0));}
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));
  var d=new Date(s);return isNaN(d.getTime())?null:d;
}
function isoDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function money(v){var n=Number(v);if(Number.isFinite(n))return n;return 0;}
function findCol(h,exact,contains){
  var i=h.findIndex(function(x){return exact.some(function(n){return norm(x)===norm(n);});});
  if(i>=0)return i;
  return h.findIndex(function(x){return contains.some(function(n){return norm(x).includes(norm(n));});});
}
function mapHeaders(rs){
  var h=rs[0]||[];
  return {
    date:findCol(h,['Data de criação do pedido','Data de criacao do pedido','Data do pedido','Data de criação'],['data de criacao','data do pedido']),
    order:findCol(h,['ID do pedido','Número do pedido','Numero do pedido','Order ID'],['id do pedido','numero do pedido']),
    status:findCol(h,['Status do Pedido','Status do pedido','Status'],['status do pedido','status'])
  };
}
function getRows(){
  var d=window.__ecomfyProduction;
  if(!d||!Array.isArray(d.rs)||d.rs.length<2)return null;
  var m=d.m||mapHeaders(d.rs), h=d.rs[0]||[];
  if(m.date<0||m.order<0){var fresh=mapHeaders(d.rs);m.date=fresh.date;m.order=fresh.order;m.status=fresh.status;}
  if(m.date<0)return null;
  var rows=[];
  d.rs.slice(1).forEach(function(r,idx){
    var dt=parseDateTime(r[m.date]);
    if(!dt||isNaN(dt.getTime()))return;
    var status=m.status>=0?String(r[m.status]??''):'';
    if(!validStatus(status))return;
    var order=m.order>=0?String(r[m.order]??'').trim():'';
    rows.push({dt:dt,order:order||'__linha_'+idx});
  });
  return rows;
}
function dateBounds(rows){
  if(!rows.length)return null;
  var min=new Date(Math.min.apply(null,rows.map(function(r){return r.dt.getTime();})));
  var max=new Date(Math.max.apply(null,rows.map(function(r){return r.dt.getTime();})));
  return {min:new Date(min.getFullYear(),min.getMonth(),min.getDate()),max:new Date(max.getFullYear(),max.getMonth(),max.getDate())};
}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function fmt(n){return Number(n||0).toLocaleString('pt-BR');}
function esc(s){return String(s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function addStyles(){
 if(document.getElementById('sales-time-style'))return;
 var s=document.createElement('style');s.id='sales-time-style';s.textContent=`
#sales-time-panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}
.sales-time-head{padding:22px 24px;border-bottom:1px solid var(--border)}
.sales-time-title{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}.sales-time-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--blue);font-weight:800}.sales-time-head h2{margin:4px 0 6px;font-size:18px}.sales-time-help{margin:0;color:var(--text-dim);font-size:12px;line-height:1.5;max-width:820px}.sales-time-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:16px}.sales-time-field{display:grid;gap:5px}.sales-time-field label{font-size:10px;color:var(--text-dim);font-weight:700}.sales-time-field input{height:35px;padding:0 9px;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:7px;font:600 12px Inter,system-ui,sans-serif}.sales-time-btn{height:35px;padding:0 12px;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:7px;font-weight:800;cursor:pointer}.sales-time-btn.primary{background:var(--blue);border-color:var(--blue);color:#fff}.sales-time-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 24px;background:var(--bg);border-bottom:1px solid var(--border)}.sales-time-stat{min-width:0}.sales-time-stat span{display:block;color:var(--text-dim);font-size:10px}.sales-time-stat b{display:block;font-size:16px;margin-top:4px}.sales-time-stat small{display:block;color:var(--text-faint);font-size:10px;margin-top:2px}.sales-time-note{margin:18px 24px 0;padding:11px 13px;background:var(--bg);border-left:3px solid var(--blue);color:var(--text-dim);font-size:11px;line-height:1.5;border-radius:5px}.sales-time-grid-wrap{overflow-x:auto;padding:18px 24px 8px}.sales-time-grid{display:grid;grid-template-columns:112px repeat(24,minmax(31px,1fr)) 48px;min-width:980px;gap:0;align-items:center}.sales-time-corner,.sales-time-hour,.sales-time-day,.sales-time-total{font-size:10px;color:var(--text-dim)}.sales-time-hour{text-align:center;padding-bottom:7px;font-family:'IBM Plex Mono',monospace}.sales-time-day{padding-right:10px}.sales-time-total{text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:700}.sales-time-cell{height:30px;margin:3px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 9px 'IBM Plex Mono',monospace;color:transparent;cursor:default;transition:transform .12s,filter .12s}.sales-time-cell:hover{transform:scale(1.2);filter:brightness(.95);color:#fff;z-index:2}.sales-time-cell[data-level="0"]{background:var(--border);opacity:.7}.sales-time-cell[data-level="1"]{background:rgba(139,92,246,.18)}.sales-time-cell[data-level="2"]{background:rgba(139,92,246,.34)}.sales-time-cell[data-level="3"]{background:rgba(139,92,246,.52)}.sales-time-cell[data-level="4"]{background:rgba(109,40,217,.78)}.sales-time-legend{display:flex;gap:14px;align-items:center;justify-content:center;padding:8px 24px 20px;color:var(--text-dim);font-size:10px}.sales-time-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:4px;vertical-align:-1px}.sales-time-empty{padding:50px 24px;text-align:center;color:var(--text-faint)}.sales-time-back{margin:0 24px 22px}@media(max-width:700px){.sales-time-summary{grid-template-columns:repeat(2,1fr);padding:15px}.sales-time-head{padding:18px}.sales-time-grid-wrap{padding:15px 10px 5px}.sales-time-note{margin:15px 15px 0}.sales-time-back{margin-left:15px;margin-right:15px}}
`;
 document.head.appendChild(s);
}
function ensurePanel(){
 if(document.getElementById('sales-time-panel'))return true;
 var dashboard=document.getElementById('dashboard');var overview=document.getElementById('panel-overview');if(!dashboard||!overview)return false;
 addStyles();
 var panel=document.createElement('section');panel.id='sales-time-panel';panel.style.display='none';
 panel.innerHTML=`<div class="sales-time-head"><div class="sales-time-title"><div><div class="sales-time-eyebrow">Comportamento de vendas</div><h2>Vendas por dia e horário</h2><p class="sales-time-help">Veja em quais dias da semana e horários as vendas mais se concentram. Cada ponto representa a quantidade de pedidos registrados naquele cruzamento de dia e hora dentro do período selecionado.</p></div><button class="sales-time-btn" id="sales-time-back-top">← Voltar ao painel</button></div><div class="sales-time-controls"><div class="sales-time-field"><label>Data inicial</label><input type="date" id="sales-time-start"></div><div class="sales-time-field"><label>Data final</label><input type="date" id="sales-time-end"></div><button class="sales-time-btn primary" id="sales-time-apply">Atualizar análise</button></div></div><div id="sales-time-content"><div class="sales-time-empty">Carregue um Order All para gerar a análise.</div></div>`;
 dashboard.appendChild(panel);
 var tabs=document.getElementById('sales-time-tabs');
 if(!tabs){tabs=document.createElement('div');tabs.id='sales-time-tabs';tabs.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px';overview.parentNode.insertBefore(tabs,overview);}
 var btn=document.createElement('button');btn.id='sales-time-tab';btn.className='sales-time-btn';btn.textContent='◷ Dia e horário';tabs.appendChild(btn);
 function showPanel(){
   Array.from(dashboard.children).forEach(function(el){if(el===tabs||el===panel)return;el.style.display='none';});
   tabs.style.display='flex';panel.style.display='block';btn.classList.add('primary');render();
   window.scrollTo({top:0,behavior:'smooth'});
 }
 function showOverview(){
   Array.from(dashboard.children).forEach(function(el){if(el!==tabs&&el!==panel)el.style.display='';});
   panel.style.display='none';btn.classList.remove('primary');
 }
 btn.addEventListener('click',showPanel);panel.querySelector('#sales-time-back-top').addEventListener('click',showOverview);
 panel.querySelector('#sales-time-apply').addEventListener('click',render);
 return true;
}
function setDefaults(rows){
 var b=dateBounds(rows);if(!b)return;
 var st=document.getElementById('sales-time-start'),en=document.getElementById('sales-time-end');if(!st||!en)return;
 if(!st.value)st.value=isoDate(b.min);if(!en.value)en.value=isoDate(b.max);
 state.start=st.value;state.end=en.value;
}
function render(){
 var panel=document.getElementById('sales-time-panel');if(!panel)return;
 var rows=getRows();if(!rows){document.getElementById('sales-time-content').innerHTML='<div class="sales-time-empty">Importe o Order All no painel para gerar esta análise.</div>';return;}
 state.data=rows;setDefaults(rows);
 var st=document.getElementById('sales-time-start').value,en=document.getElementById('sales-time-end').value;
 var start=st?new Date(st+'T00:00:00'):null,end=en?new Date(en+'T23:59:59'):null;
 var filtered=rows.filter(function(r){return (!start||r.dt>=start)&&(!end||r.dt<=end);});
 var cells=Array.from({length:7},function(){return Array(24).fill(0);});
 var seen=new Set();
 filtered.forEach(function(r){var key=r.order+'|'+r.dt.getFullYear()+'-'+r.dt.getMonth()+'-'+r.dt.getDate()+'|'+r.dt.getHours();if(seen.has(key))return;seen.add(key);cells[r.dt.getDay()][r.dt.getHours()]++;});
 var total=cells.flat().reduce(function(a,b){return a+b;},0);
 var dayTotals=cells.map(function(r){return r.reduce(function(a,b){return a+b;},0);});
 var hourTotals=Array(24).fill(0);cells.forEach(function(r){r.forEach(function(v,h){hourTotals[h]+=v;});});
 var max=Math.max.apply(null,cells.flat().concat([0]));
 var topDay=dayTotals.indexOf(Math.max.apply(null,dayTotals));
 var bestStart=0,bestVal=-1;
 for(var h=0;h<24;h++){var sum=0;for(var j=0;j<6;j++)sum+=hourTotals[(h+j)%24];if(sum>bestVal){bestVal=sum;bestStart=h;}}
 var bestEnd=(bestStart+6)%24;
 var daysCount=start&&end?Math.max(1,Math.floor((new Date(end.getFullYear(),end.getMonth(),end.getDate())-new Date(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1):1;
 var avg=(total/daysCount);
 var levels=function(v){if(!v)return 0;var ratio=max? v/max:0;return ratio<=.25?1:ratio<=.5?2:ratio<=.75?3:4;};
 var html='<div class="sales-time-summary"><div class="sales-time-stat"><span>Número de vendas totais</span><b>'+fmt(total)+'</b><small>Pedidos únicos no período</small></div><div class="sales-time-stat"><span>Venda média diária</span><b>'+fmt(avg.toFixed(1))+'</b><small>'+fmt(daysCount)+' dias analisados</small></div><div class="sales-time-stat"><span>Dia com mais vendas</span><b>'+esc(DAYS[topDay])+'</b><small>'+fmt(dayTotals[topDay])+' vendas</small></div><div class="sales-time-stat"><span>Intervalo de 6 horas com mais vendas</span><b>Das '+String(bestStart).padStart(2,'0')+':00 às '+String(bestEnd).padStart(2,'0')+':00</b><small>'+fmt(bestVal)+' vendas</small></div></div>';
 html+='<div class="sales-time-note">O período selecionado é usado diretamente nesta matriz. Se o período tiver várias semanas, os totais mostram todas as vendas registradas em cada combinação de dia da semana e hora. Um pedido com várias linhas no Order All conta apenas uma vez.</div>';
 html+='<div class="sales-time-grid-wrap"><div class="sales-time-grid"><div class="sales-time-corner"></div>';
 for(var hh=0;hh<24;hh++)html+='<div class="sales-time-hour">'+String(hh).padStart(2,'0')+'</div>';
 html+='<div class="sales-time-hour">Total</div>';
 for(var d=0;d<7;d++){
   html+='<div class="sales-time-day">'+SHORT[d]+'</div>';
   for(var hr=0;hr<24;hr++){var v=cells[d][hr];html+='<div class="sales-time-cell" data-level="'+levels(v)+'" title="'+esc(DAYS[d]+' às '+String(hr).padStart(2,'0')+':00 — '+v+' venda(s)')+'">'+(v?fmt(v):'')+'</div>';}
   html+='<div class="sales-time-total">'+fmt(dayTotals[d])+'</div>';
 }
 html+='</div></div><div class="sales-time-legend"><span><i class="sales-time-dot" style="background:var(--border)"></i>Sem vendas</span><span><i class="sales-time-dot" style="background:rgba(139,92,246,.18)"></i>Baixa</span><span><i class="sales-time-dot" style="background:rgba(139,92,246,.52)"></i>Média</span><span><i class="sales-time-dot" style="background:rgba(109,40,217,.78)"></i>Alta</span></div><button class="sales-time-btn sales-time-back" id="sales-time-back-bottom">← Voltar ao painel</button>';
 document.getElementById('sales-time-content').innerHTML=html;
 document.getElementById('sales-time-back-bottom').addEventListener('click',function(){var b=document.getElementById('sales-time-tab');if(b)b.click();});
}
function boot(){if(!ensurePanel()){setTimeout(boot,300);return;}var rows=getRows();if(rows)setDefaults(rows);render();}
var tries=0;function wait(){if(document.getElementById('dashboard')&&document.getElementById('panel-overview')){boot();return;}if(tries++<100)setTimeout(wait,250);} 
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
setInterval(function(){var d=window.__ecomfyProduction;if(d&&d!==state.source){state.source=d;var rows=getRows();if(rows){setDefaults(rows);if(document.getElementById('sales-time-panel')?.style.display!=='none')render();}}},1000);
})();

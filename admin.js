(function(){
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const errorBox=$('#admin-error');
  function showError(msg){if(errorBox){errorBox.textContent=msg;errorBox.classList.remove('hidden');}}
  function clearError(){if(errorBox){errorBox.classList.add('hidden');errorBox.textContent='';}}
  function badge(plan){return plan==='premium'?'<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-3 py-1 text-xs font-bold"><i class="fa-solid fa-crown"></i> Premium</span>':'<span class="inline-flex items-center gap-1 rounded-full bg-zinc-700 text-zinc-300 px-3 py-1 text-xs font-bold">Free</span>';}
  function showAdminContent(){var c=$('#admin-content');var l=$('#admin-loading');if(c)c.style.display='block';if(l)l.style.display='none';}
  async function load(){
    clearError();
    const body=$('#users'); body.innerHTML='<tr><td colspan="5" class="px-5 py-10 text-center text-zinc-500">Carregando contas...</td></tr>';
    try{
      const {data,error}=await window.ecomfySupabase.rpc('admin_list_users');
      if(error) throw error;
      const rows=data||[];
      $('#summary').textContent=`${rows.length} contas • ${rows.filter(x=>x.plan==='premium').length} Premium • ${rows.filter(x=>x.plan==='free').length} Free`;
      body.innerHTML=rows.map(u=>`<tr class="border-b border-zinc-800/80 last:border-0"><td class="px-5 py-4"><div class="font-semibold">${esc(u.full_name||'Sem nome')}</div><div class="text-xs text-zinc-500">${esc(u.id)}</div></td><td class="px-5 py-4 text-zinc-400">${esc(u.email||'—')}</td><td class="px-5 py-4">${badge(u.plan)}</td><td class="px-5 py-4">${u.is_admin?'<span class="text-blue-400 font-semibold"><i class="fa-solid fa-shield-halved mr-1"></i>Administrador</span>':'<span class="text-zinc-500">Cliente</span>'}</td><td class="px-5 py-4 text-right">${u.is_admin?'<span class="text-xs font-semibold text-emerald-400">Premium permanente</span>':`<select data-user="${esc(u.id)}" class="plan-select bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm"><option value="free" ${u.plan==='free'?'selected':''}>Free</option><option value="premium" ${u.plan==='premium'?'selected':''}>Premium</option></select>`}</td></tr>`).join('');
      document.querySelectorAll('.plan-select').forEach(s=>s.addEventListener('change',changePlan));
    }catch(e){body.innerHTML='';showError(e.message||'Não foi possível carregar as contas.');}
  }
  async function changePlan(e){
    const select=e.currentTarget, userId=select.dataset.user, plan=select.value;
    select.disabled=true;
    try{
      const {error}=await window.ecomfySupabase.rpc('admin_set_plan',{target_user_id:userId,new_plan:plan});
      if(error) throw error;
      await load();
    }catch(err){showError(err.message||'Não foi possível alterar o plano.');await load();}
    finally{select.disabled=false;}
  }
  async function init(){
    if(!window.ecomfySupabase||!window.ecomfyRequireAuth)return;
    const session=await window.ecomfyRequireAuth();
    if(!session)return;
    try{
      const {data:p,error}=await window.ecomfySupabase.from('profiles').select('is_admin').eq('id',session.user.id).single();
      if(error||!p?.is_admin){location.replace('app.html');return;}
      showAdminContent();
      $('#refresh').addEventListener('click',load); await load();
    }catch(e){location.replace('app.html');}
  }
  window.addEventListener('ecomfy-auth-ready',init,{once:true});
  if(document.readyState!=='loading')init();
  else document.addEventListener('DOMContentLoaded',init,{once:true});
})();

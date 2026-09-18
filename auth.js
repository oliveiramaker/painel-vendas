/* Autenticação Ecomfy com Supabase Auth — login exclusivo com Google */
(function(){
const branding=document.createElement('link');branding.rel='stylesheet';branding.href='branding.css';document.head.appendChild(branding);
const url=window.ECOMFY_SUPABASE_URL,key=window.ECOMFY_SUPABASE_KEY;
if(!url||!key||!window.supabase){console.error('Supabase não configurado.');return;}
const client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.ecomfySupabase=client;
const authPage=/auth\.html$/i.test(location.pathname),next=new URLSearchParams(location.search).get('next'),safeNext=next&&next.startsWith('/')&&!next.startsWith('//')?next:'app.html';
const $=id=>document.getElementById(id);
const setStatus=(m,t='info')=>{const e=$('auth-status');if(!e)return;e.textContent=m||'';e.className=`auth-status ${t}`;e.hidden=!m};
const setLoading=l=>document.querySelectorAll('[data-auth-submit]').forEach(b=>{b.disabled=l;b.classList.toggle('opacity-60',l)});
async function loadPremium(){if(window.__ecomfyPremiumLoaded)return;window.__ecomfyPremiumLoaded=true;const s=document.createElement('script');s.src='premium.js';s.defer=true;document.head.appendChild(s);}
async function loadSubscriptionUI(){if(window.__ecomfySubscriptionUILoaded)return;window.__ecomfySubscriptionUILoaded=true;const s=document.createElement('script');s.src='subscription-ui.js';s.defer=true;document.head.appendChild(s);}
async function redirectIfAuthenticated(){const{data:{session}}=await client.auth.getSession();if(authPage&&session)location.replace(safeNext);return session;}
async function requireAuthentication(){const{data:{session}}=await client.auth.getSession();if(!session){const target=location.pathname+location.search+location.hash;location.replace(`auth.html?next=${encodeURIComponent(target)}`);return null;}loadPremium();await loadSubscriptionUI();window.dispatchEvent(new CustomEvent('ecomfy-auth-ready',{detail:session}));return session;}
window.ecomfyRequireAuth=requireAuthentication;
function notifyExistingSession(session){if(!session||authPage)return;loadPremium();loadSubscriptionUI();window.dispatchEvent(new CustomEvent('ecomfy-auth-ready',{detail:session}));}
client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&!authPage)location.replace('auth.html');if(event==='SIGNED_IN'&&authPage)location.replace(safeNext);if(session&&!authPage){notifyExistingSession(session);}});
if(!authPage){
  if(location.pathname.endsWith('/index.html')||location.pathname.endsWith('/')){
    client.auth.getSession().then(({data:{session}})=>{if(session){const b=$('auth-user-btn');if(b)b.classList.remove('hidden');const l=$('auth-user-label');if(l)l.textContent=session.user?.user_metadata?.full_name||session.user?.email?.split('@')[0]||'Minha conta';}});
  }
  const logout=$('logout-btn')||$('auth-user-btn');
  logout?.addEventListener('click',async()=>{logout.disabled=true;await client.auth.signOut();location.replace('auth.html');});
  // Páginas públicas como planos.html devem preservar a sessão existente.
  // Apenas avisamos os módulos de checkout/assinatura que o usuário já está logado;
  // nunca redirecionamos um usuário autenticado para auth.html ou app.html.
  client.auth.getSession().then(({data:{session}})=>{if(session)notifyExistingSession(session);});
  return;
}
redirectIfAuthenticated();
$('google-login')?.addEventListener('click',async()=>{setLoading(true);setStatus('Abrindo login do Google...');const{error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/auth.html`}});if(error){setLoading(false);setStatus('Não foi possível iniciar o login com Google. Tente novamente.','error');}});
})();

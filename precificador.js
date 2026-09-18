// ── PRECIFICADOR MULTIPLATAFORMA ─────────────
const TEXTOS_PLATAFORMA = {
  shopee: {
    titulo: 'Precificador Shopee',
    subtitulo: 'Calcule comissão, imposto e lucro para CNPJ e CPF — 2026'
  },
  tiktok: {
    titulo: 'Precificador TikTok Shop',
    subtitulo: 'Calcule as tarifas do TikTok Shop com base nas regras vigentes'
  },
  mercadolivre: {
    titulo: 'Simulador de Custos Mercado Livre',
    subtitulo: 'Consulte os custos diretamente no simulador oficial do Mercado Livre'
  }
};

function switchPlataforma(plataforma) {
  ['shopee', 'tiktok', 'mercadolivre'].forEach(p => {
    const btn = document.getElementById('plataforma-' + p);
    const card = document.getElementById('card-' + p);
    if (!btn || !card) return;
    if (p === plataforma) {
      btn.classList.add('plataforma-ativa');
      btn.classList.remove('text-zinc-400');
      card.classList.remove('hidden');
      // reinicia a animação de entrada do card
      card.classList.remove('platform-card-animate');
      void card.offsetWidth; // força reflow para reiniciar o keyframe
      card.classList.add('platform-card-animate');
    } else {
      btn.classList.remove('plataforma-ativa');
      btn.classList.add('text-zinc-400');
      card.classList.add('hidden');
    }
  });

  const textos = TEXTOS_PLATAFORMA[plataforma];
  if (textos) {
    document.getElementById('titulo-plataforma').textContent = textos.titulo;
    document.getElementById('subtitulo-plataforma').textContent = textos.subtitulo;
  }
}

// ── TIKTOK SHOP ───────────────────────────────
function calcularTikTok() {
  const custo = parseFloat(document.getElementById('tt-custo').value) || 0;
  const preco = parseFloat(document.getElementById('tt-preco').value) || 0;
  const desconto = parseFloat(document.getElementById('tt-desconto').value) || 0;
  const impostoPct = parseFloat(document.getElementById('tt-imposto').value) || 0;
  const afiliadoPct = parseFloat(document.getElementById('tt-afiliado').value) || 0;

  if (preco <= 0) { alert("Por favor, informe o preço do produto."); return; }

  const precoAposDesconto = preco - desconto;
  const tarifaPct = precoAposDesconto < 50 ? 0.10 : 0.06;
  const tarifaFixa = precoAposDesconto < 50 ? 4 : 6;
  const tarifa = (precoAposDesconto * tarifaPct) + tarifaFixa;
  const imposto = preco * (impostoPct / 100);
  const afiliado = preco * (afiliadoPct / 100);
  const valorRecebido = preco - desconto - tarifa - imposto - afiliado;
  const lucro = valorRecebido - custo;
  const margem = preco > 0 ? (lucro / preco * 100).toFixed(1) : 0;

  montarLinhasTikTok({ preco, desconto, tarifa, imposto, afiliado, custo, lucro, margem, impostoPct });
}

function montarLinhasTikTok({ preco, desconto, tarifa, imposto, afiliado, custo, lucro, margem, impostoPct }) {
  const isPositive = lucro >= 0;
  const rows = [];
  rows.push({ label: 'Preço do Produto', value: `R$ ${preco.toFixed(2)}` });
  if (desconto > 0) rows.push({ label: 'Desconto do Vendedor', value: `- R$ ${desconto.toFixed(2)}` });
  rows.push({ label: 'Tarifa TikTok Shop', value: `- R$ ${tarifa.toFixed(2)}` });
  rows.push({ label: `Imposto (${impostoPct}%)`, value: `- R$ ${imposto.toFixed(2)}` });
  if (afiliado > 0) rows.push({ label: 'Comissão de Afiliados', value: `- R$ ${afiliado.toFixed(2)}` });
  rows.push({ label: 'Custo do Produto', value: `- R$ ${custo.toFixed(2)}` });
  const corte = rows.length;
  rows.push({ label: 'Lucro Líquido', value: `R$ ${lucro.toFixed(2)}`, accent: true });
  rows.push({ label: 'Margem de Lucro', value: `${margem}%`, accent: true });

  document.getElementById('tt-detalhes').innerHTML = rows.map((r, i) => `
    <div class="result-row flex justify-between items-center py-4 ${i >= corte ? 'border-t-2 border-zinc-700 mt-2 pt-6' : ''}">
      <span class="text-zinc-400 text-sm">${r.label}</span>
      <span class="font-bold text-base ${r.accent ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}">${r.value}</span>
    </div>
  `).join('');

  document.getElementById('tt-resultado').classList.remove('hidden');
  document.getElementById('tt-placeholder').classList.add('hidden');
}

// ── PRECIFICADOR SHOPEE ──────────────────────
let tipoVendedor = 'cnpj';
let modoCalculo = 'direto';   // 'direto' | 'reverso'
let modoLucro = 'valor';      // 'valor' | 'margem'
let modoAds = 'pct';          // 'pct' | 'valor'

// Faixas oficiais de comissão Shopee 2026 (percentual é igual para CNPJ e CPF;
// a taxa fixa por faixa só vale para CNPJ — no CPF a taxa fixa é única, por volume)
const FAIXAS_COMISSAO = [
  { min: 0,      max: 79.99,    percentual: 0.20, fixaCnpj: 4,  label: 'Até R$ 79,99' },
  { min: 79.99,  max: 99.99,    percentual: 0.14, fixaCnpj: 16, label: 'R$ 80 ~ R$ 99,99' },
  { min: 99.99,  max: 199.99,   percentual: 0.14, fixaCnpj: 20, label: 'R$ 100 ~ R$ 199,99' },
  { min: 199.99, max: 499.99,   percentual: 0.14, fixaCnpj: 26, label: 'R$ 200 ~ R$ 499,99' },
  { min: 499.99, max: Infinity, percentual: 0.14, fixaCnpj: 28, label: 'Acima de R$ 500' },
];

function switchTab(tipo) {
  tipoVendedor = tipo;
  const cnpj = document.getElementById('tab-cnpj');
  const cpf = document.getElementById('tab-cpf');
  if (tipo === 'cnpj') {
    cnpj.classList.add('tab-active'); cnpj.classList.remove('tab-inactive');
    cpf.classList.remove('tab-active'); cpf.classList.add('tab-inactive');
    document.getElementById('volume-group').classList.add('hidden');
  } else {
    cpf.classList.add('tab-active'); cpf.classList.remove('tab-inactive');
    cnpj.classList.remove('tab-active'); cnpj.classList.add('tab-inactive');
    document.getElementById('volume-group').classList.remove('hidden');
  }
  atualizarRegrasComissao();
}

function switchModo(modo) {
  modoCalculo = modo;
  const direto = document.getElementById('modo-direto-btn');
  const reverso = document.getElementById('modo-reverso-btn');
  const campoPreco = document.getElementById('campo-precoVenda');
  const campoLucro = document.getElementById('campo-lucro');
  if (modo === 'direto') {
    direto.classList.add('tab-active'); direto.classList.remove('tab-inactive');
    reverso.classList.remove('tab-active'); reverso.classList.add('tab-inactive');
    campoPreco.classList.remove('hidden');
    campoLucro.classList.add('hidden');
  } else {
    reverso.classList.add('tab-active'); reverso.classList.remove('tab-inactive');
    direto.classList.remove('tab-active'); direto.classList.add('tab-inactive');
    campoPreco.classList.add('hidden');
    campoLucro.classList.remove('hidden');
  }
}

function switchLucroModo(modo) {
  modoLucro = modo;
  const valorBtn = document.getElementById('lucro-valor-btn');
  const margemBtn = document.getElementById('lucro-margem-btn');
  const valorInput = document.getElementById('lucroValor');
  const margemInput = document.getElementById('lucroMargem');
  if (modo === 'valor') {
    valorBtn.classList.add('tab-active'); valorBtn.classList.remove('tab-inactive');
    margemBtn.classList.remove('tab-active'); margemBtn.classList.add('tab-inactive');
    valorInput.classList.remove('hidden'); margemInput.classList.add('hidden');
  } else {
    margemBtn.classList.add('tab-active'); margemBtn.classList.remove('tab-inactive');
    valorBtn.classList.remove('tab-active'); valorBtn.classList.add('tab-inactive');
    margemInput.classList.remove('hidden'); valorInput.classList.add('hidden');
  }
}

function toggleAds() {
  const checked = document.getElementById('usarAds').checked;
  document.getElementById('ads-fields').classList.toggle('hidden', !checked);
}

function switchAdsModo(modo) {
  modoAds = modo;
  const pctBtn = document.getElementById('ads-pct-btn');
  const valorBtn = document.getElementById('ads-valor-btn');
  const pctInput = document.getElementById('adsPct');
  const valorInput = document.getElementById('adsValor');
  if (modo === 'pct') {
    pctBtn.classList.add('tab-active'); pctBtn.classList.remove('tab-inactive');
    valorBtn.classList.remove('tab-active'); valorBtn.classList.add('tab-inactive');
    pctInput.classList.remove('hidden'); valorInput.classList.add('hidden');
  } else {
    valorBtn.classList.add('tab-active'); valorBtn.classList.remove('tab-inactive');
    pctBtn.classList.remove('tab-active'); pctBtn.classList.add('tab-inactive');
    valorInput.classList.remove('hidden'); pctInput.classList.add('hidden');
  }
}

function atualizarRegrasComissao() {
  const titulo = document.getElementById('regrasComissaoTitulo');
  const corpo = document.getElementById('regrasComissaoBody');
  if (tipoVendedor === 'cnpj') {
    titulo.textContent = 'Regras de Comissão CNPJ — 2026';
    corpo.innerHTML = FAIXAS_COMISSAO.map(f => `
      <div class="flex justify-between"><span>${f.label}</span><span class="text-zinc-200">${(f.percentual*100).toFixed(0)}% + R$ ${f.fixaCnpj.toFixed(2)}</span></div>
    `).join('');
  } else {
    const volumeCpf = document.getElementById('volumeCpf').value;
    const taxaFixaCpf = volumeCpf === 'alto' ? 7 : 4;
    titulo.textContent = 'Regras de Comissão CPF — 2026';
    corpo.innerHTML = FAIXAS_COMISSAO.map(f => `
      <div class="flex justify-between"><span>${f.label}</span><span class="text-zinc-200">${(f.percentual*100).toFixed(0)}% + R$ ${taxaFixaCpf.toFixed(2)}</span></div>
    `).join('');
  }
}
document.getElementById('volumeCpf').addEventListener('change', atualizarRegrasComissao);

function calcularComissaoBase(valor) {
  for (const f of FAIXAS_COMISSAO) {
    if (valor <= f.max) return f;
  }
  return FAIXAS_COMISSAO[FAIXAS_COMISSAO.length - 1];
}

function lerCustosComuns() {
  const custo = parseFloat(document.getElementById('custo').value) || 0;
  const aliquotaImposto = parseFloat(document.getElementById('aliquotaImposto').value) || 0;
  const afiliadoPct = parseFloat(document.getElementById('afiliadoPct').value) || 0;
  const volumeCpf = document.getElementById('volumeCpf').value;
  const taxaFixaCpf = volumeCpf === 'alto' ? 7 : 4;
  const usarAds = document.getElementById('usarAds').checked;
  const adsPct = usarAds && modoAds === 'pct' ? (parseFloat(document.getElementById('adsPct').value) || 0) : 0;
  const adsValor = usarAds && modoAds === 'valor' ? (parseFloat(document.getElementById('adsValor').value) || 0) : 0;
  return { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor };
}

function montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco }) {
  const isPositive = lucro >= 0;
  const rows = [];
  if (destaquePreco) rows.push({ label: 'Preço de Venda Sugerido', value: `R$ ${precoVenda.toFixed(2)}`, accent: true, destaque: true });
  else rows.push({ label: 'Preço de Venda', value: `R$ ${precoVenda.toFixed(2)}` });
  rows.push({ label: 'Comissão Shopee', value: `- R$ ${comissaoTotal.toFixed(2)}` });
  rows.push({ label: `Imposto (${aliquotaImposto}%)`, value: `- R$ ${imposto.toFixed(2)}` });
  if (afiliado > 0) rows.push({ label: 'Comissão de Afiliados', value: `- R$ ${afiliado.toFixed(2)}` });
  if (ads > 0) rows.push({ label: 'Custo com Ads', value: `- R$ ${ads.toFixed(2)}` });
  rows.push({ label: 'Custo do Produto', value: `- R$ ${custo.toFixed(2)}` });
  const corte = rows.length;
  rows.push({ label: 'Lucro Líquido', value: `R$ ${lucro.toFixed(2)}`, accent: true });
  rows.push({ label: 'Margem de Lucro', value: `${margem}%`, accent: true });

  document.getElementById('detalhes').innerHTML = rows.map((r, i) => `
    <div class="result-row flex justify-between items-center py-4 ${i >= corte ? 'border-t-2 border-zinc-700 mt-2 pt-6' : ''} ${r.destaque ? 'bg-blue-500/10 -mx-2 px-2 rounded-xl' : ''}">
      <span class="text-zinc-400 text-sm">${r.label}</span>
      <span class="font-bold text-base ${r.accent ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}">${r.value}</span>
    </div>
  `).join('');

  document.getElementById('resultado').classList.remove('hidden');
  document.getElementById('placeholder-prec').classList.add('hidden');
}

function mostrarErroResultado(msg) {
  document.getElementById('detalhes').innerHTML = `
    <div class="text-center py-6">
      <i class="fa-solid fa-triangle-exclamation text-3xl text-yellow-500 mb-3"></i>
      <p class="text-zinc-300 font-medium">${msg}</p>
    </div>
  `;
  document.getElementById('resultado').classList.remove('hidden');
  document.getElementById('placeholder-prec').classList.add('hidden');
}

function calcular() {
  if (modoCalculo === 'direto') calcularDireto();
  else calcularReverso();
}

// Modo direto: usuário informa o preço de venda, calculamos o lucro real
function calcularDireto() {
  const precoVenda = parseFloat(document.getElementById('precoVenda').value) || 0;
  if (precoVenda <= 0) { alert("Por favor, informe o preço de venda."); return; }

  const { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor } = lerCustosComuns();

  const base = calcularComissaoBase(precoVenda);
  const fixo = tipoVendedor === 'cnpj' ? base.fixaCnpj : taxaFixaCpf;
  const comissaoTotal = (precoVenda * base.percentual) + fixo;
  const imposto = precoVenda * (aliquotaImposto / 100);
  const afiliado = precoVenda * (afiliadoPct / 100);
  const ads = adsPct > 0 ? precoVenda * (adsPct / 100) : adsValor;

  const valorRecebido = precoVenda - comissaoTotal - imposto - afiliado - ads;
  const lucro = valorRecebido - custo;
  const margem = precoVenda > 0 ? (lucro / precoVenda * 100).toFixed(1) : 0;

  montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco: false });
}

// Modo reverso: usuário informa custo + lucro desejado, calculamos o preço ideal
// resolvendo a equação de forma fechada em cada faixa de comissão (todas lineares em precoVenda).
function resolverPrecoIdeal(params) {
  const { custo, tipoVendedor, taxaFixaCpf, aliquotaImposto, afiliadoPct, adsPct, adsValor, modoLucro, lucroValor, margemPct } = params;
  const impostoFrac = aliquotaImposto / 100;
  const afiliadoFrac = afiliadoPct / 100;
  const adsFracPct = adsPct > 0 ? adsPct / 100 : 0;
  const adsFixo = adsPct > 0 ? 0 : adsValor;
  const margemFrac = modoLucro === 'margem' ? margemPct / 100 : 0;
  const lucroFixo = modoLucro === 'valor' ? lucroValor : 0;

  for (const faixa of FAIXAS_COMISSAO) {
    const fixoB = tipoVendedor === 'cnpj' ? faixa.fixaCnpj : taxaFixaCpf;
    const denominador = 1 - faixa.percentual - impostoFrac - afiliadoFrac - adsFracPct - margemFrac;
    if (denominador <= 0) continue;

    const precoVenda = (lucroFixo + fixoB + custo + adsFixo) / denominador;
    const dentroFaixa = precoVenda > 0 && precoVenda <= faixa.max && (faixa.min === 0 || precoVenda > faixa.min);
    if (dentroFaixa) return { precoVenda, faixa, fixoB };
  }
  return null;
}

function calcularReverso() {
  const { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor } = lerCustosComuns();
  const lucroValor = parseFloat(document.getElementById('lucroValor').value) || 0;
  const margemPct = parseFloat(document.getElementById('lucroMargem').value) || 0;

  if (custo <= 0) { alert("Por favor, informe o custo do produto."); return; }
  if (modoLucro === 'valor' && lucroValor <= 0) { alert("Por favor, informe o lucro desejado em R$."); return; }
  if (modoLucro === 'margem' && (margemPct <= 0 || margemPct >= 100)) { alert("Por favor, informe uma margem de lucro válida (entre 0 e 100%)."); return; }

  const resultado = resolverPrecoIdeal({
    custo, tipoVendedor, taxaFixaCpf, aliquotaImposto, afiliadoPct, adsPct, adsValor,
    modoLucro, lucroValor, margemPct
  });

  if (!resultado) {
    mostrarErroResultado("Não é possível atingir esse lucro com esses custos, comissões, afiliados e Ads. Tente reduzir a margem/lucro desejado ou os custos de afiliado/Ads.");
    return;
  }

  const { precoVenda, faixa, fixoB } = resultado;
  const comissaoTotal = (precoVenda * faixa.percentual) + fixoB;
  const imposto = precoVenda * (aliquotaImposto / 100);
  const afiliado = precoVenda * (afiliadoPct / 100);
  const ads = adsPct > 0 ? precoVenda * (adsPct / 100) : adsValor;
  const valorRecebido = precoVenda - comissaoTotal - imposto - afiliado - ads;
  const lucro = valorRecebido - custo;
  const margem = (lucro / precoVenda * 100).toFixed(1);

  montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco: true });
}

// init
switchTab('cnpj');

// ── GERADOR DE ETIQUETAS ZPL ─────────────────
const { jsPDF } = window.jspdf;
let fileList = [];
let erros = 0, concluidas = 0;

function logStatus(msg, type = 'info') {
  // Painel de log removido da interface — mantido como no-op para não quebrar
  // as chamadas existentes ao longo do processamento.
  return;
}

function updateStats(total) {
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statOk').textContent = concluidas;
}

function renderFileList() {
  const display = document.getElementById('fileListDisplay');
  const items = document.getElementById('fileItems');
  if (!fileList.length) { display.classList.add('hidden'); return; }
  display.classList.remove('hidden');
  items.innerHTML = fileList.map(f => `
    <div class="flex items-center justify-between info-card rounded-xl px-4 py-3">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-file-lines text-blue-400 text-sm"></i>
        <span class="text-sm text-zinc-300 truncate max-w-[180px]">${f.name}</span>
      </div>
      <span class="text-xs text-zinc-500">${(f.size/1024).toFixed(1)}KB</span>
    </div>
  `).join('');
}

function limparArquivos() {
  fileList = [];
  document.getElementById("fileInput").value = "";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").textContent = "Aguardando...";
  document.getElementById("eta").textContent = "--";
  document.getElementById("statTotal").textContent = "0";
  document.getElementById("statOk").textContent = "0";
  erros = 0; concluidas = 0;
  renderFileList();
}

async function extrairEtiquetas(texto) {
  let etiquetas = [];
  if (texto.includes("~DGR:DEMO.GRF")) {
    const regexShopee = /~DGR:DEMO\.GRF[\s\S]*?:DEMO\.GRF\^FS\^XZ/gm;
    let match;
    while ((match = regexShopee.exec(texto)) !== null)
      etiquetas.push(match[0].trim().replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""));
  } else {
    const regex = /\^XA[\s\S]*?\^XZ/gm;
    let match;
    while ((match = regex.exec(texto)) !== null)
      etiquetas.push(match[0].trim().replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""));
  }
  return etiquetas;
}

async function processar() {
  const files = fileList.length ? fileList : Array.from(document.getElementById("fileInput").files);
  if (!files.length) return alert("Selecione ou arraste arquivos .txt ou .zip");

  erros = 0; concluidas = 0;
  const totalStart = Date.now();
  let etiquetas = [];
  const redeSocial = document.getElementById("redeSocial").value || "";

  logStatus("Iniciando processamento...");

  for (const file of files) {
    logStatus(`Lendo: ${file.name}`);
    if (file.name.endsWith(".zip")) {
      const data = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(data);
      for (const fname in zip.files) {
        if (fname.endsWith(".txt")) {
          const texto = await zip.files[fname].async("string");
          const found = await extrairEtiquetas(texto);
          etiquetas.push(...found);
          logStatus(`${fname}: ${found.length} etiqueta(s)`, 'ok');
        }
      }
    } else if (file.name.endsWith(".txt")) {
      const texto = await file.text();
      const found = await extrairEtiquetas(texto);
      etiquetas.push(...found);
      logStatus(`${file.name}: ${found.length} etiqueta(s)`, 'ok');
    }
  }

  if (!etiquetas.length) { logStatus("Nenhuma etiqueta encontrada.", 'error'); return; }
  logStatus(`Total: ${etiquetas.length} etiquetas`);
  updateStats(etiquetas.length);

  const pdf = new jsPDF({ unit: "mm", format: [100, 150] });
  const progressBar = document.getElementById("progressBar");

  for (let i = 0; i < etiquetas.length; i++) {
    document.getElementById('progressText').textContent = `Processando ${i+1} de ${etiquetas.length}`;
    try {
      const res = await fetch("https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "image/png" },
        body: etiquetas[i]
      });
      if (!res.ok) throw new Error("Falha Labelary");
      const blob = await res.blob();
      if (i > 0) pdf.addPage();
      const imgData = await toBase64(blob);
      pdf.addImage(imgData, "PNG", 0, 0, 100, 150);
      pdf.setFontSize(11);
      pdf.text(redeSocial, 5, 4, { align: "left" });
      pdf.text(`${i+1}/${etiquetas.length}`, 95, 4, { align: "right" });
      concluidas++;
      logStatus(`Etiqueta ${i+1} OK`, 'ok');
    } catch (e) {
      erros++;
      logStatus(`Erro etiqueta ${i+1}: ${e.message}`, 'error');
      await new Promise(r => setTimeout(r, 500));
      i--;
    }
    progressBar.style.width = ((i + 1) / etiquetas.length * 100) + "%";
    const elapsed = (Date.now() - totalStart) / (i + 1);
    const remaining = (etiquetas.length - i - 1) * elapsed / 1000;
    document.getElementById("eta").textContent = remaining > 0 ? remaining.toFixed(1) + "s restantes" : "Finalizando...";
    updateStats(etiquetas.length);
  }

  const dataStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const fileName = `etiqueta-${dataStr}-${etiquetas.length}.pdf`;
  pdf.save(fileName);
  window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
  logStatus(`PDF gerado: ${fileName}`, 'ok');
  document.getElementById('progressText').textContent = "Concluído!";
  fileList = [];
}

function toBase64(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  fileList = Array.from(e.target.files);
  renderFileList();
  logStatus(`${fileList.length} arquivo(s) selecionado(s).`);
});

const dropZone = document.getElementById("dropZone");
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drop-zone-active"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drop-zone-active"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drop-zone-active");
  fileList = Array.from(e.dataTransfer.files);
  renderFileList();
  logStatus(`${fileList.length} arquivo(s) adicionado(s) via drag & drop.`);
});

// ============================================================
//  SGE v2 — Grupo Energia
//  GAS_BACKEND.js — Backend de escrita
//  Web App: executar como "Eu" | acesso "Qualquer pessoa"
// ============================================================

const SHEET_ID = '1mOuc97W4JZmhA-VWPzJpUOcOumDOpfMG3aKHkmCmHVk';

// ── Ponto de entrada POST ────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { acao, aba, dados, id } = payload;

    if (!acao) return resp(false, 'Parâmetro "acao" obrigatório.');

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(aba);
    if (!sheet && acao !== 'INATIVAR_CASCATA') return resp(false, 'Aba não encontrada: ' + aba);

    switch (acao) {
      case 'INSERIR':          return inserir(sheet, dados);
      case 'ATUALIZAR':        return atualizar(sheet, id, dados);
      case 'INATIVAR':         return inativar(sheet, id);
      case 'INATIVAR_CASCATA': return inativarCascata(ss, id);
      default: return resp(false, 'Ação desconhecida: ' + acao);
    }
  } catch (err) {
    console.error('doPost error:', err);
    return resp(false, 'Erro interno: ' + err.toString());
  }
}

// ── GET (health check) ───────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, sistema: 'SGE v2', versao: '2.0.0', ts: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── INSERIR ──────────────────────────────────────────────────
function inserir(sheet, dados) {
  if (!dados) return resp(false, 'Dados obrigatórios para INSERIR.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const linha   = headers.map(h => dados[h] !== undefined ? dados[h] : '');
  sheet.appendRow(linha);
  Utilities.sleep(200); // garante escrita antes do retorno
  return resp(true, 'Registro inserido com sucesso.');
}

// ── ATUALIZAR ────────────────────────────────────────────────
function atualizar(sheet, id, dados) {
  if (!id || !dados) return resp(false, 'ID e dados obrigatórios para ATUALIZAR.');
  const linhaIdx = encontrarLinhaPorID(sheet, id);
  if (!linhaIdx)  return resp(false, 'Registro não encontrado: ' + id);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((h, i) => {
    if (dados[h] !== undefined) sheet.getRange(linhaIdx, i + 1).setValue(dados[h]);
  });
  return resp(true, 'Registro atualizado com sucesso.');
}

// ── INATIVAR ─────────────────────────────────────────────────
function inativar(sheet, id) {
  if (!id) return resp(false, 'ID obrigatório para INATIVAR.');
  const linhaIdx  = encontrarLinhaPorID(sheet, id);
  if (!linhaIdx)  return resp(false, 'Registro não encontrado: ' + id);
  const headers   = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colStatus = headers.indexOf('STATUS') + 1;
  if (!colStatus) return resp(false, 'Coluna STATUS não encontrada.');
  sheet.getRange(linhaIdx, colStatus).setValue('Inativo');
  return resp(true, 'Registro inativado.');
}

// ── INATIVAR EM CASCATA ──────────────────────────────────────
// Inativa colaborador + todos seus registros em Efetivos e Alojamentos
function inativarCascata(ss, idColaborador) {
  if (!idColaborador) return resp(false, 'ID do colaborador obrigatório.');
  const abas = ['Colaboradores', 'Efetivos', 'Alojamentos'];
  let total  = 0;

  abas.forEach(nomeAba => {
    const sheet = ss.getSheetByName(nomeAba);
    if (!sheet) return;
    const headers    = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colStatus  = headers.indexOf('STATUS') + 1;
    const colIdCol   = headers.indexOf(nomeAba === 'Colaboradores' ? 'ID' : 'ID_COLABORADOR') + 1;
    if (!colStatus || !colIdCol) return;

    const dados = sheet.getDataRange().getValues();
    for (let r = 1; r < dados.length; r++) {
      if (String(dados[r][colIdCol - 1]) === String(idColaborador) &&
          dados[r][colStatus - 1] !== 'Inativo') {
        sheet.getRange(r + 1, colStatus).setValue('Inativo');
        total++;
      }
    }
  });

  return resp(true, `Cascata concluída — ${total} registro(s) inativado(s).`);
}

// ── Helper: encontrar linha por ID (coluna A) ────────────────
function encontrarLinhaPorID(sheet, id) {
  const dados = sheet.getDataRange().getValues();
  for (let r = 1; r < dados.length; r++) {
    if (String(dados[r][0]).trim() === String(id).trim()) return r + 1;
  }
  return null;
}

// ── Helper: resposta padrão ──────────────────────────────────
function resp(ok, mensagem, dados) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok, mensagem, dados: dados || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

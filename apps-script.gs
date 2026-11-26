const ID_DA_PLANILHA = 'PREENCHER_ID_DA_PLANILHA';
const ABA_PEDIDOS = 'Pedidos';

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 16000) return result(false);
    const order = JSON.parse(raw);
    if (!order || typeof order.nome !== 'string' || order.nome.trim().length < 2
        || typeof order.telefone !== 'string' || !/^\+55[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/.test(order.telefone)
        || typeof order.servico !== 'string' || !order.servico
        || !order.campos || typeof order.campos !== 'object' || Array.isArray(order.campos)
        || typeof order.data_hora !== 'string' || !Number.isFinite(Date.parse(order.data_hora))) {
      return result(false);
    }

    const sheet = SpreadsheetApp.openById(ID_DA_PLANILHA).getSheetByName(ABA_PEDIDOS);
    if (!sheet) throw new Error('Aba de pedidos não encontrada: ' + ABA_PEDIDOS);
    sheet.appendRow([
      order.data_hora, order.nome, order.telefone, order.servico,
      JSON.stringify(order.campos), order.observacoes,
      order.utm_source, order.utm_medium, order.utm_campaign,
    ].map(sheetText));
    return result(true);
  } catch (error) {
    console.error(error.message);
    return result(false);
  }
}

function result(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetText(value) {
  const text = String(value == null ? '' : value);
  // Preserve o +55 como texto e impeça que entradas do formulário virem fórmulas.
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

const PRINT_FIELDS = ['format', 'color', 'pages', 'quantity', 'sides', 'deadline'];
const PRINT_QUANTITY_LABEL = 'Quantidade de cópias do conjunto';
const printRequired = ['format', 'color', 'pages', 'quantity', 'sides'];
const services = {
  impressao: { label: 'Impressão', fields: PRINT_FIELDS, required: printRequired, pages: 'Páginas por arquivo', quantity: PRINT_QUANTITY_LABEL, attach: true },
  copias: { label: 'Cópias (xerox)', fields: PRINT_FIELDS, required: printRequired, pages: 'Páginas do original', quantity: PRINT_QUANTITY_LABEL, attach: true },
  encadernacao: { label: 'Encadernação', fields: ['format', 'pages', 'quantity', 'deadline'], required: ['pages', 'quantity'], pages: 'Páginas por exemplar', quantity: 'Quantidade de exemplares' },
  plastificacao: { label: 'Plastificação', fields: ['format', 'quantity', 'deadline'], required: ['format', 'quantity'], quantity: 'Quantidade de documentos' },
  materiais: { label: 'Materiais escolares e de escritório', fields: ['deadline'], required: ['notes'], needsList: true },
};

const fieldKeys = { format: 'formato', color: 'cor', pages: 'paginas', quantity: 'quantidade', sides: 'lados', deadline: 'data_desejada' };
const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign'];
const pageParams = new URLSearchParams(location.search);
const demoMode = pageParams.get('demo') === '1';
const form = document.querySelector('#quote-form');
const fields = form.elements;
const submitButton = form.querySelector('[type="submit"]');
const formError = document.querySelector('#submit-error');
const summary = document.querySelector('#quote-summary');
const summaryTitle = document.querySelector('#paper-title');
const emptySummary = document.querySelector('#empty-summary');
const schoolList = document.querySelector('#school-list');
const schoolButton = document.querySelector('#use-school-list');
const schoolError = document.querySelector('#school-error');
const confirmation = document.querySelector('#confirmation');
const messageBox = document.querySelector('#message');
const whatsapp = document.querySelector('#whatsapp');
const copyStatus = document.querySelector('#copy-status');
const whatsappDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

let generalNotes = '';
let sending = false;

function setMinimumDate() {
  const now = new Date();
  fields.deadline.min = [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

function dateLabel(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? whatsappDate.format(date) : '';
}

function nationalDigits(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 12 && digits.startsWith('55') ? digits.slice(2) : digits;
}

function formatPhone(digits) {
  if (digits.length < 3) return digits ? '(' + digits : '';
  const end = digits.length > 10 ? 7 : 6;
  const line = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, end);
  return digits.length > end ? line + '-' + digits.slice(end) : line;
}

function maskPhone() {
  const raw = fields.phone.value;
  const digits = nationalDigits(raw);
  if (digits.length > 11) return;
  const cursor = fields.phone.selectionStart;
  const next = formatPhone(digits);
  if (raw === next) return;
  fields.phone.value = next;
  if (cursor == null || cursor === raw.length) return;
  const before = raw.slice(0, cursor).replace(/\D/g, '').length;
  const target = Math.max(0, before - (raw.replace(/\D/g, '').length - digits.length));
  let position = 0;
  let count = 0;
  while (position < next.length && count < target) {
    if (/\d/.test(next[position])) count++;
    position++;
  }
  fields.phone.setSelectionRange(position, position);
}

function activeService() {
  return services[fields.service.value];
}

function fieldLabel(input) {
  const label = input.labels[0];
  return (label.querySelector('.field-name') || label).textContent.trim();
}

function orderDetails(service) {
  return service.fields.map(key => {
    const value = fields[key].value.trim();
    return { key: fieldKeys[key], value, label: fieldLabel(fields[key]), display: key === 'deadline' ? dateLabel(value) : value };
  }).filter(item => item.value);
}

function updateSummary() {
  const service = activeService();
  const rows = orderDetails(service).map(item => [item.label, item.display]);
  if (fields.notes.value.trim()) rows.push([fieldLabel(fields.notes), service.needsList ? 'Lista incluída' : 'Incluídas na mensagem']);
  summaryTitle.textContent = service.label;
  summary.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    return row;
  }));
  emptySummary.hidden = rows.length > 0;
}

function showFieldError(input, message) {
  const error = document.getElementById(input.id + '-error');
  error.textContent = message;
  error.hidden = !message;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
  } else {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}

function checkField(input, service) {
  const { name, value, validity } = input;
  if (name === 'customer' && value.trim().length < 2) return 'Informe seu nome.';
  if (name === 'phone' && !value.trim()) return 'Informe seu WhatsApp com DDD.';
  if (name === 'phone' && !/^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/.test(nationalDigits(value))) {
    return 'Informe um número válido com DDD. Ex.: (15) 99999-9999.';
  }
  if (name === 'pages' || name === 'quantity') {
    if (!validity.valid) {
      return name === 'pages' ? 'Informe o número de páginas, entre 1 e 99.999.' : 'Informe uma quantidade inteira entre 1 e 99.999.';
    }
  }
  if (name === 'format' && validity.valueMissing) return 'Escolha o formato ou selecione A confirmar.';
  if (name === 'color' && validity.valueMissing) return 'Escolha as cores ou selecione A confirmar.';
  if (name === 'sides' && validity.valueMissing) return 'Escolha os lados ou selecione A confirmar.';
  if (name === 'deadline' && !validity.valid) return 'Informe uma data válida a partir de hoje.';
  if (name === 'notes' && service.needsList && !value.trim()) return 'Escreva pelo menos um item da sua lista.';
  return '';
}

function updateService() {
  const service = activeService();
  for (const group of form.querySelectorAll('[data-field]')) {
    const key = group.dataset.field;
    const visible = service.fields.includes(key);
    group.hidden = !visible;
    fields[key].disabled = !visible;
    fields[key].required = visible && service.required.includes(key);
    showFieldError(fields[key], '');
  }
  document.querySelector('#pages-label').textContent = service.pages || 'Páginas';
  document.querySelector('#quantity-label').textContent = service.quantity || 'Quantidade';
  fields.notes.value = service.needsList ? schoolList.value : generalNotes;
  fields.notes.rows = service.needsList ? 6 : 3;
  fields.notes.required = service.needsList === true;
  fields.notes.placeholder = service.needsList
    ? 'Ex.: 2 cadernos, 1 caneta azul e 1 caixa de lápis de cor.'
    : (service.attach ? 'Ex.: é um PDF. Preciso de 2 cópias separadas.' : 'Ex.: acabamento ou detalhes do documento.');
  document.querySelector('#attachment-hint').hidden = !service.attach;
  showFieldError(fields.notes, '');
  if (!form.querySelector('[aria-invalid="true"]')) formError.hidden = true;
  updateSummary();
}

function setService(key) {
  fields.service.value = key;
  updateService();
}

function fillExample() {
  const example = { format: 'A4', color: 'Preto e branco', pages: '12', quantity: '2', sides: 'Só frente' };
  for (const [key, value] of Object.entries(example)) fields[key].value = value;
  setService('impressao');
}

function validateOrder(service) {
  setMinimumDate();
  const inputs = ['customer', 'phone', ...service.fields, 'notes'].map(key => fields[key]);
  let firstError;
  for (const input of inputs) {
    const error = checkField(input, service);
    showFieldError(input, error);
    if (error && !firstError) firstError = input;
  }
  formError.textContent = firstError ? 'Confira os campos indicados antes de enviar.' : '';
  formError.hidden = !firstError;
  if (firstError) firstError.focus();
  return !firstError;
}

function makeOrder(service) {
  const values = orderDetails(service);
  const note = fields.notes.value.trim();
  const name = fields.customer.value.trim();
  const digits = nationalDigits(fields.phone.value);
  const campos = Object.fromEntries(values.map(item => [item.key, item.value]));
  if (service.needsList) campos.lista = note;
  const attribution = Object.fromEntries(utmKeys.map(key => [key, (pageParams.get(key) ?? '').slice(0, 250)]));
  const payload = {
    nome: name,
    telefone: '+55' + digits,
    servico: service.label,
    campos,
    observacoes: note,
    data_hora: new Date().toISOString(),
    ...attribution,
  };

  const lines = [
    'Olá, Pauta! Gostaria de pedir um orçamento.',
    '',
    '• ' + fieldLabel(fields.customer) + ': ' + name,
    '• ' + fieldLabel(fields.phone) + ': ' + formatPhone(digits),
    '• ' + fieldLabel(fields.service) + ': ' + service.label,
  ];
  for (const item of values) lines.push('• ' + item.label + ': ' + item.display);
  if (note) lines.push('', fieldLabel(fields.notes) + ':', note);
  lines.push('', 'Podem confirmar as opções, o valor e o prazo?');
  return { payload, message: lines.join('\n') };
}

function whatsappUrl(message) {
  const url = new URL('https://wa.me/' + WHATSAPP_NUMERO);
  if (message) url.searchParams.set('text', message);
  return url.href;
}

async function recordOrder(payload) {
  if (!ENDPOINT_SHEETS.trim()) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    // Uma requisição simples funciona com Apps Script sem exigir cabeçalhos CORS.
    // O navegador não pode verificar a resposta opaca. Confira a linha na planilha.
    await fetch(ENDPOINT_SHEETS, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function setSending(value) {
  sending = value;
  submitButton.disabled = value;
  form.setAttribute('aria-busy', String(value));
  submitButton.textContent = value ? 'Preparando pedido…' : 'Enviar pedido no WhatsApp';
}

function showConfirmation(message, url) {
  messageBox.value = message;
  if (url) whatsapp.href = url;
  whatsapp.hidden = !url;
  copyStatus.textContent = '';
  confirmation.showModal();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || confirmation.open || fields.website.value) return;
  const service = activeService();
  if (!validateOrder(service)) return;

  const { payload, message } = makeOrder(service);
  if (demoMode) {
    showConfirmation(message);
    return;
  }
  const url = whatsappUrl(message);
  setSending(true);
  // Reserve a aba durante o clique. A conversa só abre após a tentativa de POST.
  let tab;
  try {
    tab = window.open('about:blank', '_blank');
    if (tab) {
      tab.opener = null;
      tab.document.title = 'Preparando pedido da Pauta';
    }
  } catch {
    tab = null;
  }
  try {
    await recordOrder(payload);
  } catch {
    // A confirmação e o WhatsApp seguem disponíveis em qualquer falha da planilha.
  }
  showConfirmation(message, url);
  setSending(false);
  try {
    trackLead();
  } finally {
    if (tab && !tab.closed) {
      try {
        tab.location.replace(url);
        return;
      } catch {
        tab.close();
      }
    }
    window.location.assign(url);
  }
});

fields.service.addEventListener('change', updateService);
form.addEventListener('input', event => {
  const input = event.target;
  if (input === fields.phone) maskPhone();
  if (input === fields.notes) {
    if (activeService().needsList) {
      schoolList.value = input.value;
      setSchoolError(false);
    } else {
      generalNotes = input.value;
    }
  }
  if (input.hasAttribute('aria-invalid')) showFieldError(input, checkField(input, activeService()));
  if (!form.querySelector('[aria-invalid="true"]')) formError.hidden = true;
  updateSummary();
});
for (const link of document.querySelectorAll('[data-service]')) {
  link.addEventListener('click', () => setService(link.dataset.service));
}
document.querySelector('.sample-ticket').addEventListener('click', fillExample);
document.querySelector('#fill-example').addEventListener('click', fillExample);

function setSchoolError(show) {
  schoolError.hidden = !show;
  if (show) {
    schoolList.setAttribute('aria-invalid', 'true');
    schoolList.setAttribute('aria-describedby', schoolError.id);
  } else {
    schoolList.removeAttribute('aria-invalid');
    schoolList.removeAttribute('aria-describedby');
  }
}

schoolList.addEventListener('input', () => {
  setSchoolError(false);
  if (activeService().needsList) {
    fields.notes.value = schoolList.value;
    showFieldError(fields.notes, '');
    updateSummary();
  }
});
schoolButton.addEventListener('click', () => {
  if (!schoolList.value.trim()) {
    setSchoolError(true);
    schoolList.focus();
    return;
  }
  setService('materiais');
  const identityField = [fields.customer, fields.phone].find(input => checkField(input, activeService()));
  (identityField || fields.notes).focus({ preventScroll: true });
  document.querySelector('#orcamento').scrollIntoView();
});

document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(messageBox.value);
    copyStatus.textContent = 'Mensagem copiada.';
  } catch {
    messageBox.focus();
    messageBox.select();
    copyStatus.textContent = 'Texto selecionado. Use a opção de copiar do seu dispositivo.';
  }
});

function trackLead() {
  if (META_PIXEL_ID && typeof window.fbq === 'function') window.fbq('track', 'Lead');
  if (GOOGLE_ANALYTICS_ID && typeof window.gtag === 'function') window.gtag('event', 'Lead');
}

function loadTracking() {
  if (/^\d+$/.test(META_PIXEL_ID) && !window.fbq) {
    const pixel = function () {
      if (pixel.callMethod) pixel.callMethod.apply(pixel, arguments);
      else pixel.queue.push(arguments);
    };
    pixel.push = pixel;
    pixel.loaded = true;
    pixel.version = '2.0';
    pixel.queue = [];
    window.fbq = pixel;
    window._fbq = pixel;
    loadTag('https://connect.facebook.net/en_US/fbevents.js');
    pixel('init', META_PIXEL_ID);
    pixel('track', 'PageView');
  }
  if (/^G-[A-Z0-9]+$/.test(GOOGLE_ANALYTICS_ID)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    loadTag('https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ANALYTICS_ID);
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ANALYTICS_ID);
  }
}

function loadTag(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function configureContactLinks() {
  if (demoMode) {
    for (const link of document.querySelectorAll('[data-whatsapp]')) {
      link.href = '#orcamento';
      link.removeAttribute('target');
      if (link.hasAttribute('aria-label')) link.setAttribute('aria-label', 'Testar o formulário');
      else link.textContent = 'Testar o formulário';
    }
    return;
  }
  for (const link of document.querySelectorAll('[data-whatsapp]')) {
    link.href = link.dataset.whatsapp === 'direct' ? whatsappUrl() : whatsappUrl(MENSAGEM_WHATSAPP);
  }
  document.querySelector('#whatsapp-contact').textContent = formatPhone(nationalDigits(WHATSAPP_NUMERO));
  for (const [id, number] of [['primary-contact', TELEFONE_PRINCIPAL], ['secondary-contact', TELEFONE_SECUNDARIO]]) {
    const row = document.getElementById(id);
    const digits = number.trim();
    row.hidden = !digits;
    if (digits) {
      const link = row.querySelector('a');
      link.href = 'tel:+' + digits;
      link.textContent = formatPhone(nationalDigits(digits));
    }
  }
}

function renderConfiguration() {
  configureContactLinks();
  const hours = document.querySelector('#opening-hours');
  hours.textContent = HORARIO_FUNCIONAMENTO.trim();
  hours.parentElement.hidden = !EXIBIR.horario || !hours.textContent;
  for (const price of document.querySelectorAll('[data-price]')) {
    const value = String(PRECO_INICIAL[price.dataset.price] ?? '').trim();
    price.hidden = !EXIBIR.precos || !value;
    price.textContent = price.hidden ? '' : 'A partir de R$ ' + value;
  }
  for (const answer of document.querySelectorAll('[data-faq]')) answer.textContent = FAQ_RESPOSTAS[answer.dataset.faq];

  const reviews = EXIBIR.depoimentos ? DEPOIMENTOS.filter(({ texto }) => texto?.trim()).map(({ texto, autor }) => {
    const card = document.createElement('figure');
    const quote = document.createElement('blockquote');
    quote.textContent = texto.trim();
    card.append(quote);
    if (autor?.trim()) {
      const footer = document.createElement('figcaption');
      footer.textContent = autor.trim();
      card.append(footer);
    }
    return card;
  }) : [];
  document.querySelector('#reviews-grid').replaceChildren(...reviews);
  const googleRating = document.querySelector('#google-rating');
  googleRating.hidden = !AVALIACAO_GOOGLE;
  if (AVALIACAO_GOOGLE) {
    const { nota, total } = AVALIACAO_GOOGLE;
    document.querySelector('#google-rating-score').textContent = nota.toLocaleString('pt-BR') + ' de 5';
    document.querySelector('#google-rating-count').textContent = total.toLocaleString('pt-BR') + ' avaliações';
  }
  document.querySelector('#avaliacoes').hidden = googleRating.hidden && reviews.length === 0;

  if (FOTO_MATERIAIS) {
    const holder = document.querySelector('#supplies-art');
    const image = Object.assign(document.createElement('img'), { alt: FOTO_MATERIAIS_ALT, loading: 'lazy', width: 640, height: 320 });
    image.addEventListener('load', () => holder.querySelector('svg').remove(), { once: true });
    image.addEventListener('error', () => image.remove(), { once: true });
    holder.append(image);
    image.src = FOTO_MATERIAIS;
  }

  if (demoMode) return;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Pauta Papelaria',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Dr. Virgílio de Rezende, 866A, Centro',
      addressLocality: 'Itapetininga',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    telephone: '+' + (TELEFONE_PRINCIPAL.trim() || TELEFONE_SECUNDARIO.trim() || WHATSAPP_NUMERO),
  };
  if (!hours.parentElement.hidden && HORARIO_SCHEMA.length) {
    schema.openingHoursSpecification = HORARIO_SCHEMA.map(hours => ({ '@type': 'OpeningHoursSpecification', ...hours }));
  }
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}

setMinimumDate();
renderConfiguration();
if (demoMode) {
  document.querySelector('#demo-notice').hidden = false;
  document.querySelector('#confirmation-title').textContent = 'Pedido simulado';
  document.querySelector('#confirmation-description').textContent = 'Veja a mensagem que o site preparou para este exemplo.';
  fields.customer.value = 'Cliente de demonstração';
  fields.phone.value = '(15) 90000-0000';
  fillExample();
} else {
  updateService();
  loadTracking();
}
submitButton.disabled = false;
schoolButton.disabled = false;

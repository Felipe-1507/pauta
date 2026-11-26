// Contatos em dígitos, com código do Brasil e DDD.
const WHATSAPP_NUMERO = '5515991443069';
const TELEFONE_PRINCIPAL = '551535278765';
const TELEFONE_SECUNDARIO = ''; // Preencher após confirmar o segundo fixo.

// Cole apps-script.gs no Apps Script da planilha e siga o passo a passo do README.
// Implante como aplicativo da Web, executando como proprietário, com acesso
// para qualquer pessoa. Cole aqui a URL de implantação, terminada em /exec.
const ENDPOINT_SHEETS = '';

// Dados opcionais preenchidos só com informações confirmadas. Vazio oculta o item.
const EXIBIR = { precos: true, depoimentos: true, horario: true };
const HORARIO_FUNCIONAMENTO = 'Segunda a sexta, 08h às 18h\nSábado, 08h às 13h';
const HORARIO_SCHEMA = [
  { dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
  { dayOfWeek: ['Saturday'], opens: '08:00', closes: '13:00' },
];

// Dados consultados no Google Maps em 25/11/2026. Use null para ocultar.
const AVALIACAO_GOOGLE = { nota: 4.7, total: 142 };

const PRECO_INICIAL = {
  impressao: '',
  encadernacao: '',
  plastificacao: '',
  materiais: '',
};

const FAQ_RESPOSTAS = {
  arquivos: 'Anexe o arquivo na conversa do WhatsApp.',
  prazo: 'Consulte a loja pelo WhatsApp.',
  pagamento: 'Confira as opções com a loja no WhatsApp.',
  formatos: 'Confirme o formato com a loja no WhatsApp.',
  entrega: 'Consulte a disponibilidade pelo WhatsApp.',
};

const DEPOIMENTOS = [
  // { texto: '', autor: '' },
];

const FOTO_MATERIAIS = ''; // Caminho local, por exemplo assets/foto-da-loja.webp.
const FOTO_MATERIAIS_ALT = 'Materiais escolares e de escritório da Pauta Papelaria';
const MENSAGEM_WHATSAPP = 'Olá, Pauta! Gostaria de tirar uma dúvida sobre os serviços da papelaria.';

// Medição opcional. Preencha com os IDs reais para carregar as tags e medir
// envios do formulário com o evento Lead. Nome e telefone ficam fora do evento.
const META_PIXEL_ID = ''; // ID numérico do Meta Pixel.
const GOOGLE_ANALYTICS_ID = ''; // ID de medição GA4, no formato G-XXXXXXXXXX.

# Pauta Papelaria

Prévia de um site para a Pauta Papelaria em Itapetininga. A página monta o pedido, tenta registrar os dados em uma planilha configurada e abre o WhatsApp. O visitante confirma o envio na conversa.

## Configuração

Edite o início de [docs/config.js](docs/config.js).

| Variável | O que preencher |
| --- | --- |
| WHATSAPP_NUMERO | WhatsApp confirmado da loja com 55, DDD e número, só dígitos. |
| TELEFONE_PRINCIPAL, TELEFONE_SECUNDARIO | Telefones fixos com 55 e DDD, só dígitos. A prévia usa o principal já divulgado. Confirme os dois antes de publicar. O segundo fica oculto enquanto estiver vazio. |
| ENDPOINT_SHEETS | URL HTTPS do aplicativo da Web do Apps Script, terminada em /exec. |
| HORARIO_FUNCIONAMENTO | Horários exibidos no contato. Vazio oculta a linha. |
| HORARIO_SCHEMA | Horários para mecanismos de busca. Use um objeto por faixa com dayOfWeek (dias em inglês), opens e closes (HH:MM). Omita as faixas ainda sem confirmação. |
| AVALIACAO_GOOGLE | Nota e total conferidos no Google Maps. Atualize após conferir a ficha da loja ou use null para ocultar o cartão. |
| PRECO_INICIAL | Valor confirmado de cada card, sem “R$”. Deixe vazio até confirmar. |
| FAQ_RESPOSTAS | Respostas curtas sobre arquivos, prazos, pagamentos, formatos e entrega. Já vêm com textos neutros. |
| DEPOIMENTOS | Adicione um objeto com texto e, se autorizado, autor para cada depoimento real. O bloco fica oculto sem depoimentos. |
| EXIBIR | Use false para ocultar preços, depoimentos ou horário, mesmo quando preenchidos. |
| FOTO_MATERIAIS, FOTO_MATERIAIS_ALT | Caminho da foto própria em docs/assets e descrição da imagem. Vazio mantém o ícone do card. |
| MENSAGEM_WHATSAPP | Mensagem padrão do botão flutuante e do número listado. O botão Conversar no WhatsApp abre a conversa em branco. |
| META_PIXEL_ID, GOOGLE_ANALYTICS_ID | IDs do Meta Pixel e do GA4. Vazios mantêm a medição desligada. Depois de configurar, marque Lead como evento principal no GA4 se ele for usado como conversão. |

A página de apresentação usa a meta noindex. Edite os metadados em docs/index.html.

## Gravar pedidos no Google Sheets

1. Crie uma planilha com uma aba **Pedidos**. Na primeira linha, preencha as colunas nesta ordem. Data/hora UTC, Nome, WhatsApp, Serviço, Campos do pedido, Observações, utm_source, utm_medium, utm_campaign.
2. Abra **Extensões → Apps Script** e substitua o conteúdo de Code.gs pelo [apps-script.gs](apps-script.gs). Em ID_DA_PLANILHA, cole o trecho entre /d/ e /edit da URL da planilha. Ajuste ABA_PEDIDOS se usou outro nome para a aba e salve.
3. Em **Implantar → Nova implantação**, selecione **Aplicativo da Web**. Configure **Executar como** para seu usuário e **Quem pode acessar** para **Qualquer pessoa**. Clique em **Implantar** e autorize o acesso do script à planilha.
4. Copie a URL do aplicativo terminada em /exec para ENDPOINT_SHEETS em docs/config.js. Republique o site e teste com dados fictícios. O compartilhamento da planilha é definido separadamente.

A requisição usa JSON em texto simples para funcionar com o Apps Script. Em integrações sem CORS, o site não lê a resposta do servidor. Verifique o registro direto na planilha. O formulário abre o WhatsApp mesmo com falha ou depois de até três segundos de espera.

## Demonstração para a reunião

Abra a [prévia com ?demo=1](https://pauta.felipeferreira.dev/?demo=1). O formulário de impressão vem preenchido com dados fictícios. Ao clicar em **Enviar pedido no WhatsApp**, a página mostra a mensagem simulada. Os atalhos de WhatsApp levam ao formulário, e os telefones da loja, a gravação na planilha e a medição ficam desativados nesse modo. Use a URL sem o parâmetro para testar o fluxo real.

## Testar

1. Clique em **Enviar pedido no WhatsApp** com os campos vazios e confira os erros de nome e WhatsApp. Preencha dados fictícios e confira a máscara com DDD.
2. Envie um exemplo completo para cada card (impressão e cópias, encadernação, plastificação e materiais). Teste também a opção **Cópias (xerox)** no seletor. Confira os nomes dos campos na mensagem pronta. Termine o teste antes de confirmar o envio dentro do WhatsApp.
3. No hero, clique em **Montar lista escolar**, cole alguns itens e use **Continuar com esta lista**. Confira **Materiais escolares e de escritório** como serviço e a lista em **Observações**.
4. Com a planilha conectada, abra o site com ?utm_source=teste&utm_medium=manual&utm_campaign=volta-aulas, sem demo=1. Envie o formulário com um nome identificável, como Teste de captação. Abra a aba **Pedidos** e procure a última linha com esse nome. Confira a data/hora, WhatsApp, serviço, campos do pedido, observações e três UTMs. A linha é gravada no envio do formulário, antes de confirmar a mensagem no WhatsApp. Repita com o endpoint vazio ou indisponível e confirme a abertura do WhatsApp.
5. No celular, confira o seletor, o campo de data e o espaço entre os botões do formulário e do WhatsApp flutuante. Com os IDs configurados, confira um evento **Lead** por envio válido no Meta Events Manager e no GA4 DebugView com a depuração habilitada.

O GitHub Pages publica a pasta docs da branch main. O arquivo docs/CNAME indica o domínio pauta.felipeferreira.dev.

## Referências

A marca vem do [Instagram da Pauta](https://www.instagram.com/papelariapauta/) e a fachada da [ficha da loja no Google Maps](https://www.google.com/maps?cid=4796279948554476780). Os serviços e o contato também constam no [perfil comercial local](https://www.itapebusiness.com.br/papelaria-pauta-papelaria-itapetininga).

[Apps Script — Aplicativos da Web](https://developers.google.com/apps-script/guides/web) · [Google Analytics — Eventos](https://developers.google.com/tag-platform/gtagjs/reference) · [Meta Pixel — Eventos](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/ig-migration)


const CONFIG = {
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1TPbUxnYwqbq7dm4vkE1WjenuMehaeSr_orviXB2Zg3Y/edit?gid=739257990#gid=739257990',
  NOME_ABA: 'inadimplencia_consignado'
};

const COLUNAS = [
  'data_contratacao', 'uf', 'orgao_pagador', 'canal_contratacao',
  'valor_emprestado', 'inadimplente', 'comprometimento_renda',
  'score_credito', 'taxa_juros_am'
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Observatório da Inadimplência | Consignado')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * O filtro de datas é aplicado a data_contratacao, não à data da
 * inadimplência (esta última não existe no dataset).
 * Por desempenho, retornamos apenas agregações, e não os 50 mil registros.
 *
 * @param {Object} filtros {inicio, fim, orgao, canal, uf}
 * @return {Object} Dados agregados para gráficos, KPIs e tabela.
 */
function getDashboardData(filtros) {
  filtros = filtros || {};
  const inicio = validarData_(filtros.inicio);
  const fim = validarData_(filtros.fim);
  const orgao = String(filtros.orgao || 'todos').toLowerCase();
  const canal = String(filtros.canal || 'todos').toLowerCase();
  const uf = String(filtros.uf || 'todos').toUpperCase();

  if (inicio && fim && inicio > fim) {
    throw new Error('A data inicial não pode ser posterior à data final.');
  }

  const arquivo = lerCsv_();
  const mapa = arquivo.indices;
  const linhas = arquivo.linhas;

  const metadados = {
    totalRegistros: 0,
    inicio: null,
    fim: null,
    orgaos: {},
    canais: {},
    ufs: {}
  };

  const geral = novoAcumulador_();
  const meses = {};
  const orgaos = {};
  const canais = {};
  const ufs = {};
  const faixasComprometimento = {};
  const faixasScore = {};
  const faixasJuros = {};

  for (let i = 1; i < linhas.length; i++) {
    const l = linhas[i];
    if (!l || !l[mapa.data_contratacao]) continue;

    const data = String(l[mapa.data_contratacao]).trim();
    const org = String(l[mapa.orgao_pagador] || '').trim().toLowerCase();
    const can = String(l[mapa.canal_contratacao] || '').trim().toLowerCase();
    const estado = String(l[mapa.uf] || '').trim().toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;

    metadados.totalRegistros++;
    metadados.inicio = !metadados.inicio || data < metadados.inicio ? data : metadados.inicio;
    metadados.fim = !metadados.fim || data > metadados.fim ? data : metadados.fim;
    metadados.orgaos[org] = true;
    metadados.canais[can] = true;
    metadados.ufs[estado] = true;

    if (inicio && data < inicio) continue;
    if (fim && data > fim) continue;
    if (orgao !== 'todos' && org !== orgao) continue;
    if (canal !== 'todos' && can !== canal) continue;
    if (uf !== 'TODOS' && estado !== uf) continue;

    const valor = numero_(l[mapa.valor_emprestado]);
    const inadimplente = Number(l[mapa.inadimplente]) === 1;
    const comprometimento = numero_(l[mapa.comprometimento_renda]); // fração (0,30 = 30%)
    const score = numero_(l[mapa.score_credito]);
    const juros = numero_(l[mapa.taxa_juros_am]); // percentual ao mês (2,1 = 2,1% a.m.)
    const registro = { valor: valor, inadimplente: inadimplente, score: score, juros: juros };

    somar_(geral, registro);
    somar_(obter_(meses, data.substring(0, 7)), registro);
    somar_(obter_(orgaos, org), registro);
    somar_(obter_(canais, can), registro);
    somar_(obter_(ufs, estado), registro);

    // Cada ponto representa a taxa de inadimplência dos contratos de uma faixa.
    const indiceComp = Math.min(7, Math.max(0, Math.floor(comprometimento * 100 / 5)));
    const indiceScore = Math.min(9, Math.max(0, Math.floor(score / 100)));
    const indiceJuros = indiceJuros_(juros);
    somar_(obter_(faixasComprometimento, String(indiceComp)), registro);
    somar_(obter_(faixasScore, String(indiceScore)), registro);
    somar_(obter_(faixasJuros, String(indiceJuros)), registro);
  }

  return {
    meta: {
      totalRegistros: metadados.totalRegistros,
      inicio: metadados.inicio,
      fim: metadados.fim,
      orgaos: Object.keys(metadados.orgaos).sort().map(function(x) { return { id: x, nome: rotulo_(x) }; }),
      canais: Object.keys(metadados.canais).sort().map(function(x) { return { id: x, nome: rotulo_(x) }; }),
      ufs: Object.keys(metadados.ufs).sort().map(function(x) { return { id: x, nome: x }; })
    },
    indicadores: {
      contratos: geral.n,
      inadimplentes: geral.inadimplentes,
      taxaInadimplencia: taxa_(geral),
      volumeContratado: geral.valor,
      valorAssociadoInadimplencia: geral.valorInadimplente
    },
    // Q1 — mês de contratação: volume contratado e taxa de inadimplência da coorte.
    mensal: Object.keys(meses).sort().map(function(chave) {
      const g = meses[chave];
      return { mes: chave, contratos: g.n, volume: g.valor, taxa: taxa_(g) };
    }),
    // Q2 — taxas por órgão, canal e UF, com denominador de cada categoria.
    porOrgao: converterCategorias_(orgaos),
    porCanal: converterCategorias_(canais),
    porUf: converterCategorias_(ufs),
    // Q3 — taxas por faixas de comprometimento de renda, score e juros.
    comprometimento: Object.keys(faixasComprometimento).map(function(i) {
      const g = faixasComprometimento[i];
      const k = Number(i);
      return { x: k * 5 + 2.5, faixa: (k * 5) + '–' + ((k + 1) * 5) + '%', n: g.n, taxa: taxa_(g) };
    }).sort(function(a,b) { return a.x - b.x; }),
    score: Object.keys(faixasScore).map(function(i) {
      const g = faixasScore[i];
      const k = Number(i);
      return { x: k * 100 + 50, faixa: (k * 100) + '–' + (k === 9 ? '1000' : (k * 100 + 99)), n: g.n, taxa: taxa_(g) };
    }).sort(function(a,b) { return a.x - b.x; }),
    juros: Object.keys(faixasJuros).map(function(i) {
      const g = faixasJuros[i];
      const k = Number(i);
      const nomes = ['< 1,25%', '1,25–1,50%', '1,50–1,75%', '1,75–2,00%',
                      '2,00–2,25%', '2,25–2,50%', '≥ 2,50%'];
      return { indice: k, faixa: nomes[k], n: g.n, taxa: taxa_(g) };
    }).sort(function(a,b) { return a.indice - b.indice; }),
    // Tabela de estatísticas agregadas por categoria.
    tabela: converterCategorias_(orgaos).map(function(g) {
      return {
        categoria: g.nome,
        contratos: g.n,
        inadimplentes: g.inadimplentes,
        taxa: g.taxa,
        valorTotal: g.valor,
        valorMedio: g.valorMedio,
        scoreMedio: g.scoreMedio,
        jurosMedio: g.jurosMedio
      };
    })
  };
}

function lerCsv_() {
  if (!CONFIG.SHEET_URL || CONFIG.SHEET_URL === 'COLE_AQUI_O_LINK_DA_PLANILHA') {
    throw new Error('Configure SHEET_URL no Code.gs com o link de uma planilha do Google Sheets.');
  }

  let planilha;
  try {
    planilha = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL);
  } catch (erro) {
    throw new Error('Não foi possível abrir a planilha no Google Sheets. Verifique o link e as permissões. Detalhes: ' + erro.message);
  }

  const aba = CONFIG.NOME_ABA
    ? planilha.getSheetByName(CONFIG.NOME_ABA)
    : planilha.getSheets()[0];
  if (!aba) throw new Error('A aba "' + CONFIG.NOME_ABA + '" não foi encontrada na planilha.');

  const linhas = aba.getDataRange().getValues();
  if (!linhas.length || linhas[0].length === 0) throw new Error('A planilha está vazia.');
  const cabecalho = linhas[0].map(function(c) {
    return String(c).replace(/^\uFEFF/, '').trim();
  });
  const indices = {};
  cabecalho.forEach(function(coluna, indice) { indices[coluna] = indice; });
  const faltantes = COLUNAS.filter(function(c) { return indices[c] === undefined; });
  if (faltantes.length) {
    throw new Error('Colunas não encontradas no Sheets: ' + faltantes.join(', ') + '. Confira a aba e o cabeçalho da primeira linha.');
  }

  // getValues() retorna datas como objetos Date quando o Sheets as reconhece.
  // O dashboard usa datas em texto ISO (AAAA-MM-DD) para filtrar e agrupar.
  const indiceData = indices.data_contratacao;
  const fuso = 'UTC';
  for (let i = 1; i < linhas.length; i++) {
    const valor = linhas[i][indiceData];
    if (valor instanceof Date && !isNaN(valor.getTime())) {
      linhas[i][indiceData] = Utilities.formatDate(valor, fuso, 'yyyy-MM-dd');
    } else if (typeof valor === 'string') {
      const dataTexto = valor.trim();
      const formatoBR = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataTexto);
      linhas[i][indiceData] = formatoBR
        ? formatoBR[3] + '-' + formatoBR[2] + '-' + formatoBR[1]
        : dataTexto;
    }
  }
  return { linhas: linhas, indices: indices };
}

/** Execute uma vez no editor para testar o link e autorizar o Sheets. */
function testarConexaoSheets() {
  const arquivo = lerCsv_();
  Logger.log('Planilha acessada com sucesso; ' + (arquivo.linhas.length - 1) + ' linhas de dados.');
  Logger.log('Colunas: ' + Object.keys(arquivo.indices).join(', '));
}

function validarData_(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  const texto = String(valor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('Data inválida: ' + texto);
  return texto;
}

function numero_(valor) {
  const n = Number(valor);
  return isFinite(n) ? n : 0;
}

function novoAcumulador_() {
  return { n: 0, inadimplentes: 0, valor: 0, valorInadimplente: 0, somaScore: 0, somaJuros: 0 };
}

function obter_(objeto, chave) {
  if (!Object.prototype.hasOwnProperty.call(objeto, chave)) objeto[chave] = novoAcumulador_();
  return objeto[chave];
}

function somar_(g, r) {
  g.n++;
  if (r.inadimplente) g.inadimplentes++;
  g.valor += r.valor;
  if (r.inadimplente) g.valorInadimplente += r.valor;
  g.somaScore += r.score;
  g.somaJuros += r.juros;
}

function taxa_(g) { return g.n ? g.inadimplentes / g.n * 100 : 0; }

function converterCategorias_(grupos) {
  return Object.keys(grupos).map(function(chave) {
    const g = grupos[chave];
    return {
      id: chave, nome: rotulo_(chave), n: g.n,
      inadimplentes: g.inadimplentes, taxa: taxa_(g),
      valor: g.valor, valorMedio: g.n ? g.valor / g.n : 0,
      scoreMedio: g.n ? g.somaScore / g.n : 0,
      jurosMedio: g.n ? g.somaJuros / g.n : 0
    };
  }).sort(function(a, b) { return b.n - a.n || a.nome.localeCompare(b.nome); });
}

function indiceJuros_(juros) {
  const limites = [1.25, 1.50, 1.75, 2.00, 2.25, 2.50];
  for (let i = 0; i < limites.length; i++) {
    if (juros < limites[i]) return i;
  }
  return 6;
}

function rotulo_(valor) {
  const nomes = {
    inss: 'INSS', estadual: 'Estadual', municipal: 'Municipal', federal: 'Federal',
    agencia: 'Agência', correspondente: 'Correspondente', digital: 'Digital'
  };
  return nomes[valor] || valor;
}


function diagnosticarDados() {
  const aba = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL).getSheets()[0];
  const dados = aba.getDataRange().getValues();

  const colunas = [8, 11, 12]; // I, L, M
  const nomes = ['valor_emprestado', 'taxa_juros_am', 'comprometimento_renda'];

  colunas.forEach((col, idx) => {
    let datas = 0;
    let exemplos = [];

    for (let i = 1; i < dados.length; i++) {
      if (dados[i][col] instanceof Date) {
        datas++;
        if (exemplos.length < 3) exemplos.push(i + 1);
      }
    }

    Logger.log(nomes[idx] + ': ' + datas +
      ' células interpretadas como datas. Linhas: ' +
      exemplos.join(', '));
  });

  Logger.log('M2 = ' + dados[1][12]);
}
<<<<<<< HEAD
# pvd-dashboard
Dashboard interativo de inadimplência em empréstimos consignados para a máteria de Processamento e Visualização de Dados. Desenvolvido com Google Apps Script, Google Sheets e Google Charts, incluindo análises temporais, comparações regionais e filtros interativos.
=======
# Observatório da Inadimplência em Empréstimos Consignados

Dashboard interativo desenvolvido para a máteria de Processamento e Visualização de Dados. Desenvolvido com **Google Apps Script, Google Sheets e Google Charts** para explorar a inadimplência em contratos de empréstimos consignados. O painel apresenta a evolução dos contratos por mês de contratação, diferenças entre segmentos e associações entre características financeiras e a inadimplência.

> **Dashboard público:** [https://script.google.com/macros/s/AKfycbxUuuoW2z2uT3J_IiVd8kDu0F6AbjMD4ep0R3Rp261iU8kCjxZZ0ltbMJQM0TW6DRHiWQ/exec]  
> **Fonte dos dados:** [https://docs.google.com/spreadsheets/d/1TPbUxnYwqbq7dm4vkE1WjenuMehaeSr_orviXB2Zg3Y/edit?usp=sharing]

## Visão geral

O projeto utiliza o conjunto de dados `inadimplencia_consignado.csv`, com:

- **50.000 contratos** e **17 colunas**;
- contratos firmados entre **01/01/2023 e 30/06/2025**;
- **4 órgãos pagadores**, **3 canais de contratação** e **27 UFs**;
- informações sobre valores, juros, renda, score de crédito e situação de inadimplência.

Com os filtros abertos, os principais indicadores são:

| Indicador | Valor |
| --- | ---: |
| Contratos analisados | 50.000 |
| Contratos inadimplentes | 2.038 |
| Taxa de inadimplência | 4,08% |
| Volume total contratado | R$ 1.917.748.304,34 |
| Valor original dos contratos inadimplentes | R$ 67.292.990,79 |

**Importante:** o último indicador representa o valor originalmente contratado nos empréstimos identificados como inadimplentes; **não** representa o saldo em atraso ou a dívida vencida.

## Perguntas de pesquisa

1. **Tendência temporal:** como o volume financeiro de empréstimos contratados e a taxa de inadimplência variam ao longo dos meses de contratação?
2. **Comparação entre categorias:** como a taxa de inadimplência se diferencia entre órgãos pagadores, canais de contratação e unidades federativas?
3. **Relação entre variáveis:** como o comprometimento de renda, o score de crédito e a taxa de juros mensal se relacionam com a inadimplência dos contratos?

O dashboard responde às perguntas com **8 gráficos de 4 tipos** (colunas, linhas, barras horizontais e dispersão), além de uma tabela com estatísticas agregadas por órgão pagador.

### Recursos interativos

- Filtros por **órgão pagador**, **canal de contratação**, **UF** e **intervalo de datas de contratação**;
- quatro indicadores numéricos destacados;
- visualizações atualizadas conforme a seleção dos filtros;
- comparação das UFs ordenada por taxa de inadimplência;
- tooltips com taxas e quantidade de contratos, incluindo aviso para amostras pequenas;
- apresentação de datas no formato `dd/mm/aaaa`.

## Organização do projeto

```text
observatorio-inadimplencia/
├── Code.gs
├── Index.html
├── appsscript.json
├── dados/
│   └── inadimplencia_consignado.csv
└── README.md
```

- `Code.gs`: código do servidor, leitura do Sheets, filtros e cálculos.
- `Index.html`: interface, gráficos, indicadores e tabela.
- `appsscript.json`: manifesto de configuração e permissões.
- `dados/inadimplencia_consignado.csv`: dataset original para reprodução e conferência.


## Pré-processamento e metodologia

O CSV foi carregado no Google Sheets, com ajuste da configuração regional para preservar os separadores decimais. Durante a preparação, foram corrigidos problemas de importação nos quais valores numéricos haviam sido convertidos em datas ou números incorretos. A leitura das datas também foi padronizada para evitar deslocamentos de fuso horário.

No Apps Script, os dados são filtrados e agrupados por mês de contratação, órgão pagador, canal de contratação, UF e faixas de variáveis financeiras. São calculados totais, médias e proporções para a tabela e os gráficos.

- **Taxa de inadimplência (%)** = contratos com `inadimplente = 1` / contratos do grupo × 100.
- **Volume contratado (R$)** = soma de `valor_emprestado`.
- **Comprometimento de renda** está registrado como fração (`0.2802` corresponde a `28,02%`).
- **Taxa de juros mensal** já está expressa em porcentagem (`2.099` corresponde a `2,099% a.m.`).
- As associações apresentadas são **descritivas**, sem inferência causal nem modelos preditivos.

**Limitação temporal:** o dataset possui a *data de contratação*, mas não a data em que a inadimplência começou. Assim, os gráficos mensais comparam contratos originados em diferentes meses; eles não descrevem o momento em que ocorreram os atrasos.

## Autoria

Desenvolvido por Marcus Vinicius Andrade Silva, Mauricio Alonzo e Eduardo da Silva Ribeiro como trabalho acadêmico para a matéria de Processamento e Visualização de Dados.
>>>>>>> bd59528 (add: códigos e dados)

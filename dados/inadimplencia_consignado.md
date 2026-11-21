# Inadimplência em crédito consignado

Contratos de crédito consignado de um banco. Cada linha é um contrato, com a indicação de
que o contrato ficou inadimplente (atraso acima de 90 dias) nos 12 meses seguintes à
contratação.

- **Linhas:** 50.000
- **Colunas:** 17
- **Período:** contratos de 01/01/2023 a 30/06/2025
- **Granularidade:** um contrato (amostra da carteira)
- **Arquivo:** `inadimplencia_consignado.csv`, separado por vírgula, codificação UTF-8

No consignado a parcela é descontada direto da folha de pagamento ou do benefício, e não
pode passar de 35% da renda (margem consignável). A taxa de juros dos contratos do INSS
tem um teto definido pelo governo, que mudou várias vezes no período. Para os demais
órgãos a taxa é livre.

## Colunas

| coluna | descrição | unidade |
|---|---|---|
| `id_contrato` | identificador do contrato | |
| `data_contratacao` | data da contratação | AAAA-MM-DD |
| `uf` | UF do cliente | |
| `orgao_pagador` | quem paga o salário ou benefício: inss, federal, estadual ou municipal | |
| `canal_contratacao` | canal da contratação: agencia, correspondente ou digital | |
| `escolaridade` | escolaridade do cliente | |
| `idade` | idade do cliente | anos |
| `renda_mensal` | renda mensal bruta | R$ |
| `valor_emprestado` | valor liberado ao cliente | R$ |
| `valor_parcela` | valor da parcela mensal | R$ |
| `prazo_meses` | número de parcelas | meses |
| `taxa_juros_am` | taxa de juros | % ao mês |
| `comprometimento_renda` | parcela dividida pela renda | fração |
| `num_emprestimos_ativos` | outros empréstimos ativos do cliente | |
| `tempo_vinculo_meses` | tempo de emprego ou de benefício | meses |
| `score_credito` | score de crédito, de 0 a 1000 | |
| `inadimplente` | 1 se o contrato ficou inadimplente em 12 meses, 0 caso contrário | |

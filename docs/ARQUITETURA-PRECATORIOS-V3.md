# ARQUITETURA DO MÓDULO ENTERPRISE — VELATRIX AOS
## Precatórios & Liquidez Judicial v3.0

### 1. Visão Geral e Fundamento Normativo
O módulo **Precatórios & Liquidez Judicial v3.0** foi projetado para operar a originação, auditoria preventiva, precificação atuarial, formalização notarial e liquidação de créditos judiciais requisitórios contra a Fazenda Pública Federal, Estadual e Municipal.

O pipeline adere estritamente aos marcos legais vinculantes:
1. **Art. 100 da Constituição Federal de 1988**: Regime constitucional de precatórios, superpreferência de créditos alimentares (§ 1º), compensação tributária (§ 11) e cessão de créditos (§§ 13 e 14).
2. **Emenda Constitucional nº 113/2021 (Art. 3º)**: Aplicação obrigatória da **Taxa SELIC pura** a partir de 09/12/2021 como índice unificado de atualização monetária e remuneração de capital, vedada a cumulação com quaisquer outros índices de correção ou juros moratórios.
3. **Lei nº 14.973/2024 (Art. 5º a 8º)**: Disciplina a compensação de precatórios com dívida ativa da União, com teto de até **75% do débito devido por competência mensal**.
4. **Circular BCB nº 3.978/2020 & Resolução COAF nº 40/2021**: KYC/PLD compulsório para operações com valor superior a R$ 50.000,00, com verificação de listas restritivas e declaração de origem lícita.
5. **Lei nº 8.935/1994 & Resolução CNJ nº 235/2016**: Exigência de Escritura Pública Notarial e encadeamento criptográfico para garantia da cadeia dominial de cessões.

---

### 2. Diagrama de Arquitetura dos 6 Engines & Esteira (Mermaid)

```mermaid
flowchart TD
    subgraph INTAKE ["1. Intake & Triagem"]
        FilaTribunal["Fila Orçamentária LOA (TRF1-6 / TJs)"] --> E2["Engine 2: Originação & Triagem"]
        VelatrixInbox["Velatrix Inbox (OCR + NER)"] --> E2
        MarketplaceP2P["Marketplace Interno / Parceiros"] --> E2
    end

    subgraph ENGINE1 ["2. Due Diligence & Auditoria de Risco"]
        E2 --> E1["Engine 1: Due Diligence Automatizada"]
        E1 --> CRAWLERS["Promise.allSettled (Circuit Breaker 15s)"]
        CRAWLERS --> Datajud["CNJ Datajud REST v1"]
        CRAWLERS --> DJEN["DJEN (Comunicações PJe)"]
        CRAWLERS --> STFPush["STF Push API"]
        CRAWLERS --> STJPush["STJ Push API"]
        CRAWLERS --> TRFPortal["Portal Oficial do Tribunal"]
        E1 --> E1B["Engine 1b: Risk Score (0-100)"]
        E1B -->|Penhora Ativa / Litispendência| Bloqueio["Bloqueio Preventivo (Score 0)"]
    end

    subgraph ENGINE3 ["3. Precificação & Liquidação Econômica"]
        E1B --> E3["Engine 3: Precificação & VPL"]
        E3 --> SegCalculo["Atualização Segmentada: IPCA-E / TR / SELIC EC 113"]
        E3 --> VPLCalc["Cálculo VPL com Prêmio de Risco: (100 - Score) * 0.001"]
        E3 --> TermoProp["Geração da Proposta Vinculante (SHA-256 no sha256Store)"]
    end

    subgraph ENGINE5 ["4. Formalização & Compensação"]
        TermoProp --> KindSelector{"PrecatorioKind (Bifurcação)"}
        KindSelector -->|originacao_para_cessao| EscrituraNotarial["Escritura Pública Notarial (Lei 8.935/94)"]
        KindSelector -->|compensacao_tributaria| E5["Engine 5: Compensação Tributária (Lei 14.973/24)"]
        E5 --> Limite75["Aplicação Teto 75%/mês e PER/DCOMP PGFN"]
    end

    subgraph ENGINE6 ["5. Compliance, Cadeia Merkle & BaaS Split"]
        EscrituraNotarial --> E6["Engine 6: Compliance & BaaS"]
        Limite75 --> E6
        E6 --> KYC["KYC/PLD (BCB 3.978/2020 p/ ops >= R$ 50k)"]
        E6 --> MerkleChain["CessaoLedger (hash_n = SHA-256 encadeado)"]
        E6 --> BaaSSplit["Split Pix Automático Celcoin (Credor + Honorários + Fee)"]
    end

    subgraph ENGINE4 ["6. Monitoramento Contínuo"]
        MerkleChain --> E4["Engine 4: Monitoramento Real-Time"]
        E4 --> PollerDatajud["Poller 15m Diff-Hash (Datajud)"]
        PollerDatajud --> Triggers{"Triggers Judiciais"}
        Triggers -->|Ordem de Pagamento / Sequestro / LOA| MultiCanal["Alerta: Email / SMS / Push / Webhook"]
    end
```

---

### 3. Matriz dos 6 Engines Especializados

| Engine | Arquivo | Responsabilidade | Fontes Oficiais |
|---|---|---|---|
| **Engine 1** | `dueDiligenceEngine.ts` | Auditoria de penhoras, impugnações e litispendência | CNJ Datajud REST, DJEN PJe, STF Push, STJ Push |
| **Engine 1b** | `riskScoreEngine.ts` | Score ponderado 0-100 (Ente 35%, Estabilidade 25%, Histórico 20%, Natureza 10%, Cadeia 10%) | Heurística auditável sem estimativas |
| **Engine 2** | `originacaoEngine.ts` | Query builder composto com filtros por ente, esfera, UF, LOA e score | Fila pública de tribunais, Velatrix Inbox OCR |
| **Engine 3** | `precificacaoEngine.ts` | Atualização monetária segmentada (EC 113) e VPL | SGS 4189 BCB (SELIC), IBGE SIDRA, sha256Store |
| **Engine 4** | `monitoramentoEngine.ts` | Poller real-time com detecção de diff-hash processual | Datajud, Prisma model `PrecatorioMonitor` |
| **Engine 5** | `compensacaoTributariaEngine.ts` | Simulação da Lei 14.973/2024 com teto de 75% por competência | PGFN Regularize, SERPRO API |
| **Engine 6** | `complianceEngine.ts` | KYC/PLD compulsório, Merkle-like Ledger e BaaS Split Pix | Circular BCB 3.978/2020, Celcoin BaaS |

---

### 4. Zero Dados Estimados & Resiliência
- Se um tribunal estiver indisponível ou com circuit breaker aberto, o sistema exibe `— dado não disponível —` com opção de reconsulta e hash de auditoria.
- Timeout de 15s com 3 retries e exponential backoff.
- Cache inteligente TanStack/Memory com TTL de 4 horas para todas as consultas a tribunais.

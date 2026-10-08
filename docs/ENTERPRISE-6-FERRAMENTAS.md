# Velatrix AOS · 6 Ferramentas Enterprise — núcleo de regras

Módulos puros (sem dependências), testáveis com `npm run test:enterprise` (Node 22+).

```mermaid
flowchart LR
  C[1 · Connect<br/>polling APIs oficiais] -->|documento + hash| L[(Audit Ledger<br/>SHA-256 + JCS)]
  C -->|evento| W[6 · HITL WorkItem<br/>READY_FOR_REVIEW]
  D[2 · Motor determinístico<br/>SELIC · EC 113 · NCM] --> G[2 · Guardrail<br/>números + citações]
  N[(NormaRef)] --> G
  N --> R[3 · Shield de Risco<br/>flag GREEN/YELLOW/RED/NÃO AVALIADO]
  R --> W
  J[4 · Jurimetria<br/>P10/P50/P90 · VPL] -->|proposta rascunho| W
  G --> W
  W -->|Aprovar e Executar<br/>RBAC + registro + step-up + 4 olhos| X[Executores idempotentes]
  X --> S[5 · Selo<br/>SHA-256 · RFC 3161 · PAdES]
  S --> L
  Z[5 · ZDR<br/>LLM_TIER · PII tokens · DEK/tenant] -.protege.-> G
```

| Ferramenta | Arquivo | Correção sobre a especificação original |
|---|---|---|
| 1 Connect | `src/enterprise/connect.ts` | Portais gov não têm webhook → polling. PER/DCOMP, DET, DEC: não suportado |
| 2 Guardrail | `deterministicEngine.ts`, `guardrail.ts`, `normaRef.ts` | "Zero erro" → bloqueio de todo número/citação não rastreável |
| 3 Shield | `riskShield.ts` | Catálogo versionado (não "40"); Tema 736 exclui multa isolada 50%; sem dados = NÃO AVALIADO |
| 4 Jurimetria | `jurimetria.ts` | Distribuição, não "data real"; n ≥ 30; sem perfil de juiz/perito |
| 5 ZDR/Selo | `zdr.ts`, `server/enterprise/{envelopeCrypto,laudoSeal,hash}.ts` | "Ponta a ponta" → "em trânsito e em repouso, com chave por cliente"; sem ACT = sem carimbo |
| 6 HITL | `hitl.ts` | Agentes só criam DRAFT/READY; 4 olhos; hash revisado = payload atual |

Pendente (exige `npm install`): rotas Express, modelos Prisma + migration, telas React, troca de `sha256Sync` nos 3 componentes que o usam.

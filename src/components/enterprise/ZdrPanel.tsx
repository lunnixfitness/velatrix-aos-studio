import React, { useMemo, useState } from 'react';
import { EyeOff, ServerCog, KeyRound } from 'lucide-react';
import { redigir, reidratar, TEXTO_CRIPTO } from '../../enterprise/zdr.ts';

const EXEMPLO = 'Cliente Maria Souza, CPF 529.982.247-25, CNPJ 11.222.333/0001-81, e-mail maria@exemplo.com.br, processo 0001234-56.2024.8.26.0100.';

const SUBPROCESSADORES = [
  { nome: 'Provedor de LLM (Gemini API paga ou Vertex AI)', finalidade: 'Redação de textos', dados: 'Texto com dados pessoais trocados por códigos', retencao: '[CONFIRMAR NO CONTRATO]' },
  { nome: 'LLM local (Qwen)', finalidade: 'Redação quando o cliente exige “só local”', dados: 'Nenhum dado sai do ambiente', retencao: 'n/a' },
  { nome: 'Provedor BaaS', finalidade: 'Split e liquidação', dados: 'Dados bancários e valores', retencao: '[CONFIRMAR NO CONTRATO]' },
  { nome: 'KMS', finalidade: 'Chaves de criptografia por cliente', dados: 'Chaves (nunca dados do cliente)', retencao: '[CONFIRMAR NO CONTRATO]' },
  { nome: 'Serviço de e-mail', finalidade: 'Notificações', dados: 'Nome e e-mail do usuário', retencao: '[CONFIRMAR NO CONTRATO]' },
];

export const ZdrPanel: React.FC = () => {
  const [texto, setTexto] = useState(EXEMPLO);
  const [nomes, setNomes] = useState('Maria Souza');
  const r = useMemo(() => redigir(texto, nomes.split(',').map((n) => n.trim()).filter(Boolean)), [texto, nomes]);
  const volta = useMemo(() => reidratar(r.texto, r.mapa), [r]);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Confidencialidade & Retenção Zero</h2>
        <p className="text-[13.5px] text-ink-mute max-w-3xl">Antes de qualquer texto sair para um LLM externo, dados pessoais são trocados por códigos reversíveis que ficam só no servidor. Em produção o sistema só sobe com a API paga ou Vertex AI configurada; sem isso, a promessa de “dados não usados para treinar modelos” não é exibida.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink"><ServerCog className="w-4 h-4 text-accent" /> Política do LLM</div>
          <div className="text-[12.5px] text-ink-2">Configuração de produção (LLM_TIER) é lida só no servidor.</div>
          <span className="inline-block text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-warn-soft text-warn">Não confirmada neste ambiente</span>
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink"><KeyRound className="w-4 h-4 text-accent" /> Criptografia</div>
          <div className="text-[12.5px] text-ink-2">{TEXTO_CRIPTO} AES-256-GCM, chave por cliente guardada no KMS.</div>
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink"><EyeOff className="w-4 h-4 text-accent" /> Só local</div>
          <div className="text-[12.5px] text-ink-2">O cliente pode exigir LLM apenas local: nenhum dado sai do ambiente.</div>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
        <div className="text-[14px] font-semibold text-ink">Teste de redação de dados pessoais</div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Texto original
              <textarea rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} className="px-3 py-2.5 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
            </label>
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Nomes das partes (separados por vírgula)
              <input value={nomes} onChange={(e) => setNomes(e.target.value)} className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[12.5px] font-medium text-ink-2 mb-1.5">O que vai para o LLM</div>
              <p className="px-3 py-2.5 rounded-lg bg-surface text-[13px] text-ink font-mono leading-relaxed break-words">{r.texto}</p>
            </div>
            <div className="text-[12px] text-ink-mute">Substituições: {Object.entries(r.contagem).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nenhuma'} · Reidratação na volta: {volta === texto ? 'idêntica ao original' : 'diferente'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
        <div className="px-5 py-3 border-b border-hairline text-[13px] font-semibold text-ink">Registro de subprocessadores (para o contrato de tratamento de dados com o cliente)</div>
        {SUBPROCESSADORES.map((s) => (
          <div key={s.nome} className="grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)] gap-2 md:gap-4 px-5 py-3 border-b border-hairline last:border-b-0 text-[12.5px]">
            <span className="font-medium text-ink">{s.nome}</span><span className="text-ink-2">{s.finalidade}</span><span className="text-ink-2">{s.dados}</span><span className="text-ink-mute">{s.retencao}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZdrPanel;

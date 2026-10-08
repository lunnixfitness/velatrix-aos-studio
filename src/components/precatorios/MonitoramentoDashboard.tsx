import React, { useState } from 'react';
import { Activity, Bell, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { monitoramentoEngine } from '../../services/precatorios/monitoramentoEngine';
import { EventoProcessualDetectado } from '../../types/precatorios';

interface MonitoramentoDashboardProps {
  precatorioId: string;
  tribunal?: string;
  numeroProcesso?: string;
}

export const MonitoramentoDashboard: React.FC<MonitoramentoDashboardProps> = ({
  precatorioId,
  tribunal = 'TRF3',
  numeroProcesso = '5002145-12.2021.4.03.6100'
}) => {
  const [data, setData] = useState(() => monitoramentoEngine.getMonitoramento(precatorioId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleReconsultar = async () => {
    setIsRefreshing(true);
    // Simula trigger de reconsulta no Datajud
    await new Promise(r => setTimeout(r, 600));
    setData(monitoramentoEngine.getMonitoramento(precatorioId));
    setIsRefreshing(false);
  };

  const { assinatura, eventos, pollerStatus } = data;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Monitoramento Real-Time & Triggers Judiciais
            </div>
            <h4 className="text-sm font-bold text-white">
              {tribunal} • Autos {numeroProcesso}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReconsultar}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Consultando...' : 'Reconsultar Tribunal'}</span>
          </button>
        </div>
      </div>

      {/* Status do Poller & Canais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Frequência Poller</span>
          <span className="text-slate-200 font-bold mt-1 block">A cada {pollerStatus.intervaloMinutos} minutos</span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Monitor Ativo 24/7
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Canais Notificação</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(assinatura?.canaisAlerta || ['EMAIL', 'PUSH', 'IN_APP']).map(canal => (
              <span key={canal} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[10px]">
                {canal}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Triggers Monitoradas</span>
          <span className="text-slate-200 font-bold mt-1 block">
            {assinatura?.triggers?.length || 4} eventos processuais
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ordem pagto, Sequestro, Embargos</span>
        </div>
      </div>

      {/* Lista de Eventos Detectados */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
          Histórico de Movimentações Processuais Auditadas
        </div>

        {eventos.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-mono text-xs text-center">
            — dado não disponível ou nenhuma movimentação recente —{' '}
            <button
              type="button"
              onClick={handleReconsultar}
              className="text-cyan-400 underline hover:text-cyan-300 ml-1 cursor-pointer"
            >
              [Reconsultar]
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {eventos.map(evt => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200 font-mono flex items-center gap-2">
                      <span>{evt.trigger}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {evt.tribunalOrigem}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{evt.descricao}</p>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Hash Verificação: {evt.documentoHash}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(evt.dataOcorrencia).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

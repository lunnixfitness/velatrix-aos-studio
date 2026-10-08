import { 
  TaxProfessional, 
  ProspectLead, 
  ReassignmentLog 
} from '../data/mockOfficeData';
import { 
  saveProspectLead, 
  updateProspectLeadStage 
} from './dataService';


export interface DistributionResult {
  updatedLead: ProspectLead;
  updatedProfessionals: TaxProfessional[];
  assignedTo: TaxProfessional | null;
  isWaiting: boolean;
  explanation: string;
}

export interface BatchDistributionResult {
  updatedLeads: ProspectLead[];
  updatedProfessionals: TaxProfessional[];
  distributedCount: number;
  newlyAssigned: Array<{ lead: ProspectLead; professional: TaxProfessional }>;
}

export interface TeamLoadSummary {
  totalProfessionals: number;
  activeInQueueCount: number;
  availableCount: number;
  totalCapacity: number;
  totalActiveAssigned: number;
  capacityUtilizationPercent: number;
  waitingQueueCount: number;
  lawyersCount: number;
  accountantsCount: number;
  equilibriumStatus: 'BALANCED' | 'HIGH_LOAD' | 'FULL_CAPACITY' | 'WAITING_OVERFLOW';
  equilibriumMessage: string;
}

/**
 * Formata timestamp brasileiro padrão (YYYY-MM-DD HH:mm)
 */
export const getFormattedTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * MOTOR DE FILA (Round-Robin com Balanceamento de Carga):
 * Regras:
 * 1. Apenas profissionais com status "Disponível", activeInQueue === true e activeLeadsCount < maxCapacity.
 * 2. Prioriza menor carga atual (menor activeLeadsCount).
 * 3. Como desempate, menor taxa de ocupação (activeLeadsCount / maxCapacity).
 * 4. Como desempate final, quem está há mais tempo sem receber lead (lastAssignedAt mais antigo).
 * 5. Se todos estiverem na capacidade máxima, o lead é colocado na Fila de Espera (WAITING_DISTRIBUTION).
 */
export const distributeLead = (
  lead: ProspectLead,
  professionals: TaxProfessional[]
): DistributionResult => {
  const eligible = professionals.filter(
    p => p.activeInQueue && p.status === 'Disponível' && p.activeLeadsCount < p.maxCapacity
  );

  // Sem profissionais disponíveis com capacidade livre -> Coloca na Fila de Espera
  if (eligible.length === 0) {
    const updatedLead: ProspectLead = {
      ...lead,
      assignmentStatus: 'WAITING_DISTRIBUTION',
      assignedProfessionalId: undefined,
      responsibleName: 'Aguardando Distribuição (Fila)',
      responsibleRole: undefined,
      assignedAt: undefined
    };

    return {
      updatedLead,
      updatedProfessionals: professionals,
      assignedTo: null,
      isWaiting: true,
      explanation: 'Todos os profissionais tributários estão no limite de capacidade ou indisponíveis. Lead encaminhado para a Fila de Espera.'
    };
  }

  // Ordenação por menor carga e critério de desempate temporal (round-robin)
  const sorted = [...eligible].sort((a, b) => {
    // 1º Critério: Menor quantidade absoluta de leads na carteira
    if (a.activeLeadsCount !== b.activeLeadsCount) {
      return a.activeLeadsCount - b.activeLeadsCount;
    }

    // 2º Critério: Menor taxa de ocupação percentual
    const ratioA = a.activeLeadsCount / a.maxCapacity;
    const ratioB = b.activeLeadsCount / b.maxCapacity;
    if (ratioA !== ratioB) {
      return ratioA - ratioB;
    }

    // 3º Critério: Há mais tempo sem receber atribuição (lastAssignedAt mais antigo)
    const timeA = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
    const timeB = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
    return timeA - timeB;
  });

  const selectedProfessional = sorted[0];
  const timestamp = getFormattedTimestamp();

  // Atualiza profissional selecionado
  const updatedProfessionals = professionals.map(p => {
    if (p.id === selectedProfessional.id) {
      const newCount = p.activeLeadsCount + 1;
      return {
        ...p,
        activeLeadsCount: newCount,
        lastAssignedAt: timestamp,
        status: (newCount >= p.maxCapacity ? 'Ocupado' : 'Disponível') as TaxProfessional['status']
      };
    }
    return p;
  });

  // Atualiza lead com o profissional designado
  const updatedLead: ProspectLead = {
    ...lead,
    assignedProfessionalId: selectedProfessional.id,
    responsibleName: selectedProfessional.name,
    responsibleRole: selectedProfessional.role,
    assignedAt: timestamp,
    assignmentStatus: 'ASSIGNED'
  };

  return {
    updatedLead,
    updatedProfessionals,
    assignedTo: selectedProfessional,
    isWaiting: false,
    explanation: `Lead atribuído com sucesso para ${selectedProfessional.name} (${selectedProfessional.role}) pelo critério de menor carga (${selectedProfessional.activeLeadsCount + 1}/${selectedProfessional.maxCapacity}).`
  };
};

/**
 * Processa e distribui leads que estão na fila de espera aguardando liberação de vagas
 */
export const distributeWaitingQueue = (
  leads: ProspectLead[],
  professionals: TaxProfessional[]
): BatchDistributionResult => {
  let currentProfessionals = [...professionals];
  const updatedLeads: ProspectLead[] = [];
  const newlyAssigned: Array<{ lead: ProspectLead; professional: TaxProfessional }> = [];
  let distributedCount = 0;

  for (const lead of leads) {
    if (lead.assignmentStatus === 'WAITING_DISTRIBUTION') {
      const result = distributeLead(lead, currentProfessionals);
      if (!result.isWaiting && result.assignedTo) {
        updatedLeads.push(result.updatedLead);
        currentProfessionals = result.updatedProfessionals;
        newlyAssigned.push({ lead: result.updatedLead, professional: result.assignedTo });
        distributedCount++;
      } else {
        updatedLeads.push(lead);
      }
    } else {
      updatedLeads.push(lead);
    }
  }

  return {
    updatedLeads,
    updatedProfessionals: currentProfessionals,
    distributedCount,
    newlyAssigned
  };
};

/**
 * Reatribuição manual por um Gerente com justificativa e histórico
 */
export const reassignLead = (
  lead: ProspectLead,
  newProfessionalId: string,
  professionals: TaxProfessional[],
  reason: string,
  reassignedBy: string
): {
  updatedLead: ProspectLead;
  updatedProfessionals: TaxProfessional[];
  previousProfessional?: TaxProfessional;
  newProfessional?: TaxProfessional;
} => {
  const previousProf = professionals.find(p => p.id === lead.assignedProfessionalId);
  const newProf = professionals.find(p => p.id === newProfessionalId);

  if (!newProf) {
    throw new Error('Profissional de destino não encontrado.');
  }

  const timestamp = getFormattedTimestamp();

  // Histórico de Reatribuição
  const reassignmentLog: ReassignmentLog = {
    previousProfessionalName: previousProf ? previousProf.name : 'Fila de Espera',
    newProfessionalName: newProf.name,
    reason,
    timestamp,
    reassignedBy
  };

  const updatedHistory = [...(lead.reassignmentHistory || []), reassignmentLog];

  // Atualiza contadores de carga da equipe
  const updatedProfessionals = professionals.map(p => {
    if (previousProf && p.id === previousProf.id) {
      return {
        ...p,
        activeLeadsCount: Math.max(0, p.activeLeadsCount - 1),
        status: (p.status === 'Ocupado' && p.activeLeadsCount - 1 < p.maxCapacity ? 'Disponível' : p.status) as TaxProfessional['status']
      };
    }
    if (p.id === newProf.id) {
      const newCount = p.activeLeadsCount + 1;
      return {
        ...p,
        activeLeadsCount: newCount,
        lastAssignedAt: timestamp,
        status: (newCount >= p.maxCapacity ? 'Ocupado' : p.status) as TaxProfessional['status']
      };
    }
    return p;
  });

  const updatedLead: ProspectLead = {
    ...lead,
    assignedProfessionalId: newProf.id,
    responsibleName: newProf.name,
    responsibleRole: newProf.role,
    assignedAt: timestamp,
    assignmentStatus: 'ASSIGNED',
    reassignmentHistory: updatedHistory
  };

  return {
    updatedLead,
    updatedProfessionals,
    previousProfessional: previousProf,
    newProfessional: newProf
  };
};

/**
 * Libera capacidade de um profissional quando o lead é concluído / fechado
 */
export const releaseLeadCapacity = (
  lead: ProspectLead,
  professionals: TaxProfessional[]
): TaxProfessional[] => {
  if (!lead.assignedProfessionalId) return professionals;

  return professionals.map(p => {
    if (p.id === lead.assignedProfessionalId) {
      const newCount = Math.max(0, p.activeLeadsCount - 1);
      return {
        ...p,
        activeLeadsCount: newCount,
        status: (p.status === 'Ocupado' && newCount < p.maxCapacity ? 'Disponível' : p.status) as TaxProfessional['status']
      };
    }
    return p;
  });
};

/**
 * Calcula resumo executivo da carga da equipe tributária para o painel do Gestor
 */
export const calculateTeamLoadSummary = (
  professionals: TaxProfessional[],
  leads: ProspectLead[]
): TeamLoadSummary => {
  const totalProfessionals = professionals.length;
  const activeInQueueCount = professionals.filter(p => p.activeInQueue).length;
  const availableCount = professionals.filter(
    p => p.activeInQueue && p.status === 'Disponível' && p.activeLeadsCount < p.maxCapacity
  ).length;

  const totalCapacity = professionals.reduce((acc, p) => acc + (p.activeInQueue ? p.maxCapacity : 0), 0);
  const totalActiveAssigned = professionals.reduce((acc, p) => acc + (p.activeInQueue ? p.activeLeadsCount : 0), 0);
  
  const capacityUtilizationPercent = totalCapacity > 0
    ? Math.round((totalActiveAssigned / totalCapacity) * 100)
    : 0;

  const waitingQueueCount = leads.filter(l => l.assignmentStatus === 'WAITING_DISTRIBUTION').length;
  const lawyersCount = professionals.filter(p => p.role === 'Advogado').length;
  const accountantsCount = professionals.filter(p => p.role === 'Contador').length;

  let equilibriumStatus: TeamLoadSummary['equilibriumStatus'] = 'BALANCED';
  let equilibriumMessage = 'Fila operacional equilibrada com margem de absorção segura.';

  if (waitingQueueCount > 0) {
    equilibriumStatus = 'WAITING_OVERFLOW';
    equilibriumMessage = `Atenção: ${waitingQueueCount} lead(s) aguardando vaga na fila de espera por limite de capacidade.`;
  } else if (capacityUtilizationPercent >= 90) {
    equilibriumStatus = 'FULL_CAPACITY';
    equilibriumMessage = 'Capacidade crítica: equipe próxima de 100% de ocupação.';
  } else if (capacityUtilizationPercent >= 70) {
    equilibriumStatus = 'HIGH_LOAD';
    equilibriumMessage = 'Carga moderada/alta: monitore a disponibilidade para novos ingressos.';
  }

  return {
    totalProfessionals,
    activeInQueueCount,
    availableCount,
    totalCapacity,
    totalActiveAssigned,
    capacityUtilizationPercent,
    waitingQueueCount,
    lawyersCount,
    accountantsCount,
    equilibriumStatus,
    equilibriumMessage
  };
};

/**
 * Adiciona um novo lead no motor, executa a distribuição automática e persiste no banco de dados
 */
export const addAndDistributeLead = async (
  draftLead: ProspectLead,
  professionals: TaxProfessional[]
): Promise<DistributionResult> => {
  const result = distributeLead(draftLead, professionals);
  try {
    await saveProspectLead(result.updatedLead);
  } catch (err) {
    console.debug('[leadDistributionEngine] addAndDistributeLead persistence fallback:', err);
  }
  return result;
};

/**
 * Atualiza o estágio do lead no funil e sincroniza com PATCH /api/v1/data/prospects/:id/stage
 */
export const updateLeadStage = async (
  leadId: string,
  newStage: ProspectLead['stage']
): Promise<boolean> => {
  try {
    return await updateProspectLeadStage(leadId, newStage);
  } catch (err) {
    console.debug('[leadDistributionEngine] updateLeadStage persistence fallback:', err);
    return false;
  }
};



"""
FastAPI & LangGraph Swarm Registry for Velatrix AOS (200 Neural Nodes).
Provides sector-based routing by CNAE, context isolation (Multi-Tenant RAG),
and consensus protocols with C-Level Zero-GUI escalation.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class SwarmAgentNode:
    id: str
    code: str
    name: str
    swarm_id: str
    cnae_range: str
    role_description: str
    risk_level: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    requires_zero_gui_approval: bool
    approval_threshold_brl: float
    rag_context_isolation: str  # 'TENANT_STRICT_RAG' | 'SECTOR_HYBRID_RAG' | 'GLOBAL_CORE_RAG'

class VelatrixSwarmRouter:
    """
    Router Agent responsible for inspecting the client's CNAE,
    activating the specific sector swarm + Core Financial Swarm,
    and enforcing Zero-GUI WhatsApp escalation for operations > R$ 10.000.
    """
    
    SECTOR_SWARMS = {
        "b3_financial": {
            "path": "/app/agents/swarms/b3_financial/",
            "cnae_prefix": ["64", "65", "66"],
            "agent_count": 18,
            "description": "Valuation, Solvência Basileia III, CVM 175, Risk-Profit Warning"
        },
        "agribusiness": {
            "path": "/app/agents/swarms/agribusiness/",
            "cnae_prefix": ["01", "02", "03"],
            "agent_count": 18,
            "description": "Hedge CBOT/B3, Barter CPR Verde, IoT Solo, OEE Rural"
        },
        "retail_omni": {
            "path": "/app/agents/swarms/retail_omni/",
            "cnae_prefix": ["47"],
            "agent_count": 18,
            "description": "Ruptura de Gôndola, Last-Mile, Loss Prevention, Pricing Dinâmico"
        },
        "real_estate": {
            "path": "/app/agents/swarms/real_estate/",
            "cnae_prefix": ["41", "42", "43", "68"],
            "agent_count": 18,
            "description": "Medição BIM, Reajuste INCC/IGP-M, VGV/Inadimplência, Distratos"
        },
        "energy_utilities": {
            "path": "/app/agents/swarms/energy_utilities/",
            "cnae_prefix": ["35"],
            "agent_count": 18,
            "description": "Contratos CCEE, Balanço Elétrico PLD, FinOps Demanda"
        },
        "telecom_saas": {
            "path": "/app/agents/swarms/telecom_saas/",
            "cnae_prefix": ["61", "62", "63"],
            "agent_count": 18,
            "description": "Churn Preditivo, Telemetria SaaS, FinOps Cloud AWS/GCP, SLA Anatel"
        },
        "education": {
            "path": "/app/agents/swarms/education/",
            "cnae_prefix": ["85"],
            "agent_count": 18,
            "description": "Evasão Preditiva LMS, Repasse FIES/Prouni, Ocupação de Turmas"
        },
        "public_sector": {
            "path": "/app/agents/swarms/public_sector/",
            "cnae_prefix": ["84"],
            "agent_count": 18,
            "description": "LRF Responsabilidade Fiscal, Auditoria de Editais, Ledger Transparência"
        }
    }

    CORE_SWARMS = {
        "core_financial": {
            "path": "/app/agents/swarms/core_financial/",
            "agent_count": 20,
            "description": "Fluxo D+0, DDA Bancário, Liquidez & Working Capital"
        },
        "core_risk_security": {
            "path": "/app/agents/swarms/core_risk_security/",
            "agent_count": 18,
            "description": "Zero-Trust PIX Hijack, Multi-Sig Quorum, MitM Invoice Guard"
        },
        "core_supply_manufacturing": {
            "path": "/app/agents/swarms/core_supply_manufacturing/",
            "agent_count": 18,
            "description": "BOM Industrial, MRP Autônomo, OEE Máquinas"
        }
    }

    @classmethod
    def route_request(cls, tenant_id: str, cnae_code: str, estimated_financial_impact_brl: float) -> Dict[str, Any]:
        """
        Determines active swarms based on CNAE and enforces C-Level Zero-GUI escalation
        if financial impact exceeds R$ 10.000.
        """
        clean_cnae = cnae_code.replace(".", "").strip()[:2]
        target_sector_id = "core_supply_manufacturing"
        
        for sector_id, info in cls.SECTOR_SWARMS.items():
            if any(clean_cnae.startswith(prefix) for prefix in info["cnae_prefix"]):
                target_sector_id = sector_id
                break
                
        active_swarms = [
            "core_financial",
            "core_risk_security",
            target_sector_id
        ]
        
        requires_zero_gui = estimated_financial_impact_brl > 10000.0
        
        return {
            "tenant_id": tenant_id,
            "cnae_matched": cnae_code,
            "active_swarms": active_swarms,
            "rag_context_isolation": "TENANT_STRICT_RAG",
            "requires_c_level_zero_gui": requires_zero_gui,
            "approval_channel": "WhatsApp HSM Multi-Sig" if requires_zero_gui else "Autonomous Execution",
            "risk_status": "HIGH_RISK_ESCALATED" if requires_zero_gui else "NOMINAL_AUTONOMOUS"
        }

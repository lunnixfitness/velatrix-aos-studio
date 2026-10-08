import React from 'react';
import { LeituraDocumentosPanel } from '../documentos/LeituraDocumentosPanel';

/**
 * P26a — a aba "Leitura de documentos" (escudo_edge) passou a ler de verdade.
 * O antigo EdgeMultimodalIngestion (resultado fixo por preset, com exemplos
 * industriais) saiu da tela; o arquivo continua no repositório só como histórico.
 */
interface EscudoEdgeViewProps {
  onIngestComplete?: (data: unknown) => void;
  isProcessing?: boolean;
}

export const EscudoEdgeView: React.FC<EscudoEdgeViewProps> = () => (
  <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
    <LeituraDocumentosPanel />
  </div>
);

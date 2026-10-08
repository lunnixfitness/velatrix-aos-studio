import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { GraphHealthProvider } from './context/GraphHealthContext';
import { DreProvider } from './context/DreContext';
import { initAuthFetchInterceptor } from './services/authClient';
import { ensurePdfDemoWatermark, IS_DEMO_MODE } from './lib/demoMode';

// Modo demonstração: todo PDF gerado recebe marca d'água "DEMONSTRAÇÃO · SEM VALIDADE".
ensurePdfDemoWatermark();
if (IS_DEMO_MODE) document.documentElement.setAttribute('data-demo', 'true');

// Initialize global authenticated fetch interceptor (Bearer token injection and 401 logout)
initAuthFetchInterceptor();

// Handle benign sandbox websocket disconnection events cleanly
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (reasonStr.includes('WebSocket closed without opened') || reasonStr.includes('failed to connect to websocket')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!, {
  // Erros recuperáveis (React refaz o render em modo síncrono) escondem a causa real: logamos cause + component stack.
  onRecoverableError(error, info) {
    const cause = (error as { cause?: unknown })?.cause;
    console.error(
      '[React recoverable]',
      cause instanceof Error ? `${cause.name}: ${cause.message}\n${cause.stack ?? ''}` : String(cause ?? error),
      info?.componentStack ?? ''
    );
  },
}).render(
  <StrictMode>
    <AuthProvider>
      <GraphHealthProvider>
        <DreProvider>
          <App />
        </DreProvider>
      </GraphHealthProvider>
    </AuthProvider>
  </StrictMode>,
);

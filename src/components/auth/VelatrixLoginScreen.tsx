import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Velatrix Console · Login (Minimalist Enterprise White)
 * Fonte de verdade visual: canvas "Velatrix Console — Redesign" › Login.dc.html
 *
 * Segurança:
 *  - Nenhuma senha hardcoded no bundle (o antigo "Velatrix@2026" foi removido).
 *  - Tenant é derivado do usuário no servidor (POST /api/v1/auth/login); não é
 *    mais escolhido no cliente.
 *  - Atalhos de e-mail de teste só existem em build de desenvolvimento.
 */

interface VelatrixConsoleLoginProps {
  onLoginSuccess?: () => void;
}

const DEV_QUICK_ACCOUNTS: { label: string; email: string }[] = [
  { label: 'Super Admin', email: 'admin@velatrix.ai' },
  { label: 'Tenant Admin', email: 'gestor@nexuslog.com.br' },
  { label: 'CEO', email: 'ceo@velatrix.ai' },
  { label: 'CFO', email: 'cfo@velatrix.ai' },
  { label: 'Operador', email: 'operacoes@velatrix.ai' },
  { label: 'Parceiro', email: 'parceiro@vasconcelosadv.com.br' },
];

const TEST_DEV_PASSWORD = 'Velatrix@SecurePassword2026!';

// Substituído estaticamente pelo Vite: o bloco de dev (e a senha de teste) é removido do bundle de produção.
const isDevBuild = import.meta.env.DEV;

const inputCls =
  'h-11 w-full rounded-lg border border-[#D5DCE4] bg-[#FFFFFF] px-3.5 text-[14px] font-normal text-[#0A1628] ' +
  'placeholder:text-[#9AA7B5] outline-none transition focus:border-[#0B4571] focus:ring-2 focus:ring-[#0B4571]/15';

const VelatrixMark: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 2 29 9.5v13L16 30 3 22.5v-13Z" stroke="#29B5E8" strokeWidth="2" />
    <path d="M9 11l7 11 7-11" stroke="#0B4571" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const VelatrixConsoleLogin: React.FC<VelatrixConsoleLoginProps> = ({ onLoginSuccess }) => {
  const { login, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim()) return setError('Informe seu e-mail corporativo.');
    if (!password) return setError('Informe sua senha.');

    setIsLoading(true);
    try {
      const ok = await login({ email: email.trim(), password });
      if (ok) {
        onLoginSuccess?.();
      } else {
        setError('Credenciais inválidas. Verifique e-mail e senha.');
      }
    } catch (err: any) {
      setError(err?.message || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotEmail.trim()) return setForgotMsg({ ok: false, text: 'Informe o e-mail cadastrado.' });
    setIsResetting(true);
    try {
      const r = await requestPasswordReset(forgotEmail.trim());
      setForgotMsg({ ok: r.success, text: r.message });
    } catch (err: any) {
      setForgotMsg({ ok: false, text: err?.message || 'Falha ao solicitar redefinição.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FFFFFF] font-sans text-[#0A1628] antialiased">
      {/* Painel institucional */}
      <aside className="hidden w-[640px] shrink-0 flex-col justify-between border-r border-[#EAEEF3] bg-[#FAFBFC] px-[72px] py-16 lg:flex">
        <div className="flex items-center gap-3">
          <VelatrixMark />
          <span className="text-[17px] font-bold tracking-[0.16em]">VELATRIX</span>
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B4571]">
            Sistema Operacional Autônomo
          </span>
          <h1 className="m-0 text-[40px] font-semibold leading-[1.15] tracking-[-0.015em]">
            Decisões operacionais autônomas, seguras e criptograficamente auditáveis em tempo real.
          </h1>
          <p className="m-0 max-w-[460px] text-[15px] leading-relaxed text-[#5A6B7C]">
            Recuperação tributária, perícia judicial, INSS, INSS-Obras e precatórios em esteiras padronizadas, com
            laudos selados e split automático.
          </p>
        </div>

        <div className="flex gap-6 font-mono text-[12px] text-[#5A6B7C]">
          <span>SHA-256</span>
          <span>ICP-Brasil A1</span>
          <span>LGPD</span>
          <span>Ledger auditável</span>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <VelatrixMark size={28} />
            <span className="text-[15px] font-bold tracking-[0.16em]">VELATRIX</span>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[24px] font-semibold">Entrar no console</h2>
                <span className="text-[14px] text-[#5A6B7C]">Acesse o ambiente do seu escritório.</span>
              </div>

              {error && (
                <div role="alert" className="rounded-lg border border-[#F1C7BF] bg-[#FDF3F1] px-3.5 py-2.5 text-[13px] text-[#B4321F]">
                  {error}
                </div>
              )}
              {notice && (
                <div role="status" className="rounded-lg border border-[#C9DCEB] bg-[#F1F6FA] px-3.5 py-2.5 text-[13px] text-[#0B4571]">
                  {notice}
                </div>
              )}

              <label htmlFor="vx-email" className="flex flex-col gap-1.5 text-[13px] font-medium">
                E-mail corporativo
                <input
                  id="vx-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@escritorio.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </label>

              <label htmlFor="vx-pw" className="flex flex-col gap-1.5 text-[13px] font-medium">
                Senha
                <div className="relative">
                  <input
                    id="vx-pw"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls + ' pr-16'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-medium text-[#5A6B7C] hover:text-[#0B4571]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-[13px]">
                <label htmlFor="vx-keep" className="flex items-center gap-2 text-[#1F2D3F]">
                  <input
                    id="vx-keep"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 accent-[#0B4571]"
                  />
                  Manter conectado
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotEmail(email);
                    setForgotMsg(null);
                  }}
                  className="text-[#0B4571] hover:text-[#072F4F]"
                >
                  Esqueci a senha
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded-lg bg-[#0B4571] text-[14px] font-semibold text-[#FFFFFF] transition hover:bg-[#093A60] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Autenticando…' : 'Entrar'}
              </button>

              <div className="flex items-center gap-3 text-[12px] text-[#5A6B7C]">
                <span className="h-px flex-1 bg-[#EAEEF3]" />
                ou
                <span className="h-px flex-1 bg-[#EAEEF3]" />
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotice('Login por certificado ICP-Brasil A1 requer o conector de assinatura habilitado pelo administrador do escritório.')
                }
                className="h-12 rounded-lg border border-[#D5DCE4] bg-[#FFFFFF] text-[14px] font-medium text-[#0A1628] transition hover:border-[#0B4571]"
              >
                Entrar com certificado ICP-Brasil
              </button>

              {isDevBuild && (
                <div className="mt-2 flex flex-col gap-2.5 border-t border-[#EAEEF3] pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5A6B7C]">
                      Contas & Senha de Teste
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(TEST_DEV_PASSWORD);
                        setNotice(`Senha copiada para o campo: ${TEST_DEV_PASSWORD}`);
                      }}
                      className="font-mono text-[11px] text-[#0B4571] bg-[#F1F6FA] hover:bg-[#E2EDF7] border border-[#C9DCEB] px-2 py-0.5 rounded cursor-pointer transition text-left"
                      title="Clique para preencher a senha"
                    >
                      Senha: <span className="font-bold underline">{TEST_DEV_PASSWORD}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEV_QUICK_ACCOUNTS.map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => {
                          setEmail(a.email);
                          setPassword(TEST_DEV_PASSWORD);
                          setError(null);
                          setNotice(`Credenciais de teste preenchidas para ${a.label} (${a.email})`);
                        }}
                        className="rounded-md border border-[#EAEEF3] bg-[#FAFBFC] px-2.5 py-1 text-[12px] font-medium text-[#1F2D3F] hover:border-[#0B4571] hover:text-[#0B4571] hover:bg-white transition cursor-pointer shadow-xs"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#5A6B7C] m-0">
                    💡 Clique em qualquer perfil acima para preencher automaticamente o e-mail e a senha de teste (<span className="font-mono">{TEST_DEV_PASSWORD}</span>).
                  </p>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-[18px]" noValidate>
              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[24px] font-semibold">Redefinir senha</h2>
                <span className="text-[14px] text-[#5A6B7C]">
                  Enviaremos as instruções para o e-mail cadastrado.
                </span>
              </div>

              {forgotMsg && (
                <div
                  role={forgotMsg.ok ? 'status' : 'alert'}
                  className={
                    'rounded-lg border px-3.5 py-2.5 text-[13px] ' +
                    (forgotMsg.ok
                      ? 'border-[#BFE3D0] bg-[#F0F9F4] text-[#0F7C4A]'
                      : 'border-[#F1C7BF] bg-[#FDF3F1] text-[#B4321F]')
                  }
                >
                  {forgotMsg.text}
                </div>
              )}

              <label htmlFor="vx-forgot" className="flex flex-col gap-1.5 text-[13px] font-medium">
                E-mail corporativo
                <input
                  id="vx-forgot"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@escritorio.com.br"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputCls}
                />
              </label>

              <button
                type="submit"
                disabled={isResetting}
                className="h-12 rounded-lg bg-[#0B4571] text-[14px] font-semibold text-[#FFFFFF] transition hover:bg-[#093A60] disabled:opacity-70"
              >
                {isResetting ? 'Enviando…' : 'Enviar instruções'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[13px] text-[#0B4571] hover:text-[#072F4F]"
              >
                Voltar ao login
              </button>
            </form>
          )}

          <p className="mt-10 text-center text-[12px] text-[#9AA7B5]">
            © 2026 Velatrix · Ambiente com isolamento multi-tenant e trilha de auditoria.
          </p>
        </div>
      </main>
    </div>
  );
};

// Mantém o nome antigo para não quebrar imports existentes (App.tsx).
export const VelatrixLoginScreen = VelatrixConsoleLogin;

export default VelatrixConsoleLogin;

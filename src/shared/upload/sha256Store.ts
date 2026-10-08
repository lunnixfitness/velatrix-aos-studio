export interface ArquivoCustodia {
  filename: string;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
}

export async function registrarCustodiaArquivo(
  filename: string,
  bytes: ArrayBuffer,
  uploadedBy: string = 'Perito Oficial / Velatrix Custody Enclave'
): Promise<ArquivoCustodia> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    filename,
    sha256,
    uploadedAt: new Date().toISOString(),
    uploadedBy
  };
}

export function formatShortSha256(hash: string): string {
  if (!hash || hash.length < 8) return hash || '';
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
}

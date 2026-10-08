import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * VELATRIX AOS · P9 · Teste de Fronteira Cliente/Servidor
 * 
 * Varre recursivamente `src/components`, `src/context` e `src/App.tsx`
 * e garante que NENHUM import alcance código do servidor ou repositórios:
 * - src/server/**
 * - src/lib/prisma.ts
 * - src/lib/tenantMiddleware.ts
 * - src/services/gov/**
 * - src/services/precatorios/complianceEngine.ts
 * - src/services/billing/**
 */

const FORBIDDEN_PATTERNS = [
  /from\s+['"].*\/server(\/.*)?['"]/,
  /from\s+['"].*\/lib\/prisma(\.ts)?['"]/,
  /from\s+['"].*\/lib\/tenantMiddleware(\.ts)?['"]/,
  /from\s+['"].*\/services\/gov\/.+['"]/,
  /from\s+['"].*\/services\/govConnectorService['"]/,
  /from\s+['"].*\/services\/precatorios\/complianceEngine(\.ts)?['"]/,
  /from\s+['"].*\/services\/billing(\/.*)?['"]/
];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('VELATRIX AOS · P9 · Arquitetura de Fronteira Cliente/Servidor', () => {
  it('garante que nenhum componente, contexto ou App.tsx importa código exclusivo do servidor', () => {
    const rootDir = process.cwd();
    const filesToScan: string[] = [
      ...getAllFiles(path.join(rootDir, 'src/components')),
      ...getAllFiles(path.join(rootDir, 'src/context')),
      path.join(rootDir, 'src/App.tsx')
    ].filter(f => fs.existsSync(f));

    expect(filesToScan.length).toBeGreaterThan(10);

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of filesToScan) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(rootDir, file),
              line: index + 1,
              content: line.trim()
            });
          }
        }
      });
    }

    if (violations.length > 0) {
      console.error('[BOUNDARY VIOLATION] Violações de fronteira encontradas:', violations);
    }

    expect(violations).toEqual([]);
  });
});

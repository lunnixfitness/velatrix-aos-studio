import { prisma, isPrismaActive } from '../../lib/prisma';
import { RegisteredUser, ENTERPRISE_USERS_REGISTRY } from '../../data/mockUsers';

function mapPrismaUserToRegistered(u: any): RegisteredUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash || '',
    role: u.role as any,
    tenantId: u.tenantId || 'tenant_agro_cerrado',
    tenantName: u.tenant?.nomeEmpresa || 'Cerrado Grãos & Bioenergia S.A.',
    department: u.department || 'Operações',
    avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isSuperAdmin: u.role === 'SUPER_ADMIN',
  };
}

export async function listUsers(): Promise<RegisteredUser[]> {
  if (!isPrismaActive) {
    return [...ENTERPRISE_USERS_REGISTRY];
  }
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    if (users && users.length > 0) {
      return users.map(mapPrismaUserToRegistered);
    }
  } catch (err) {
    console.warn('[userRepository.listUsers] Prisma fallback:', err);
  }
  return [...ENTERPRISE_USERS_REGISTRY];
}

export async function getUserByEmail(email: string): Promise<RegisteredUser | null> {
  if (!isPrismaActive) {
    const fallback = ENTERPRISE_USERS_REGISTRY.find(u => u.email.toLowerCase() === email.toLowerCase());
    return fallback ? { ...fallback } : null;
  }
  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (user) {
      return mapPrismaUserToRegistered(user);
    }
  } catch (err) {
    console.warn(`[userRepository.getUserByEmail] Prisma fallback for ${email}:`, err);
  }
  const fallback = ENTERPRISE_USERS_REGISTRY.find(u => u.email.toLowerCase() === email.toLowerCase());
  return fallback ? { ...fallback } : null;
}

export async function getUserById(id: string): Promise<RegisteredUser | null> {
  if (!isPrismaActive) {
    const fallback = ENTERPRISE_USERS_REGISTRY.find(u => u.id === id);
    return fallback ? { ...fallback } : null;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (user) {
      return mapPrismaUserToRegistered(user);
    }
  } catch (err) {
    console.warn(`[userRepository.getUserById] Prisma fallback for ${id}:`, err);
  }
  const fallback = ENTERPRISE_USERS_REGISTRY.find(u => u.id === id);
  return fallback ? { ...fallback } : null;
}


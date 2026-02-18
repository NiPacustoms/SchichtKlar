import type { User } from '@/lib/types/user';

/**
 * Port for user persistence – implemented by infrastructure.
 */
export interface IUserRepository {
  getById(id: string): Promise<User | null>;

  listByCompanyId(
    companyId: string,
    options?: { limit?: number }
  ): Promise<User[]>;
}

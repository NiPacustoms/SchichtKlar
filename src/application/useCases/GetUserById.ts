import type { User } from '@/lib/types/user';
import type { IUserRepository } from '@/src/application/ports/IUserRepository';

/**
 * Use case: get a single user by ID.
 */
export class GetUserById {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepo.getById(userId);
  }
}

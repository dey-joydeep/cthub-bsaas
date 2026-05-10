import type { User } from '@prisma/client';

/**
 * @public
 * Injection token for {@link IUserRepository}.
 */
export const USER_REPOSITORY = 'USER_REPOSITORY';

/**
 * @public
 * Read/write access to user entities.
 */
export interface IUserRepository {
    /**
     * Find a user by id including role names.
     * @param {string} id - User id.
     * @returns {Promise<(User & { roles: { role: { name: string } }[] }) | null>} User or null.
     */
    findById(id: string): Promise<(User & { roles: { role: { name: string } }[] }) | null>;
    /**
     * Find a user by email including role names.
     * @param {string} email - Email address.
     * @returns {Promise<(User & { roles: { role: { name: string } }[] }) | null>} User or null.
     */
    findByEmail(email: string): Promise<(User & { roles: { role: { name: string } }[] }) | null>;
    /**
     * Create a new user.
     * @param {Omit<User, 'id' | 'createdAt' | 'updatedAt'>} data - Creation payload.
     * @returns {Promise<User>} Persisted user.
     */
    create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    /**
     * Update an existing user.
     * @param {string} id - User id.
     * @param {Partial<User>} data - Partial updates.
     * @returns {Promise<User>} Updated user.
     */
    update(id: string, data: Partial<User>): Promise<User>;
}

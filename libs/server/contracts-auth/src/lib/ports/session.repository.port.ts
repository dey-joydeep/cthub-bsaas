import type { Session } from '@prisma/client';

/**
 * @public
 * Injection token for {@link ISessionRepository}.
 */
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';

/**
 * @public
 * Repository for session lifecycle management.
 */
export interface ISessionRepository {
    /**
     * Create a session for a user.
     * @param {Omit<Session, 'id' | 'createdAt' | 'lastSeenAt' | 'deviceUA' | 'deviceOS' | 'ipHash'> & Partial<Pick<Session, 'deviceUA' | 'deviceOS' | 'ipHash'>>} data - Session data.
     * @returns {Promise<Session>} Newly created session.
     */
    create(
        data: Omit<Session, 'id' | 'createdAt' | 'lastSeenAt' | 'deviceUA' | 'deviceOS' | 'ipHash'> &
            Partial<Pick<Session, 'deviceUA' | 'deviceOS' | 'ipHash'>>
    ): Promise<Session>;
    /**
     * Find a session by id.
     * @param {string} id - Session id.
     * @returns {Promise<Session | null>} Session or null.
     */
    findById(id: string): Promise<Session | null>;
    /**
     * List all sessions for a user.
     * @param {string} userId - User id.
     * @returns {Promise<Session[]>} Sessions.
     */
    findByUserId(userId: string): Promise<Session[]>;
    /**
     * Update a session (e.g., lastSeenAt timestamp).
     * @param {string} id - Session id.
     * @param {Partial<Pick<Session, 'lastSeenAt'>>} data - Fields to update.
     * @returns {Promise<Session>} Updated session.
     */
    update(id: string, data: Partial<Pick<Session, 'lastSeenAt'>>): Promise<Session>;
    /**
     * Delete a session.
     * @param {string} id - Session id.
     * @returns {Promise<Session>} Deleted session.
     */
    delete(id: string): Promise<Session>;
}

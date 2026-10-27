import { SessionsController } from './sessions.controller';
import type { AuthService } from '../services/auth.service';

describe('SessionsController', () => {
  let service: jest.Mocked<Pick<AuthService, 'listSessions' | 'revokeSession'>>;
  let controller: SessionsController;

  beforeEach(() => {
    service = {
      listSessions: jest.fn().mockResolvedValue([{ id: 's1' }]),
      revokeSession: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as typeof service;
    controller = new SessionsController(service as unknown as AuthService);
  });

  it('listSessions proxies to service with userId', async () => {
    const req = { user: { userId: 'u1' } } as { user: { userId: string } };
    const result = await controller.listSessions(req);
    expect(service.listSessions).toHaveBeenCalledWith('u1');
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('revokeSession proxies to service with userId and id', async () => {
    const req = { user: { userId: 'u2' } } as { user: { userId: string } };
    const result = await controller.revokeSession(req, 'sess-1');
    expect(service.revokeSession).toHaveBeenCalledWith('u2', 'sess-1');
    expect(result).toEqual({ success: true });
  });

  describe('error propagation', () => {
    const forced = new Error('forced');

    it('propagates errors from listSessions', async () => {
      (service.listSessions as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.listSessions({ user: { userId: 'u1' } } as { user: { userId: string } })).rejects.toBe(forced);
    });

    it('propagates errors from revokeSession', async () => {
      (service.revokeSession as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.revokeSession({ user: { userId: 'u1' } } as { user: { userId: string } }, 'x')).rejects.toBe(forced);
    });
  });
});

import { PublicDiscoveryController } from './public-discovery.controller';
import { PublicDiscoveryService } from '../services/public-discovery.service';

describe('PublicDiscoveryController', () => {
  const service = {
    getPublicHome: jest.fn(),
    searchPublicSalons: jest.fn(),
    getPublicSalonProfile: jest.fn(),
    listPublicSalonServices: jest.fn(),
    listPublicSalonReviews: jest.fn(),
    listPublicSalonPortfolio: jest.fn(),
    getPublicAvailabilitySignal: jest.fn(),
  } as unknown as jest.Mocked<PublicDiscoveryService>;
  const controller = new PublicDiscoveryController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes public home queries to the service', async () => {
    const query = { city: 'Tokyo' };
    await controller.getPublicHome(query);
    expect(service.getPublicHome).toHaveBeenCalledWith(query);
  });

  it('routes salon search queries to the service', async () => {
    const query = { q: 'cut', limit: 10 };
    await controller.searchPublicSalons(query);
    expect(service.searchPublicSalons).toHaveBeenCalledWith(query);
  });

  it('routes profile and collection requests by slug', async () => {
    await controller.getPublicSalonProfile('glow-123');
    await controller.listPublicSalonServices('glow-123');
    await controller.listPublicSalonReviews('glow-123', '5');
    await controller.listPublicSalonPortfolio('glow-123');
    await controller.getPublicAvailabilitySignal('glow-123', { date: '2026-05-27' });

    expect(service.getPublicSalonProfile).toHaveBeenCalledWith('glow-123');
    expect(service.listPublicSalonServices).toHaveBeenCalledWith('glow-123');
    expect(service.listPublicSalonReviews).toHaveBeenCalledWith('glow-123', 5);
    expect(service.listPublicSalonPortfolio).toHaveBeenCalledWith('glow-123');
    expect(service.getPublicAvailabilitySignal).toHaveBeenCalledWith('glow-123', { date: '2026-05-27' });
  });
});

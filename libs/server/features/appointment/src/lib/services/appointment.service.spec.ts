import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { APPOINTMENT_REPOSITORY } from '../repositories/appointment.repository';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from '../dto/requests/create-appointment.dto';
import { AuthUser } from '../../user/interfaces/auth.interface';
import { AppointmentStatus } from '@shared/enums/appointment-status.enum';

// Test data
const TEST_USER_ID = 'test-user-id';
const TEST_CUSTOMER_ID = 'test-customer-id';
const TEST_SALON_ID = 'test-salon-id';

// Mock the repository
const mockAppointmentRepository = {
  create: jest.fn(),
} as any;

// Create a mock customer service that can be controlled in tests
const mockCustomerService = {
  findUnique: jest.fn(),
};

// Mock Prisma service with proper typing
const mockPrismaService = {
  customer: mockCustomerService,
} as unknown as jest.Mocked<PrismaService>;

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: APPOINTMENT_REPOSITORY,
          useValue: mockAppointmentRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prisma = module.get(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      // Test data
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600000);

      const createAppointmentDto: CreateAppointmentDto = {
        customerId: TEST_CUSTOMER_ID,
        salonId: TEST_SALON_ID,
        startTime: now.toISOString(),
        endTime: oneHourLater.toISOString(),
        services: [{ serviceId: 'service-1', staffId: 'staff-1' }],
        status: AppointmentStatus.PENDING,
      };

      const mockUser: AuthUser = {
        id: TEST_USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        roles: [
          {
            role: { name: 'CUSTOMER', id: 1 },
            userId: TEST_USER_ID,
            roleId: 1,
          },
        ],
        customerId: TEST_CUSTOMER_ID,
      };

      // Mock Prisma response
      mockCustomerService.findUnique.mockImplementation((args: any) => {
        if (args?.where?.id === TEST_CUSTOMER_ID) {
          return Promise.resolve({
            id: TEST_CUSTOMER_ID,
            userId: TEST_USER_ID,
          });
        }
        return Promise.resolve(null);
      });

      // Mock repository response
      mockAppointmentRepository.create.mockResolvedValue({
        id: 'new-appointment-id',
        ...createAppointmentDto,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
        customer: { id: TEST_CUSTOMER_ID, userId: TEST_USER_ID },
        services: createAppointmentDto.services,
      });

      // Act
      const result = await service.createAppointment(createAppointmentDto, mockUser);

      // Assert
      expect(result).toBeDefined();
      expect(mockAppointmentRepository.create).toHaveBeenCalled();
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CUSTOMER_ID },
      });
    });

    it('should throw an error if customer is not found', async () => {
      // Test data
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600000);

      const createAppointmentDto: CreateAppointmentDto = {
        customerId: 'non-existent-customer-id',
        salonId: TEST_SALON_ID,
        startTime: now.toISOString(),
        endTime: oneHourLater.toISOString(),
        services: [{ serviceId: 'service-1', staffId: 'staff-1' }],
        status: AppointmentStatus.PENDING,
      };

      const mockUser: AuthUser = {
        id: TEST_USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        roles: [
          {
            role: { name: 'CUSTOMER', id: 1 },
            userId: TEST_USER_ID,
            roleId: 1,
          },
        ],
        customerId: 'non-existent-customer-id',
      };

      // Mock Prisma to return null for customer
      mockCustomerService.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createAppointment(createAppointmentDto, mockUser)).rejects.toThrow('Customer not found');
    });
  });
});

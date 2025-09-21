import { Test } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    // Set up environment variables for testing
    process.env.PORT = '3001';
    process.env.JWT_SECRET = 'test_secret_key';
    process.env.DATABASE_URL = 'test_db_url';

    const module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the app configuration', () => {
    expect(service.app).toBeDefined();
    expect(service.app.port).toBe(3001);
  });

  it('should return the auth configuration', () => {
    expect(service.auth).toBeDefined();
    expect(service.auth.jwtAccessSecret).toBe('test_secret_key');
  });

  it('should return the database configuration', () => {
    expect(service.database).toBeDefined();
    expect(service.database.url).toBe('test_db_url');
  });

  it('should return the cors configuration', () => {
    expect(service.cors).toBeDefined();
  });

  it('should return the file configuration', () => {
    expect(service.file).toBeDefined();
  });

  it('should return the rateLimit configuration', () => {
    expect(service.rateLimit).toBeDefined();
  });

  it('should return the email configuration', () => {
    expect(service.email).toBeDefined();
  });

  it('should return the encryption configuration', () => {
    expect(service.encryption).toBeDefined();
  });

  it('should return the log configuration', () => {
    expect(service.log).toBeDefined();
  });

  it('should get a value using the generic get method', () => {
    expect(service.get('app.port')).toBe(3001);
  });

  it('should return undefined for a non-existent key with get', () => {
    expect(service.get('non.existent.key')).toBeUndefined();
  });

  it('should get a required value using getRequired', () => {
    expect(service.getRequired('app.port')).toBe(3001);
  });

  it('should throw an error for a non-existent key with getRequired', () => {
    expect(() => service.getRequired('non.existent.key')).toThrow(
      "Configuration key 'non.existent.key' is required but was not found",
    );
  });
});
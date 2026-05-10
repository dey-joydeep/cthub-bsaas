import { Test } from '@nestjs/testing';
import { ConsoleEmailAdapter } from './email.console.adapter';

describe('ConsoleEmailAdapter', () => {
  let adapter: ConsoleEmailAdapter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConsoleEmailAdapter],
    }).compile();

    adapter = module.get<ConsoleEmailAdapter>(ConsoleEmailAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should log the email to the console', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await adapter.sendMail('test@example.com', 'Test Subject', 'Test Body');
    expect(consoleSpy).toHaveBeenCalledWith('[Email] To: test@example.com | Subject: Test Subject | Body: Test Body...');
  });
});

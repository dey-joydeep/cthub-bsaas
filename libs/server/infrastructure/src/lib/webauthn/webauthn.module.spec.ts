import { Test } from '@nestjs/testing';
import { WebAuthnModule } from './webauthn.module';

describe('WebAuthnModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [WebAuthnModule],
    }).compile();

    expect(module).toBeDefined();
  });
});

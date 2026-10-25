import { IsValidAppointmentStatus, IsValidAppointmentTime } from './appointment.validators';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { validate } from 'class-validator';

class TestStatusDto {
  @IsValidAppointmentStatus()
  status!: string;
}

class TestTimeDto {
  @IsValidAppointmentTime()
  time!: string;
}

describe('Appointment Validators', () => {
  describe('IsValidAppointmentStatus', () => {
    it('should pass for a valid status', async () => {
      const dto = new TestStatusDto();
      dto.status = AppointmentStatus.CONFIRMED;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail for an invalid status', async () => {
      const dto = new TestStatusDto();
      dto.status = 'INVALID_STATUS';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isValidAppointmentStatus');
    });
  });

  describe('IsValidAppointmentTime', () => {
    it('should pass for a future date', async () => {
      const dto = new TestTimeDto();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      dto.time = futureDate.toISOString();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail for a past date', async () => {
      const dto = new TestTimeDto();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      dto.time = pastDate.toISOString();
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isValidAppointmentTime');
    });

    it('should fail for an invalid date string', async () => {
      const dto = new TestTimeDto();
      dto.time = 'not a date';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('isValidAppointmentTime');
    });
  });
});

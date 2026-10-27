import { ApiProperty } from '@nestjs/swagger';
import { AppointmentResponseDto } from './appointment-response.dto';

/**
 * Metadata for paginated responses
 */
class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    required: true,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: true,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
    required: true,
  })
  totalItems!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
    required: true,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
    required: true,
  })
  hasPreviousPage!: boolean;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
    required: true,
  })
  hasNextPage!: boolean;
}

/**
 * Paginated response DTO for appointments
 */
export class PaginatedAppointmentsDto {
  @ApiProperty({
    description: 'Array of appointment items',
    type: [AppointmentResponseDto],
    required: true,
  })
  items!: AppointmentResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    required: true,
  })
  meta!: PaginationMetaDto;
}

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class InvoiceLineInputDto {
  @IsIn(['SERVICE', 'PRODUCT', 'ADJUSTMENT'])
  type!: 'SERVICE' | 'PRODUCT' | 'ADJUSTMENT';

  @IsUUID()
  referenceId!: string;

  @IsString()
  @MaxLength(160)
  description!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/)
  quantity!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  unitPrice!: string;
}

export class InvoiceInputDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines!: InvoiceLineInputDto[];
}

export class FinalizeInvoiceInputDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  confirmedTotal!: string;
}

export class PaymentInputDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsIn(['CASH', 'CARD', 'UPI', 'WALLET', 'BANK_TRANSFER'])
  method!: string;

  @IsISO8601()
  receivedAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class ProductInputDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(2, 80)
  sku!: string;

  @IsIn(['PIECE', 'ML', 'GRAM', 'PACK'])
  unit!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  retailPrice!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/)
  reorderPoint?: string;

  @IsIn(['ACTIVE', 'INACTIVE'])
  status!: 'ACTIVE' | 'INACTIVE';
}

export class StockMovementInputDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(/^-?\d+(\.\d{1,3})?$/)
  quantity!: string;

  @IsIn(['PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN'])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

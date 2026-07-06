/**
 * DTOs for product sales reporting
 *
 * These DTOs are used for validating and documenting the product sales API.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class SalesByProductDto {
  /**
   * Product ID
   */
  @IsUUID()
  productId!: string;

  /**
   * Product name
   */
  @IsString()
  productName!: string;

  /**
   * Number of items sold
   */
  @IsNumber()
  quantity!: number;

  /**
   * Total revenue from this product
   */
  @IsNumber()
  @Min(0)
  revenue!: number;

  /**
   * Percentage of total sales
   */
  @IsNumber()
  percentage!: number;
}

export class SalesByDateDto {
  /**
   * Date of sales (YYYY-MM-DD format)
   */
  @IsString()
  date!: string;

  /**
   * Total sales amount for this date
   */
  @IsNumber()
  sales!: number;

  /**
   * Number of items sold
   */
  @IsNumber()
  items!: number;
}

export class ProductSaleDto {
  /**
   * ID of the product sale
   */
  @IsUUID()
  id!: string;

  /**
   * ID of the product
   */
  @IsUUID()
  productId!: string;

  /**
   * Name of the product
   */
  @IsString()
  productName!: string;

  @ApiProperty({ description: 'Quantity sold' })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Price per unit' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Total amount of the sale' })
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  /**
   * Date of the sale in ISO format
   */
  @IsDateString()
  saleDate!: Date;

  /**
   * ID of the staff who made the sale
   */
  @IsUUID()
  soldById!: string;

  /**
   * Name of the staff who made the sale
   */
  @IsString()
  soldByName!: string;

  /**
   * ID of the customer (if any)
   */
  @IsUUID()
  @IsOptional()
  customerId?: string;

  /**
   * Name of the customer (if any)
   */
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ description: 'ID of the related appointment (if any)', required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ description: 'Additional notes about the sale', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateProductSaleDto {
  /**
   * ID of the product
   */
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity sold' })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Price per unit' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Total amount of the sale' })
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  /**
   * Date of the sale (defaults to current date if not provided)
   */
  @IsDateString()
  @IsOptional()
  saleDate?: Date;

  /**
   * ID of the customer (if any)
   */
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'ID of the related appointment (if any)', required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ description: 'Additional notes about the sale', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProductSalesFilterDto {
  /**
   * Start date for filtering sales (inclusive)
   * Format: YYYY-MM-DD
   */
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  /**
   * End date for filtering sales (inclusive)
   * Format: YYYY-MM-DD
   */
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  /**
   * Filter by specific product ID
   */
  @IsUUID()
  @IsOptional()
  productId?: string;

  /**
   * Filter by staff member who made the sale
   */
  @IsUUID()
  @IsOptional()
  soldById?: string;

  /**
   * Filter by customer ID
   */
  @IsUUID()
  @IsOptional()
  customerId?: string;
}

export class ProductSalesSummaryDto {
  /** Total number of sales in the period */
  totalSales!: number;

  /** Total revenue from sales in the period */
  totalRevenue!: number;

  /** Total cost of goods sold in the period */
  totalCost!: number;

  /** Total profit (revenue - cost) in the period */
  totalProfit!: number;

  /** Total number of individual items sold */
  totalItemsSold!: number;

  /** Average value of each sale */
  averageSaleValue!: number;

  /** Breakdown of sales by product */
  salesByProduct!: SalesByProductDto[];

  /** Daily sales data */
  salesByDate!: SalesByDateDto[];
}

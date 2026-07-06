import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { ThemeResponseDto } from '../dto/theme-response.dto';
import { ThemeQueryDto } from '../dto/theme-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  private mapToResponse(theme: any): ThemeResponseDto {
    return {
      id: theme.id,
      name: theme.name,
      description: theme.description || undefined,
      styles: theme.styles || {},
      isActive: theme.isActive,
      isDefault: theme.isDefault || false,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    };
  }

  private buildWhereClause(query: ThemeQueryDto): Prisma.ThemeWhereInput {
    const where: Prisma.ThemeWhereInput = {};

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return where;
  }

  private buildOrderBy(query: ThemeQueryDto): Prisma.ThemeOrderByWithRelationInput {
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    return { [sortBy]: sortOrder } as Prisma.ThemeOrderByWithRelationInput;
  }

  async create(createThemeDto: CreateThemeDto): Promise<ThemeResponseDto> {
    const theme = await this.prisma.theme.create({
      data: {
        name: createThemeDto.name,
        description: createThemeDto.description,
        // Map styles to colors to match the Prisma schema
        colors: createThemeDto.styles,
        isActive: createThemeDto.isActive ?? true,
        isDefault: createThemeDto.isDefault ?? false,
      },
    });

    return this.mapToResponse(theme);
  }

  async findAll(query: ThemeQueryDto): Promise<{ data: ThemeResponseDto[]; total: number }> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [themes, total] = await Promise.all([
      this.prisma.theme.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.theme.count({ where }),
    ]);

    return {
      data: themes.map((theme) => this.mapToResponse(theme)),
      total,
    };
  }

  async findOne(id: string): Promise<ThemeResponseDto> {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException(`Theme with ID "${id}" not found`);
    }

    return this.mapToResponse(theme);
  }

  async update(id: string, updateThemeDto: UpdateThemeDto): Promise<ThemeResponseDto> {
    try {
      const theme = await this.prisma.theme.update({
        where: { id },
        data: {
          ...updateThemeDto,
          updatedAt: new Date(),
        },
      });
      return this.mapToResponse(theme);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`Theme with ID "${id}" not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.theme.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`Theme with ID "${id}" not found`);
      }
      throw error;
    }
  }
}

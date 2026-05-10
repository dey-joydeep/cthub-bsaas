import { Prisma, Social as PrismaSocial } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SocialResponseDto } from '../dto/responses/social-response.dto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

const prisma = new PrismaService();

export type Social = {
  id: string;
  userId: string;
  platform: string;
  handle: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetSocialByIdParams = {
  id: string;
};

export type UpdateSocialParams = {
  id: string;
  data: Partial<Omit<Social, 'id' | 'createdAt' | 'updatedAt'>>;
};

export type DeleteSocialParams = {
  id: string;
};

function mapToResponseDto(prismaSocial: PrismaSocial): SocialResponseDto {
  if (!prismaSocial) {
    throw new Error('Cannot map null or undefined social object');
  }

  return {
    id: prismaSocial.id,
    userId: prismaSocial.userId,
    platform: prismaSocial.platform,
    handle: prismaSocial.handle,
    url: prismaSocial.url || undefined,
    createdAt: prismaSocial.createdAt,
    updatedAt: prismaSocial.updatedAt,
  };
}

@Injectable()
export class SocialService {
  async getSocials(filter: Prisma.SocialWhereInput = {}): Promise<SocialResponseDto[]> {
    const socials = await prisma.social.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });
    return socials.map((social) => mapToResponseDto(social));
  }

  async getSocialById(params: GetSocialByIdParams): Promise<SocialResponseDto> {
    const social = await prisma.social.findUnique({
      where: { id: params.id },
    });

    if (!social) {
      throw new NotFoundException(`Social with ID ${params.id} not found`);
    }

    return mapToResponseDto(social);
  }

  async createSocial(data: Omit<Social, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialResponseDto> {
    const social = await prisma.social.create({
      data: {
        userId: data.userId,
        platform: data.platform,
        handle: data.handle,
        url: data.url,
      },
    });
    return mapToResponseDto(social);
  }

  async updateSocial(params: UpdateSocialParams): Promise<SocialResponseDto> {
    const { id, data } = params;

    try {
      const social = await prisma.social.update({
        where: { id },
        data: {
          ...(data.platform && { platform: data.platform }),
          ...(data.handle && { handle: data.handle }),
          ...(data.url !== undefined && { url: data.url }),
          ...(data.userId && { userId: data.userId }),
        },
      });
      return mapToResponseDto(social);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        // Record not found
        throw new NotFoundException(`Social with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteSocial(params: DeleteSocialParams): Promise<void> {
    try {
      await prisma.social.delete({ where: { id: params.id } });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        // Record not found
        throw new NotFoundException(`Social with ID ${params.id} not found`);
      }
      throw error;
    }
  }
}

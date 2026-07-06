import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class SalonService {
  constructor(private prisma: PrismaService) {}
  async searchSalons(filters: any) {
    return this.prisma.salon.findMany({ where: filters });
  }

  // Replace dummy logic with actual business logic: fetch salons, join reviews, sort by average rating, filter by distance if lat/lng provided
  async getTopSalons(params: { latitude?: number; longitude?: number; reviewService: any }) {
    const { latitude, longitude, reviewService } = params;
    // Fetch all salons
    let salons = await this.prisma.salon.findMany();

    // If lat/lng provided, filter/sort by distance (Haversine formula)
    if (latitude !== undefined && longitude !== undefined) {
      salons = salons.map((salon: any) => {
        if (salon.latitude != null && salon.longitude != null) {
          const toRad = (value: number) => (value * Math.PI) / 180;
          const R = 6371; // km
          const dLat = toRad(salon.latitude - latitude);
          const dLon = toRad(salon.longitude - longitude);
          const lat1 = toRad(latitude);
          const lat2 = toRad(salon.latitude);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          salon.distanceKm = R * c;
        } else {
          salon.distanceKm = Number.POSITIVE_INFINITY;
        }
        return salon;
      });
      salons.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
    }

    // If reviewService is provided, fetch ratings for each salon
    if (reviewService && typeof reviewService.getAverageRatingForSalon === 'function') {
      const salonsWithRatings = await Promise.all(
        salons.map(async (salon: any) => {
          let average = 0;
          let count = 0;
          try {
            // Try both possible review service signatures
            if (reviewService.getAverageRatingForSalon.length === 1) {
              // Mongo/NoSQL style: pass salon_id
              const result = await reviewService.getAverageRatingForSalon(salon.id);
              if (typeof result === 'object' && result !== null) {
                average = result.average ?? 0;
                count = result.count ?? 0;
              } else {
                average = result ?? 0;
              }
            } else {
              // SQL style: pass params object
              const result = await reviewService.getAverageRatingForSalon({ salonId: salon.id });
              average = result.average ?? 0;
              count = result.count ?? 0;
            }
          } catch (err) {
            average = 0;
            count = 0;
          }
          return { ...salon, averageRating: average, reviewCount: count };
        }),
      );
      // Sort by averageRating desc, then reviewCount desc (preserve distance order if present)
      salonsWithRatings.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount;
      });
      return salonsWithRatings;
    }
    // If no reviewService, just return salons (already sorted by distance if lat/lng provided)
    return salons;
  }

  async getSalonById(params: { salonId: string }): Promise<any | null> {
    const salon = await this.prisma.salon.findUnique({ where: { id: params.salonId } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID ${params.salonId} not found`);
    }
    return {
      id: salon.id,
      name: salon.name,
      // address: salon.address,
      // zipCode: salon.zipCode,
      // city: salon.city,
      latitude: salon.latitude,
      longitude: salon.longitude,
      // services: salon.services ?? [],
      ownerId: salon.ownerId,
      imageUrl: salon.imageUrl,
    };
  }

  async createSalon(params: any): Promise<any> {
    const created = await this.prisma.salon.create({ data: params });
    return {
      id: created.id,
      name: created.name,
      // address: created.address,
      // zipCode: created.zipCode,
      // city: created.city,
      latitude: created.latitude,
      longitude: created.longitude,
      // services: created.services ?? [],
      ownerId: created.ownerId,
      imageUrl: created.imageUrl,
    };
  }

  async updateSalon(params: any): Promise<any | null> {
    try {
      const updated = await this.prisma.salon.update({
        where: { id: params.salonId },
        data: params,
      });
      return updated;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma not found error code
        throw new NotFoundException(`Salon with ID ${params.salonId} not found`);
      }
      throw error;
    }
    return {
      id: updated.id,
      name: updated.name,
      // address: updated.address,
      // zipCode: updated.zipCode,
      // city: updated.city,
      latitude: updated.latitude,
      longitude: updated.longitude,
      // services: updated.services ?? [],
      ownerId: updated.ownerId,
      imageUrl: updated.imageUrl,
    };
  }

  async deleteSalon(params: { salonId: string }): Promise<boolean> {
    try {
      await this.prisma.salon.delete({ where: { id: params.salonId } });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma not found error code
        throw new NotFoundException(`Salon with ID ${params.salonId} not found`);
      }
      throw error;
    }
  }

  async getStaff(params: { salonId: string }): Promise<any[]> {
    // Use camelCase fields for Prisma Client
    // const staffList = await prisma.salonStaff.findMany({
    //   where: { salonId: params.salonId, isDeleted: false },
    // });
    // return staffList.map((staff: any) => ({
    //   userId: staff.userId,
    //   salonId: staff.salonId,
    //   position: staff.position,
    //   isActive: staff.isActive,
    //   hiredAt: staff.hiredAt,
    //   isOnLeave: staff.isOnLeave,
    //   isDeleted: staff.isDeleted,
    // }));
    return [];
  }

  async addStaff(params: { salonId: string; staff: any }): Promise<any> {
    // Use camelCase fields for Prisma Client
    // const created = await prisma.salonStaff.create({
    //   data: {
    //     userId: params.staff.userId,
    //     salonId: params.salonId,
    //     position: params.staff.position,
    //     isActive: params.staff.isActive,
    //     hiredAt: params.staff.hiredAt,
    //     isOnLeave: params.staff.isOnLeave,
    //     isDeleted: params.staff.isDeleted,
    //   },
    // });
    // return {
    //   userId: created.userId,
    //   salonId: created.salonId,
    //   position: created.position,
    //   isActive: created.isActive,
    //   hiredAt: created.hiredAt,
    //   isOnLeave: created.isOnLeave,
    //   isDeleted: created.isDeleted,
    // };
  }

  async removeStaff(params: { staffId: string; salonId: string }): Promise<boolean> {
    // await prisma.salonStaff.delete({ where: { userId: params.staffId, salonId: params.salonId } });
    return true;
  }
}

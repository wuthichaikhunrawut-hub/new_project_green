import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getUserSubscriptionStatus(userId: string) {
    // 1. ดึงข้อมูลแผนและโควตาทั้งหมดของ User
    const plan = await this.prisma.planFeature.findFirst({
      where: { organizationId: userId }, // สมมติว่าผูกกับ User หรือ Org
    });

    // 2. นับจำนวนการใช้งาน AI Scan ในเดือนปัจจุบัน
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageCount = await this.prisma.featureUsageLog.count({
      where: {
        userId: userId,
        featureType: 'AI_SCAN',
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      planName: plan?.name || 'Free Plan',
      aiScanLimit: plan?.aiScanLimit || 5,
      aiScanUsed: usageCount,
      expiryDate: plan?.expiryDate,
    };
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
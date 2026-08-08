import { prisma } from "../config/prisma.js";

export class AuditService {
  static async log(
    module: string,
    action: string,
    referenceId: string | null,
    description: string,
    performerId?: string,
    performerRole?: string
  ) {
    try {
      return await prisma.auditLog.create({
        data: {
          module,
          action,
          referenceId,
          description,
          performerId,
          performerRole,
        },
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }

  static async getLogs() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

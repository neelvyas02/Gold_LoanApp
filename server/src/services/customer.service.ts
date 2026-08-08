import { prisma } from "../config/prisma.js";
import { generateCustomerId } from "../utils/generateCustomerId.js";
import { generateLoanNumber } from "../utils/generateLoanNumber.js";
import { calculateInterest } from "../utils/calculateInterest.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "./notification.service.js";

export class CustomerService {
  static async getCustomers(search?: string, tab?: string) {
    const whereClause: any = {};

    if (tab === "active" || tab === "active_loans" || tab === "activated") {
      whereClause.isArchived = false;
      whereClause.loans = {
        some: {
          status: { in: ["Active", "Due Soon", "Overdue"] },
        },
      };
    } else if (tab === "closed" || tab === "closed_loans") {
      whereClause.isArchived = false;
      whereClause.loans = {
        every: {
          status: "Closed",
        },
        some: {},
      };
    } else if (tab === "archived" || tab === "deactivated") {
      whereClause.isArchived = true;
    }

    if (search && search.trim()) {
      const trimmed = search.trim();
      const searchConditions = {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed } },
          { email: { contains: trimmed, mode: "insensitive" } },
          { customerNumber: { contains: trimmed, mode: "insensitive" } },
          { aadhaar: { contains: trimmed } },
          { pan: { contains: trimmed, mode: "insensitive" } },
          {
            loans: {
              some: {
                loanNumber: { contains: trimmed, mode: "insensitive" },
              },
            },
          },
        ],
      };

      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          searchConditions,
        ];
        delete whereClause.OR;
      } else {
        whereClause.AND = [searchConditions];
      }
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        loans: {
          select: {
            id: true,
            loanNumber: true,
            loanAmount: true,
            status: true,
            loanClosingDate: true,
            outstandingBalance: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return customers.map(c => ({
      ...c,
      loans: c.loans.map(l => ({
        ...l,
        balance: l.outstandingBalance,
        maturityDate: l.loanClosingDate,
      })),
    }));
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            ornaments: {
              include: { photos: true },
            },
            payments: true,
          },
        },
        documents: true,
      },
    });
    if (!customer) return null;
    return {
      ...customer,
      loans: customer.loans.map(l => ({
        ...l,
        balance: l.outstandingBalance,
        maturityDate: l.loanClosingDate,
      })),
    };
  }

  static async createCustomer(payload: any) {
    const { loan, ornaments, documents, aadhaarDocument, panDocument, ...customerData } = payload;

    // Check unique Email
    if (customerData.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: { email: { equals: customerData.email.trim(), mode: "insensitive" } },
      });
      if (existingEmail) {
        throw new Error("This email is already registered.");
      }
    }

    // Check unique PAN
    if (customerData.pan) {
      const existingPan = await prisma.customer.findFirst({
        where: { pan: { equals: customerData.pan.trim(), mode: "insensitive" } },
      });
      if (existingPan) {
        throw new Error("PAN must be unique.");
      }
    }

    // Check unique Aadhaar
    if (customerData.aadhaar) {
      const existingAadhaar = await prisma.customer.findFirst({
        where: { aadhaar: customerData.aadhaar.trim() },
      });
      if (existingAadhaar) {
        throw new Error("Aadhaar must be unique.");
      }
    }

    // Check unique Mobile
    if (customerData.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { phone: customerData.phone.trim() },
      });
      if (existingPhone) {
        throw new Error("Mobile number is already registered.");
      }
    }

    return prisma.$transaction(async (tx) => {
      const customerNumber = await generateCustomerId();

      const customer = await tx.customer.create({
        data: {
          ...customerData,
          email: customerData.email.trim(),
          pan: customerData.pan.trim(),
          aadhaar: customerData.aadhaar.trim(),
          phone: customerData.phone.trim(),
          aadhaarDocument: aadhaarDocument || null,
          panDocument: panDocument || null,
          customerNumber,
          isActivated: false,
          isActive: true,
          isArchived: false,
        },
      });

      if (documents && documents.length > 0) {
        for (const doc of documents) {
          await tx.document.create({
            data: {
              customerId: customer.id,
              documentType: doc.documentType,
              fileName: doc.fileName,
              filePath: doc.filePath,
            },
          });
        }
      }

      let createdLoan = null;

      if (loan) {
        const loanNumber = await generateLoanNumber();
        const rate = loan.interestRate || 12;
        const loanDateVal = new Date(loan.loanDate);
        const closingDateVal = new Date(loan.maturityDate);
        const diffTime = closingDateVal.getTime() - loanDateVal.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const loanTenure = diffTime > 0 ? Math.max(1, Math.round(diffDays / 30.44)) : 12;

        const totalInterest = calculateInterest(loan.loanAmount, rate, loanTenure);
        const totalPayable = loan.loanAmount + totalInterest;
        const outstandingBalance = totalPayable;

        createdLoan = await tx.loan.create({
          data: {
            loanNumber,
            customerId: customer.id,
            loanAmount: loan.loanAmount,
            interestRate: rate,
            loanDate: loan.loanDate,
            loanClosingDate: loan.maturityDate,
            loanTenure,
            totalInterest,
            totalPayable,
            outstandingBalance,
            status: "Active",
            loanType: loan.loanType || "regular",
          },
        });

        if (ornaments && ornaments.length > 0) {
          for (const o of ornaments) {
            const createdOrnament = await tx.ornament.create({
              data: {
                loanId: createdLoan.id,
                type: o.category.toLowerCase() === "other" ? (o.customOrnamentName || "Other") : o.category,
                category: o.category,
                customOrnamentName: o.category.toLowerCase() === "other" ? o.customOrnamentName : null,
                pieces: o.pieces || 1,
                grossWeight: o.grossWeight,
                netWeight: o.netWeight,
                purity: o.purity,
                stoneWeight: o.stoneWeight || 0,
                estimatedValue: o.estimatedValue,
                remarks: o.remarks,
              },
            });

            if (o.photos && o.photos.length > 0) {
              for (const path of o.photos) {
                const parts = path.split("/");
                const fileName = parts[parts.length - 1];
                await tx.ornamentPhoto.create({
                  data: {
                    ornamentId: createdOrnament.id,
                    fileName,
                    filePath: path,
                  },
                });
              }
            }
          }
        }
      }

      await tx.auditLog.create({
        data: {
          module: "Customer",
          action: "Customer Created",
          referenceId: customer.id,
          description: `Customer ${customer.name} (No: ${customerNumber}) created.`,
        },
      });

      if (aadhaarDocument) {
        await tx.auditLog.create({
          data: {
            module: "Customer",
            action: "Aadhaar Uploaded",
            referenceId: customer.id,
            description: `Aadhaar document uploaded for ${customer.name}`,
          },
        });
      }

      if (panDocument) {
        await tx.auditLog.create({
          data: {
            module: "Customer",
            action: "PAN Uploaded",
            referenceId: customer.id,
            description: `PAN document uploaded for ${customer.name}`,
          },
        });
      }

      if (createdLoan) {
        await tx.auditLog.create({
          data: {
            module: "Loan",
            action: "Loan Created",
            referenceId: createdLoan.id,
            description: `Loan ${createdLoan.loanNumber} of amount ₹${loan.loanAmount} created for customer ${customer.name}.`,
          },
        });
      }

      return {
        customer,
        loan: createdLoan ? {
          ...createdLoan,
          balance: createdLoan.outstandingBalance,
          maturityDate: createdLoan.loanClosingDate,
        } : null,
      };
    });
  }

  static async updateCustomer(id: string, data: any) {
    if (data.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          email: { equals: data.email.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });
      if (existingEmail) throw new Error("This email is already registered.");
    }

    if (data.pan) {
      const existingPan = await prisma.customer.findFirst({
        where: {
          pan: { equals: data.pan.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });
      if (existingPan) throw new Error("PAN must be unique.");
    }

    if (data.aadhaar) {
      const existingAadhaar = await prisma.customer.findFirst({
        where: {
          aadhaar: data.aadhaar.trim(),
          NOT: { id },
        },
      });
      if (existingAadhaar) throw new Error("Aadhaar must be unique.");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    await AuditService.log(
      "Customer",
      "Customer Updated",
      customer.id,
      `Customer ${customer.name} details updated.`
    );

    return customer;
  }

  static async archiveCustomer(id: string) {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    await AuditService.log(
      "Customer",
      "Customer Archived",
      customer.id,
      `Customer ${customer.name} was archived.`
    );

    await NotificationService.createNotification(
      "Customer Archived",
      `Customer ${customer.name} has been archived.`,
      "customer_archived"
    );

    return customer;
  }

  static async restoreCustomer(id: string) {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        isArchived: false,
      },
    });

    await AuditService.log(
      "Customer",
      "Customer Restored",
      customer.id,
      `Customer ${customer.name} was restored.`
    );

    return customer;
  }
}

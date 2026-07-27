import { prisma } from "../config/prisma.js";

export async function generateReceiptNumber(): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { receiptPrefix: true },
  });

  const prefix = settings?.receiptPrefix || "RCPT";

  const lastPayment = await prisma.payment.findFirst({
    where: {
      receiptNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  if (!lastPayment) {
    return `${prefix}000001`;
  }

  const numericPart = parseInt(lastPayment.receiptNumber.replace(prefix, ""), 10);
  const nextNum = numericPart + 1;
  return `${prefix}${String(nextNum).padStart(6, "0")}`;
}

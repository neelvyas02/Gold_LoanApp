import { prisma } from "../config/prisma.js";

export async function generateLoanNumber(): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { loanPrefix: true },
  });
  
  const prefix = settings?.loanPrefix || "GL";
  const currentYear = new Date().getFullYear();
  const fullPrefix = `${prefix}${currentYear}`;

  const lastLoan = await prisma.loan.findFirst({
    where: {
      loanNumber: {
        startsWith: fullPrefix,
      },
    },
    orderBy: { loanNumber: "desc" },
    select: { loanNumber: true },
  });

  if (!lastLoan) {
    return `${fullPrefix}0001`;
  }

  const numericPart = parseInt(lastLoan.loanNumber.replace(fullPrefix, ""), 10);
  const nextNum = numericPart + 1;
  return `${fullPrefix}${String(nextNum).padStart(4, "0")}`;
}

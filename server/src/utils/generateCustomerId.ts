import { prisma } from "../config/prisma.js";

export async function generateCustomerId(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    where: {
      customerNumber: {
        startsWith: "CUS",
      },
    },
    orderBy: { customerNumber: "desc" },
    select: { customerNumber: true },
  });

  if (!lastCustomer) {
    return "CUS0001";
  }

  const numericPart = parseInt(lastCustomer.customerNumber.replace("CUS", ""), 10);
  const nextNum = numericPart + 1;
  return `CUS${String(nextNum).padStart(4, "0")}`;
}

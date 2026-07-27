import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear tables
  await prisma.settings.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.ornamentPhoto.deleteMany({});
  await prisma.ornament.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.emailOTP.deleteMany({});
  await prisma.customerOTP.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.customerAuth.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});

  // Seed default settings
  await prisma.settings.create({
    data: {
      id: "default",
      companyName: "Vyas Finance",
      companyAddress: "MG Road, Bengaluru, KA 560001",
      contactNumber: "+91 98450 00000",
      defaultInterestRate: 12.0,
      defaultGoldRate: 6000.0,
      reminderDays: 10,
      loanPrefix: "GL",
      receiptPrefix: "RCPT",
      theme: "light",
    },
  });

  // Seed default users (Passwords: "admin" and "employee" - hashed using bcrypt)
  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        password: "$2b$10$RCmLhFmd4LLY7W5XQ1L7AeqceJql8UN8RZyG5w.8yHYWpfjOaeqbi", // "admin"
        role: "Admin",
      },
      {
        username: "employee",
        password: "$2b$10$ICOZ157iUDLkL33RabV0h.5hn5r2Nw0pNL0vWK2eDfXYv6joip/a.", // "employee"
        role: "Employee",
      },
    ],
  });

  // Seed customers
  const customer1 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0001",
      name: "Priya Nair",
      phone: "9845612034",
      email: "priya.nair@example.com",
      alternatePhone: "9845612035",
      aadhaar: "123456789012",
      pan: "ABCDE1234F",
      dob: "1990-05-15",
      occupation: "Shop Owner",
      nomineeName: "Rajesh Nair",
      nomineePhone: "9845612035",
      address: "123, MG Road, Bengaluru, KA 560001",
      isActivated: false,
      isActive: true,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0002",
      name: "Anand Kumar",
      phone: "9087655123",
      email: "anand.kumar@example.com",
      aadhaar: "234567890123",
      pan: "BCDEF2345G",
      occupation: "Business",
      nomineeName: "Sunitha Kumar",
      nomineePhone: "9087655124",
      address: "456, Indiranagar, Bengaluru, KA 560038",
      isActivated: false,
      isActive: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0003",
      name: "Sneha Reddy",
      phone: "9745688900",
      email: "sneha.reddy@example.com",
      aadhaar: "345678901234",
      pan: "CDEFG3456H",
      occupation: "Teacher",
      nomineeName: "Karan Reddy",
      nomineePhone: "9745688901",
      address: "789, Jayanagar, Bengaluru, KA 560041",
      isActivated: false,
      isActive: true,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0004",
      name: "Vikram Shetty",
      phone: "9123476512",
      email: "vikram.shetty@example.com",
      aadhaar: "456789012345",
      pan: "DEFGH4567I",
      occupation: "Engineer",
      nomineeName: "Anitha Shetty",
      nomineePhone: "9123476513",
      address: "101, Koramangala, Bengaluru, KA 560034",
      isActivated: false,
      isActive: true,
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0005",
      name: "Meera Iyer",
      phone: "9988734211",
      email: "meera.iyer@example.com",
      aadhaar: "567890123456",
      pan: "EFGHI5678J",
      occupation: "Homemaker",
      nomineeName: "Hari Iyer",
      nomineePhone: "9988734212",
      address: "202, Malleshwaram, Bengaluru, KA 560003",
      isActivated: false,
      isActive: true,
    },
  });

  const customer6 = await prisma.customer.create({
    data: {
      customerNumber: "CUS0006",
      name: "Rahul Das",
      phone: "9812344567",
      email: "rahul.das@example.com",
      aadhaar: "678901234567",
      pan: "FGHIJ6789K",
      occupation: "Clerk",
      nomineeName: "Rita Das",
      nomineePhone: "9812344568",
      address: "303, Whitefield, Bengaluru, KA 560066",
      isActivated: false,
      isActive: true,
    },
  });

  // Seed loans
  const loan1 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260001",
      customerId: customer1.id,
      loanAmount: 120000.0,
      interestRate: 12.0,
      loanDate: "2025-10-12",
      loanClosingDate: "2026-10-12",
      loanTenure: 12,
      totalInterest: 14400.0,
      totalPayable: 134400.0,
      outstandingBalance: 134400.0,
      status: "Active",
      loanType: "regular",
    },
  });

  const loan2 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260002",
      customerId: customer2.id,
      loanAmount: 85000.0,
      interestRate: 11.0,
      loanDate: "2025-10-08",
      loanClosingDate: "2026-10-08",
      loanTenure: 12,
      totalInterest: 9350.0,
      totalPayable: 94350.0,
      outstandingBalance: 94350.0,
      status: "Active",
      loanType: "regular",
    },
  });

  const loan3 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260003",
      customerId: customer3.id,
      loanAmount: 210000.0,
      interestRate: 13.0,
      loanDate: "2025-06-01",
      loanClosingDate: "2026-06-01",
      loanTenure: 12,
      totalInterest: 27300.0,
      totalPayable: 237300.0,
      outstandingBalance: 237300.0,
      status: "Overdue",
      loanType: "regular",
    },
  });

  const loan4 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260004",
      customerId: customer4.id,
      loanAmount: 55000.0,
      interestRate: 12.0,
      loanDate: "2025-09-22",
      loanClosingDate: "2026-09-22",
      loanTenure: 12,
      totalInterest: 6600.0,
      totalPayable: 61600.0,
      outstandingBalance: 61600.0,
      status: "Active",
      loanType: "regular",
    },
  });

  const loan5 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260005",
      customerId: customer5.id,
      loanAmount: 145000.0,
      interestRate: 12.0,
      loanDate: "2025-02-15",
      loanClosingDate: "2026-02-15",
      loanTenure: 12,
      totalInterest: 17400.0,
      totalPayable: 162400.0,
      outstandingBalance: 0.0,
      status: "Closed",
      loanType: "regular",
    },
  });

  const loan6 = await prisma.loan.create({
    data: {
      loanNumber: "GL20260006",
      customerId: customer6.id,
      loanAmount: 72000.0,
      interestRate: 11.5,
      loanDate: "2025-10-02",
      loanClosingDate: "2026-10-02",
      loanTenure: 12,
      totalInterest: 8280.0,
      totalPayable: 80280.0,
      outstandingBalance: 80280.0,
      status: "Active",
      loanType: "regular",
    },
  });

  // Seed ornaments
  await prisma.ornament.createMany({
    data: [
      {
        loanId: loan1.id,
        type: "chain",
        category: "Chain",
        pieces: 1,
        grossWeight: 24.5,
        netWeight: 23.8,
        purity: "22K",
        stoneWeight: 0.7,
        estimatedValue: 150000,
        remarks: "Thick gold chain",
      },
      {
        loanId: loan1.id,
        type: "ring",
        category: "Ring",
        pieces: 2,
        grossWeight: 12.0,
        netWeight: 12.0,
        purity: "22K",
        stoneWeight: 0.0,
        estimatedValue: 75000,
        remarks: "Plain wedding rings",
      },
      {
        loanId: loan2.id,
        type: "bangle",
        category: "Bangles",
        pieces: 2,
        grossWeight: 20.0,
        netWeight: 19.5,
        purity: "22K",
        stoneWeight: 0.5,
        estimatedValue: 120000,
      },
      {
        loanId: loan3.id,
        type: "necklace",
        category: "Necklace",
        pieces: 1,
        grossWeight: 45.0,
        netWeight: 42.0,
        purity: "22K",
        stoneWeight: 3.0,
        estimatedValue: 270000,
      },
    ],
  });

  // Seed payments
  await prisma.payment.createMany({
    data: [
      {
        receiptNumber: "RCPT000001",
        loanId: loan1.id,
        paymentDate: "2025-11-12",
        amount: 12500,
        paymentMode: "UPI",
        remarks: "First monthly payment",
      },
      {
        receiptNumber: "RCPT000002",
        loanId: loan1.id,
        paymentDate: "2025-12-12",
        amount: 12500,
        paymentMode: "UPI",
      },
      {
        receiptNumber: "RCPT000003",
        loanId: loan5.id,
        paymentDate: "2026-02-15",
        amount: 162400,
        paymentMode: "Bank Transfer",
        remarks: "Full settlement and closure of loan",
      },
    ],
  });

  // Seed audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        module: "Branding",
        action: "Settings Updated",
        description: "Application successfully rebranded to Vyas Finance.",
      },
    ],
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

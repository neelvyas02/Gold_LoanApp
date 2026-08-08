import type { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service.js";
import { CustomerCreateSchema, CustomerUpdateSchema } from "../validations/customer.validation.js";

export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { search, tab } = req.query;
    const customers = await CustomerService.getCustomers(
      search as string,
      tab as string
    );
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const customer = await CustomerService.getCustomerById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = CustomerCreateSchema.parse(req.body);
    const result = await CustomerService.createCustomer(validatedData);
    res.status(201).json({
      success: true,
      message: "Customer and initial loan created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const validatedData = CustomerUpdateSchema.parse(req.body);
    const customer = await CustomerService.updateCustomer(id, validatedData);
    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const customer = await CustomerService.archiveCustomer(id);
    res.json({
      success: true,
      message: "Customer archived successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const customer = await CustomerService.restoreCustomer(id);
    res.json({
      success: true,
      message: "Customer restored successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomerPermanently(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const authReq = req as any;
    const performerId = authReq.user?.id;
    const performerRole = authReq.user?.role;

    const result = await CustomerService.deleteCustomerPermanently(
      id,
      performerId,
      performerRole
    );

    res.json({
      success: true,
      message: result.message || "Customer permanently deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

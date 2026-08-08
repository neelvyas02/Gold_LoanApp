import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ImagePlus, Plus, Trash2, Upload, X, Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApiClient, API_BASE_URL } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/customers/add")({
  component: AddCustomerPage,
  head: () => ({
    meta: [
      { title: "Add Customer — Vyas Finance" },
      { name: "description", content: "Create a new customer with KYC, ornament and loan details." },
    ],
  }),
});

const MANDATORY_DOCS = [
  { id: "Aadhaar Card", name: "Aadhaar Card", errorKey: "aadhaarUpload" },
  { id: "PAN Card", name: "PAN Card", errorKey: "panUpload" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 md:p-7 rounded-2xl bg-card border-border shadow-[var(--shadow-soft)]">
      <div className="mb-5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  error,
  id,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
}) {
  return (
    <div id={id ? `field-container-${id}` : undefined} className="space-y-1.5 w-full">
      <Label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive font-medium mt-1">🔴 {error}</p>}
    </div>
  );
}

interface OrnamentInput {
  id: number;
  category: string;
  customOrnamentName: string;
  pieces: number;
  grossWeight: number;
  netWeight: number;
  purity: string;
  stoneWeight: number;
  estimatedValue: number;
  remarks: string;
  photos: string[];
}

function AddCustomerPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    alternateMobile: "",
    aadhaar: "",
    pan: "",
    dob: "",
    occupation: "",
    nomineeName: "",
    nomineeMobile: "",
    address: "",
    loanType: "regular",
    loanDate: new Date().toISOString().split("T")[0],
    loanClosingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    paymentMode: "cash",
  });

  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(12);

  // Documents state
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ documentType: string; fileName: string; filePath: string }>>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Ornaments state
  const [ornaments, setOrnaments] = useState<OrnamentInput[]>([
    {
      id: 1,
      category: "ring",
      customOrnamentName: "",
      pieces: 1,
      grossWeight: 0,
      netWeight: 0,
      purity: "22k",
      stoneWeight: 0,
      estimatedValue: 0,
      remarks: "",
      photos: [],
    },
  ]);
  const [uploadingOrnamentIdx, setUploadingOrnamentIdx] = useState<number | null>(null);

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateMonths = (d1Str: string, d2Str: string) => {
    if (!d1Str || !d2Str) return 12;
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffTime > 0 ? Math.max(1, Math.round(diffDays / 30.44)) : 12;
  };

  const loanTenure = calculateMonths(formData.loanDate, formData.loanClosingDate);
  const interest = Math.round((amount * rate * loanTenure) / 1200);
  const total = amount + interest;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleLoanDateChange = (dateVal: string) => {
    setFormData((prev) => {
      const updated = { ...prev, loanDate: dateVal };
      if (dateVal) {
        const d = new Date(dateVal);
        d.setMonth(d.getMonth() + 12);
        updated.loanClosingDate = d.toISOString().split("T")[0];
      }
      return updated;
    });
    if (errors.loanDate || errors.loanClosingDate) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.loanDate;
        delete copy.loanClosingDate;
        return copy;
      });
    }
  };

  const handleOrnamentChange = (idx: number, field: keyof OrnamentInput, value: any) => {
    const list = [...ornaments];
    list[idx] = { ...list[idx], [field]: value };
    setOrnaments(list);

    const errorKey = field === "customOrnamentName" ? `ornament-customName-${idx}` : `ornament-${String(field)}-${idx}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  // Document Upload & Replacement logic
  const handleDocFileChange = async (docType: string, file: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Only PDF, JPG, JPEG, PNG are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds the 10 MB limit.");
      return;
    }

    setUploadingDoc(docType);
    try {
      const existingDoc = uploadedDocuments.find((d) => d.documentType === docType);

      const uploadData = new FormData();
      uploadData.append("document", file);
      if (existingDoc?.filePath) {
        uploadData.append("previousFilePath", existingDoc.filePath);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/uploads/document`, {
        method: "POST",
        body: uploadData,
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const payload = await res.json();
      const { filePath, fileName } = payload.data;

      setUploadedDocuments((prev) => {
        const filtered = prev.filter((d) => d.documentType !== docType);
        return [...filtered, { documentType: docType, fileName, filePath }];
      });

      if (docType === "Aadhaar Card" || docType === "Aadhaar") {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.aadhaarUpload;
          return copy;
        });
      }
      if (docType === "PAN Card" || docType === "PAN") {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.panUpload;
          return copy;
        });
      }
      toast.success(`${docType} uploaded successfully`);
    } catch (e: any) {
      toast.error(`Failed to upload ${docType}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Ornament Image Upload
  const handleOrnamentImageChange = async (idx: number, file: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only ornament image files (JPG, JPEG, PNG) are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB limit.");
      return;
    }

    setUploadingOrnamentIdx(idx);
    try {
      const uploadData = new FormData();
      uploadData.append("ornament", file);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/uploads/ornament`, {
        method: "POST",
        body: uploadData,
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const payload = await res.json();
      const { filePath } = payload.data;

      const list = [...ornaments];
      list[idx] = {
        ...list[idx],
        photos: [...(list[idx].photos || []), filePath],
      };
      setOrnaments(list);
      toast.success("Ornament photo added");
    } catch (e: any) {
      toast.error("Failed to upload ornament image");
    } finally {
      setUploadingOrnamentIdx(null);
    }
  };

  const removeOrnamentPhoto = (ornamentIdx: number, photoPath: string) => {
    const list = [...ornaments];
    list[ornamentIdx] = {
      ...list[ornamentIdx],
      photos: list[ornamentIdx].photos.filter((p) => p !== photoPath),
    };
    setOrnaments(list);
  };

  // Live Validity Check
  const isAadhaarDocUploaded = uploadedDocuments.some((d) => d.documentType === "Aadhaar Card" || d.documentType === "Aadhaar");
  const isPanDocUploaded = uploadedDocuments.some((d) => d.documentType === "PAN Card" || d.documentType === "PAN");
  const isFormValid =
    formData.name.trim().length >= 3 &&
    /^\d{10}$/.test(formData.mobile.trim()) &&
    Boolean(formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) &&
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim()) &&
    /^\d{12}$/.test(formData.aadhaar.trim()) &&
    formData.address.trim().length > 0 &&
    isAadhaarDocUploaded &&
    isPanDocUploaded &&
    amount > 0 &&
    rate >= 0 &&
    Boolean(formData.loanDate) &&
    Boolean(formData.loanClosingDate) &&
    ornaments.length > 0 &&
    ornaments.every((o) => o.grossWeight > 0 && o.netWeight > 0 && o.estimatedValue > 0);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    let toastId: string | number | undefined = undefined;

    try {
      if (!formData.name || !formData.name.trim()) {
        newErrors.name = "Customer Name is required.";
      } else if (formData.name.trim().length < 3) {
        newErrors.name = "Full name must be at least 3 characters.";
      }

      if (!formData.mobile) {
        newErrors.mobile = "Mobile Number is required.";
      } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
        newErrors.mobile = "Mobile Number must contain exactly 10 digits.";
      }

      if (!formData.email || !formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }

      if (!formData.pan || !formData.pan.trim()) {
        newErrors.pan = "PAN Number is required.";
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim())) {
        newErrors.pan = "Invalid PAN Number.";
      }

      if (!formData.aadhaar || !formData.aadhaar.trim()) {
        newErrors.aadhaar = "Aadhaar Number is required.";
      } else if (!/^\d{12}$/.test(formData.aadhaar.trim())) {
        newErrors.aadhaar = "Invalid Aadhaar Number.";
      }

      if (!formData.address || !formData.address.trim()) {
        newErrors.address = "Address is required.";
      }

      if (!amount || amount <= 0) {
        newErrors.amount = "Loan Amount must be greater than zero.";
      }

      if (rate === undefined || rate === null || rate < 0) {
        newErrors.rate = "Interest Rate cannot be negative.";
      }

      if (formData.alternateMobile && formData.alternateMobile.trim() !== "") {
        if (!/^\d{10}$/.test(formData.alternateMobile.trim())) {
          newErrors.alternateMobile = "Alternate Phone must be 10 digits.";
        } else if (formData.alternateMobile.trim() === formData.mobile.trim()) {
          newErrors.alternateMobile = "Primary and alternate phone numbers cannot be identical.";
        }
      }

      if (!formData.dob) {
        newErrors.dob = "Date of Birth is required.";
      } else {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        if (dobDate > today) {
          newErrors.dob = "Date of Birth cannot be in the future.";
        }
      }

      if (!formData.loanClosingDate) {
        newErrors.loanClosingDate = "Loan Closing Date is required.";
      } else {
        const loanDate = new Date(formData.loanDate);
        const closingDate = new Date(formData.loanClosingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (closingDate < loanDate) {
          newErrors.loanClosingDate = "Closing Date cannot be earlier than Loan Date.";
        } else if (closingDate < today) {
          newErrors.loanClosingDate = "Closing Date cannot be in the past.";
        }
      }

      ornaments.forEach((o, index) => {
        if (o.category.toLowerCase() === "other" && (!o.customOrnamentName || !o.customOrnamentName.trim())) {
          newErrors[`ornament-customName-${index}`] = "Please enter a custom ornament name.";
        }
        if (o.grossWeight <= 0) {
          newErrors[`ornament-grossWeight-${index}`] = "Gross weight must be greater than zero.";
        }
        if (o.netWeight <= 0) {
          newErrors[`ornament-netWeight-${index}`] = "Net weight must be greater than zero.";
        } else if (o.netWeight > o.grossWeight) {
          newErrors[`ornament-netWeight-${index}`] = "Net weight cannot exceed gross weight.";
        }
        if (o.estimatedValue <= 0) {
          newErrors[`ornament-estimatedValue-${index}`] = "Estimated value must be greater than zero.";
        }
      });

      if (!isAadhaarDocUploaded) {
        newErrors.aadhaarUpload = "Aadhaar Card document upload is required.";
      }

      if (!isPanDocUploaded) {
        newErrors.panUpload = "PAN Card document upload is required.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fix all mandatory form validation errors before saving.");

        // Scroll to first invalid field
        const firstKey = Object.keys(newErrors)[0];
        const element = document.getElementById(firstKey) || document.getElementById(`field-container-${firstKey}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => element.focus(), 300);
        }
        return;
      }

      setSubmitting(true);
      toastId = toast.loading("Saving customer and loan details...");

      const aadhaarDocObj = uploadedDocuments.find((d) => d.documentType === "Aadhaar Card" || d.documentType === "Aadhaar");
      const panDocObj = uploadedDocuments.find((d) => d.documentType === "PAN Card" || d.documentType === "PAN");

      const payload = {
        name: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        alternatePhone: formData.alternateMobile ? formData.alternateMobile.trim() : null,
        aadhaar: formData.aadhaar.trim(),
        pan: formData.pan.trim(),
        dob: formData.dob || null,
        occupation: formData.occupation ? formData.occupation.trim() : "Other",
        nomineeName: formData.nomineeName ? formData.nomineeName.trim() : "N/A",
        nomineePhone: formData.nomineeMobile ? formData.nomineeMobile.trim() : "N/A",
        address: formData.address.trim(),
        aadhaarDocument: aadhaarDocObj ? aadhaarDocObj.filePath : null,
        panDocument: panDocObj ? panDocObj.filePath : null,
        loan: {
          loanAmount: amount,
          interestRate: rate,
          loanDate: formData.loanDate,
          maturityDate: formData.loanClosingDate,
          loanType: formData.loanType,
        },
        ornaments: ornaments.map((o) => ({
          category: o.category,
          customOrnamentName: o.category.toLowerCase() === "other" ? o.customOrnamentName : null,
          pieces: Number(o.pieces) || 1,
          grossWeight: Number(o.grossWeight) || 0,
          netWeight: Number(o.netWeight) || 0,
          purity: o.purity,
          stoneWeight: Number(o.stoneWeight) || 0,
          estimatedValue: Number(o.estimatedValue) || 0,
          remarks: o.remarks || null,
          photos: o.photos || [],
        })),
        documents: uploadedDocuments,
      };

      const result = await ApiClient.createCustomer(payload);
      toast.success("Customer and Loan created successfully!", { id: toastId });
      navigate({ to: "/customers", search: { search: undefined, tab: "all" } });
    } catch (error: any) {
      console.error("Error saving customer:", error);
      const errMsg = error.message || "Failed to save customer. Please try again.";
      toast.error(errMsg, { id: toastId });

      if (errMsg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
        document.getElementById("email")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errMsg.toLowerCase().includes("pan")) {
        setErrors((prev) => ({ ...prev, pan: errMsg }));
        document.getElementById("pan")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errMsg.toLowerCase().includes("aadhaar")) {
        setErrors((prev) => ({ ...prev, aadhaar: errMsg }));
        document.getElementById("aadhaar")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Add Customer"
      subtitle="Complete KYC, mandatory document uploads and loan setup"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild disabled={submitting}>
            <Link to="/customers" search={{ search: undefined, tab: "all" }}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)] min-w-[140px] cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Customer"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Customer Details */}
        <Section title="Customer Details" description="Personal, contact, and identity information">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full Name" required error={errors.name} id="name">
              <Input
                id="name"
                placeholder="Priya Nair"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Phone Number" required error={errors.mobile} id="mobile">
              <Input
                id="mobile"
                placeholder="9845612034"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                maxLength={10}
                className={errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Email Address" required error={errors.email} id="email">
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="PAN Number" required error={errors.pan} id="pan">
              <Input
                id="pan"
                placeholder="ABCDE1234F"
                value={formData.pan}
                onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                maxLength={10}
                className={errors.pan ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Aadhaar Number" required error={errors.aadhaar} id="aadhaar">
              <Input
                id="aadhaar"
                placeholder="12-digit number"
                value={formData.aadhaar}
                onChange={(e) => handleInputChange("aadhaar", e.target.value)}
                maxLength={12}
                className={errors.aadhaar ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Alternate Phone" error={errors.alternateMobile} id="alternateMobile">
              <Input
                id="alternateMobile"
                placeholder="9845612035"
                value={formData.alternateMobile}
                onChange={(e) => handleInputChange("alternateMobile", e.target.value)}
                maxLength={10}
                className={errors.alternateMobile ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Date of Birth" error={errors.dob} id="dob">
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange("dob", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={errors.dob ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>

            <Field label="Occupation" id="occupation">
              <Input
                id="occupation"
                placeholder="e.g. Business Owner"
                value={formData.occupation}
                onChange={(e) => handleInputChange("occupation", e.target.value)}
              />
            </Field>

            <Field label="Nominee Name" id="nomineeName">
              <Input
                id="nomineeName"
                placeholder="Nominee Full Name"
                value={formData.nomineeName}
                onChange={(e) => handleInputChange("nomineeName", e.target.value)}
              />
            </Field>

            <Field label="Nominee Phone" id="nomineeMobile">
              <Input
                id="nomineeMobile"
                placeholder="Nominee Contact"
                value={formData.nomineeMobile}
                onChange={(e) => handleInputChange("nomineeMobile", e.target.value)}
                maxLength={10}
              />
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Address" required error={errors.address} id="address">
                <Textarea
                  id="address"
                  placeholder="Street, City, State, PIN"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={errors.address ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Documents */}
        <Section title="Compulsory Documents Upload" description="Aadhaar Card and PAN Card uploads are mandatory">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MANDATORY_DOCS.map((d) => {
              const docInfo = uploadedDocuments.find((doc) => doc.documentType === d.name || doc.documentType === d.id);
              const isUploading = uploadingDoc === d.name;
              const errorMsg = errors[d.errorKey];
              const isUploaded = Boolean(docInfo);

              return (
                <div
                  key={d.id}
                  id={d.errorKey}
                  className={`p-4 rounded-xl border transition-all ${
                    isUploaded
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-destructive bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {isUploaded ? "🟢" : "🔴"} {d.name} <span className="text-destructive">*</span>
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isUploaded ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300" : "bg-destructive/20 text-destructive"
                    }`}>
                      {isUploaded ? `${docInfo?.fileName || "Uploaded"} ✓` : "No file uploaded"}
                    </span>
                  </div>

                  {errorMsg && !isUploaded && (
                    <p className="text-xs text-destructive font-medium mb-3">🔴 {errorMsg}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-sm">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 text-gold animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-gold" />
                      )}
                      <span>{isUploaded ? "Replace File" : "Upload File"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocFileChange(d.name, file);
                        }}
                        disabled={isUploading}
                      />
                    </label>
                    {isUploaded && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        Path: {docInfo?.filePath}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Ornaments */}
        <Section title="Ornament Details" description="Add each ornament pledged as collateral">
          <div className="space-y-4">
            {ornaments.map((o, idx) => (
              <div key={o.id} className="rounded-xl border border-border p-5 bg-muted/40">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-gold text-gold-foreground hover:bg-gold">
                    Ornament #{idx + 1}
                  </Badge>
                  {ornaments.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setOrnaments(ornaments.filter((x) => x.id !== o.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Category">
                    <Select
                      value={o.category}
                      onValueChange={(val) => handleOrnamentChange(idx, "category", val)}
                    >
                      <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ring">Ring</SelectItem>
                        <SelectItem value="chain">Chain</SelectItem>
                        <SelectItem value="necklace">Necklace</SelectItem>
                        <SelectItem value="bracelet">Bracelet</SelectItem>
                        <SelectItem value="bangles">Bangles</SelectItem>
                        <SelectItem value="coin">Coin</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="earrings">Earrings</SelectItem>
                        <SelectItem value="pendant">Pendant</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Pieces">
                    <Input
                      id={`ornament-pieces-${idx}`}
                      type="number"
                      value={o.pieces}
                      onChange={(e) => handleOrnamentChange(idx, "pieces", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Gross Weight (g)" required error={errors[`ornament-grossWeight-${idx}`]} id={`ornament-grossWeight-${idx}`}>
                    <Input
                      id={`ornament-grossWeight-${idx}`}
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={o.grossWeight || ""}
                      onChange={(e) => handleOrnamentChange(idx, "grossWeight", Number(e.target.value))}
                      className={errors[`ornament-grossWeight-${idx}`] ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </Field>
                  <Field label="Net Weight (g)" required error={errors[`ornament-netWeight-${idx}`]} id={`ornament-netWeight-${idx}`}>
                    <Input
                      id={`ornament-netWeight-${idx}`}
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={o.netWeight || ""}
                      onChange={(e) => handleOrnamentChange(idx, "netWeight", Number(e.target.value))}
                      className={errors[`ornament-netWeight-${idx}`] ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </Field>

                  {o.category.toLowerCase() === "other" && (
                    <div className="md:col-span-2 lg:col-span-4">
                      <Field label="Enter Ornament Type" required error={errors[`ornament-customName-${idx}`]} id={`ornament-customName-${idx}`}>
                        <Input
                          id={`ornament-customName-${idx}`}
                          placeholder="e.g. Antique Gold Coin"
                          value={o.customOrnamentName}
                          onChange={(e) => handleOrnamentChange(idx, "customOrnamentName", e.target.value)}
                          className={errors[`ornament-customName-${idx}`] ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label="Purity">
                    <Select
                      value={o.purity}
                      onValueChange={(val) => handleOrnamentChange(idx, "purity", val)}
                    >
                      <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18k">18K</SelectItem>
                        <SelectItem value="20k">20K</SelectItem>
                        <SelectItem value="22k">22K</SelectItem>
                        <SelectItem value="24k">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Stone Weight (g)">
                    <Input
                      id={`ornament-stoneWeight-${idx}`}
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={o.stoneWeight || ""}
                      onChange={(e) => handleOrnamentChange(idx, "stoneWeight", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Estimated Value (₹)" required error={errors[`ornament-estimatedValue-${idx}`]} id={`ornament-estimatedValue-${idx}`}>
                    <Input
                      id={`ornament-estimatedValue-${idx}`}
                      type="number"
                      placeholder="0"
                      value={o.estimatedValue || ""}
                      onChange={(e) => handleOrnamentChange(idx, "estimatedValue", Number(e.target.value))}
                      className={errors[`ornament-estimatedValue-${idx}`] ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </Field>
                  <Field label="Remarks">
                    <Input
                      id={`ornament-remarks-${idx}`}
                      placeholder="Notes"
                      value={o.remarks}
                      onChange={(e) => handleOrnamentChange(idx, "remarks", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed cursor-pointer"
              onClick={() =>
                setOrnaments([
                  ...ornaments,
                  {
                    id: Date.now(),
                    category: "ring",
                    customOrnamentName: "",
                    pieces: 1,
                    grossWeight: 0,
                    netWeight: 0,
                    purity: "22k",
                    stoneWeight: 0,
                    estimatedValue: 0,
                    remarks: "",
                    photos: [],
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Another Ornament
            </Button>
          </div>
        </Section>

        {/* Loan Details */}
        <Section title="Loan Details" description="Auto-calculated interest and total">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Loan Number">
              <Input value="Auto-generated" readOnly className="bg-muted" />
            </Field>
            <Field label="Loan Type">
              <Select
                value={formData.loanType}
                onValueChange={(val) => handleInputChange("loanType", val)}
              >
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="bullet">Bullet</SelectItem>
                  <SelectItem value="monthly">Monthly Interest</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Loan Status">
              <Input value="Active" readOnly className="bg-muted" />
            </Field>
            <Field label="Loan Amount (₹)" required error={errors.amount} id="amount">
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>
            <Field label="Interest Rate (% p.a.)" required error={errors.rate} id="rate">
              <Input
                id="rate"
                type="number"
                value={rate === 0 ? "0" : rate || ""}
                onChange={(e) => setRate(Number(e.target.value))}
                className={errors.rate ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>
            <Field label="Loan Date" required error={errors.loanDate} id="loanDate">
              <Input
                id="loanDate"
                type="date"
                value={formData.loanDate}
                onChange={(e) => handleLoanDateChange(e.target.value)}
                className={errors.loanDate ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>
            <Field label="Loan Closing Date" required error={errors.loanClosingDate} id="loanClosingDate">
              <Input
                id="loanClosingDate"
                type="date"
                value={formData.loanClosingDate}
                onChange={(e) => handleInputChange("loanClosingDate", e.target.value)}
                min={formData.loanDate || new Date().toISOString().split("T")[0]}
                className={errors.loanClosingDate ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Payment Mode">
                <RadioGroup
                  value={formData.paymentMode}
                  onValueChange={(val) => handleInputChange("paymentMode", val)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {["Cash", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                    <label
                      key={m}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-accent/30 text-sm text-foreground"
                    >
                      <RadioGroupItem value={m.toLowerCase()} />
                      {m}
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          </div>

          <Separator className="my-6 border-border" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-lg font-semibold mt-1 text-foreground">₹{amount.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Interest ({loanTenure} mo)</p>
              <p className="text-lg font-semibold mt-1 text-foreground">₹{interest.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-gold/10 border border-gold/30 p-4">
              <p className="text-xs text-gold font-medium">Total Payable</p>
              <p className="text-lg font-semibold mt-1 text-gold">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

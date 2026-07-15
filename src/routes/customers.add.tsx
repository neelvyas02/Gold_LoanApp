import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
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

export const Route = createFileRoute("/customers/add")({
  component: AddCustomerPage,
  head: () => ({
    meta: [
      { title: "Add Customer — GoldVault" },
      { name: "description", content: "Create a new customer with KYC, ornament and loan details." },
    ],
  }),
});

const DOCS = [
  { name: "Aadhaar", required: true },
  { name: "PAN", required: false },
  { name: "Driving Licence", required: false },
  { name: "Voter ID", required: false },
  { name: "Passport", required: false },
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
    <Card className="p-6 md:p-7 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
      <div className="mb-5">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
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
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AddCustomerPage() {
  const [ornaments, setOrnaments] = useState([{ id: 1 }]);
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(12);
  const months = 12;
  const interest = Math.round((amount * rate * months) / 1200);
  const total = amount + interest;

  return (
    <AppShell
      title="Add Customer"
      subtitle="Complete KYC, ornament details and loan setup"
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/customers">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Link>
          </Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]">
            Save Customer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Customer Details */}
        <Section title="Customer Details" description="Personal and contact information">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full Name" required>
              <Input placeholder="Priya Nair" />
            </Field>
            <Field label="Mobile Number" required>
              <Input placeholder="+91" />
            </Field>
            <Field label="Alternate Mobile">
              <Input placeholder="+91" />
            </Field>
            <Field label="Aadhaar Number" required>
              <Input placeholder="XXXX-XXXX-XXXX" />
            </Field>
            <Field label="PAN Number">
              <Input placeholder="ABCDE1234F" />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" />
            </Field>
            <Field label="Occupation">
              <Input placeholder="e.g. Shop Owner" />
            </Field>
            <Field label="Nominee Name">
              <Input placeholder="Full name" />
            </Field>
            <Field label="Nominee Mobile">
              <Input placeholder="+91" />
            </Field>
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Address" required>
                <Textarea placeholder="Street, City, State, PIN" rows={2} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Documents */}
        <Section title="Document Upload" description="Upload identity proofs (Aadhaar required)">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {DOCS.map((d) => (
              <label
                key={d.name}
                className="cursor-pointer rounded-xl border border-dashed border-border p-4 hover:border-[color:var(--gold)] hover:bg-accent/40 transition-colors flex flex-col items-center justify-center text-center min-h-[130px]"
              >
                <div className="h-9 w-9 rounded-lg bg-[color:var(--muted)] grid place-items-center mb-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {d.required ? "Required" : "Optional"}
                </p>
                <input type="file" className="hidden" />
              </label>
            ))}
          </div>
        </Section>

        {/* Ornaments */}
        <Section
          title="Ornament Details"
          description="Add each ornament pledged as collateral"
        >
          <div className="space-y-4">
            {ornaments.map((o, idx) => (
              <div
                key={o.id}
                className="rounded-xl border border-border p-5 bg-[color:var(--muted)]/40"
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-gold text-gold-foreground hover:bg-gold">
                    Ornament #{idx + 1}
                  </Badge>
                  {ornaments.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setOrnaments(ornaments.filter((x) => x.id !== o.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Type">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ring">Ring</SelectItem>
                        <SelectItem value="chain">Chain</SelectItem>
                        <SelectItem value="bangle">Bangle</SelectItem>
                        <SelectItem value="necklace">Necklace</SelectItem>
                        <SelectItem value="earring">Earring</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Pieces">
                    <Input type="number" placeholder="1" />
                  </Field>
                  <Field label="Gross Weight (g)">
                    <Input type="number" placeholder="0.00" step="0.01" />
                  </Field>
                  <Field label="Net Weight (g)">
                    <Input type="number" placeholder="0.00" step="0.01" />
                  </Field>
                  <Field label="Purity">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="22K" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18k">18K</SelectItem>
                        <SelectItem value="20k">20K</SelectItem>
                        <SelectItem value="22k">22K</SelectItem>
                        <SelectItem value="24k">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Stone Weight (g)">
                    <Input type="number" placeholder="0.00" step="0.01" />
                  </Field>
                  <Field label="Estimated Value (₹)">
                    <Input type="number" placeholder="0" />
                  </Field>
                  <Field label="Remarks">
                    <Input placeholder="Notes" />
                  </Field>
                </div>

                {/* Ornament photos */}
                <div className="mt-5">
                  <p className="text-xs font-medium mb-2">Photos (max 5)</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--muted)] border border-border relative overflow-hidden grid place-items-center"
                      >
                        <ImagePlus className="h-5 w-5 text-[color:var(--gold)]/70" />
                        <button className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 grid place-items-center shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border border-dashed border-border grid place-items-center cursor-pointer hover:border-[color:var(--gold)] hover:bg-accent/40">
                      <div className="text-center">
                        <ImagePlus className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground mt-1">Add</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                setOrnaments([...ornaments, { id: Date.now() }])
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
              <Input value="GV-2042" readOnly className="bg-[color:var(--muted)]" />
            </Field>
            <Field label="Loan Type">
              <Select defaultValue="regular">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="bullet">Bullet</SelectItem>
                  <SelectItem value="monthly">Monthly Interest</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Loan Status">
              <Select defaultValue="active">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Loan Amount (₹)">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Field>
            <Field label="Interest Rate (% p.a.)">
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </Field>
            <Field label="Loan Date">
              <Input type="date" />
            </Field>
            <Field label="Maturity Date">
              <Input type="date" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Payment Mode">
                <RadioGroup defaultValue="cash" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Cash", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                    <label
                      key={m}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 cursor-pointer has-[:checked]:border-[color:var(--gold)] has-[:checked]:bg-accent/50 text-sm"
                    >
                      <RadioGroupItem value={m.toLowerCase()} />
                      {m}
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[color:var(--muted)] p-4">
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-lg font-semibold mt-1">₹{amount.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-[color:var(--muted)] p-4">
              <p className="text-xs text-muted-foreground">Interest ({months} mo)</p>
              <p className="text-lg font-semibold mt-1">₹{interest.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-gold/15 border border-gold/30 p-4">
              <p className="text-xs text-[color:var(--gold-foreground)]/70">Total Payable</p>
              <p className="text-lg font-semibold mt-1 text-[color:var(--gold-foreground)]">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

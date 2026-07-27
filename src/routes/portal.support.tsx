import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  LifeBuoy, 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/support")({
  component: CustomerSupportPage,
});

const CATEGORIES = [
  "Loan Inquiry",
  "Payment Issue",
  "Gold Details",
  "Document Issue",
  "Other"
];

function CustomerSupportPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  
  // Form states
  const [category, setCategory] = useState("Loan Inquiry");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const list = await ApiClient.getPortalSupportTickets();
      setTickets(list || []);
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in both subject and description");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting support ticket...");
    try {
      await ApiClient.submitPortalSupportTicket({
        category,
        subject,
        description
      });
      toast.success("Support ticket submitted successfully!", { id: toastId });
      setSubject("");
      setDescription("");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit ticket", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Support Desk</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Submit help inquiries, report payment issues, or request callback updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Submit Ticket Form */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Submit New Ticket</h3>
          <Card className="p-5 border-border bg-card rounded-2xl shadow-[var(--shadow-card)]">
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs text-muted-foreground font-semibold">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border text-foreground text-xs rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs text-muted-foreground font-semibold">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of issue"
                  className="rounded-xl h-10 border-border text-xs focus-visible:ring-gold"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs text-muted-foreground font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete details..."
                  className="rounded-xl border-border text-xs focus-visible:ring-gold"
                  rows={4}
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-10 font-medium shadow-[var(--shadow-gold)]"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Tickets History List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Inquiry History</h3>

          {tickets.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl text-xs text-muted-foreground">
              No support tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <Card key={t.id} className="p-5 border-border bg-card rounded-2xl shadow-sm space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{t.category}</span>
                      <h4 className="font-bold text-sm text-foreground mt-0.5">{t.subject}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Ticket ID: {t.ticketNumber}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      t.status === "Open" 
                        ? "bg-gold/15 text-gold" 
                        : t.status === "Resolved" 
                        ? "bg-success/15 text-success" 
                        : t.status === "Closed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-info/15 text-info"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                    {t.description}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Submitted: {new Date(t.createdAt).toLocaleString("en-IN")}</span>
                  </div>

                  {t.adminReply && (
                    <div className="mt-3 p-4 bg-gold/5 border border-gold/10 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Staff Response
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                        {t.adminReply}
                      </p>
                      <span className="text-[9px] text-muted-foreground/60 block mt-1.5">
                        Replied on {new Date(t.updatedAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

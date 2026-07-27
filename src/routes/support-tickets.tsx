import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Filter, MessageSquare, User, Calendar, CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/support-tickets")({
  component: AdminSupportTicketsPage,
  head: () => ({
    meta: [
      { title: "Support Tickets — Vyas Finance" },
      { name: "description", content: "Manage customer helpdesk requests." },
    ],
  }),
});

function AdminSupportTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reply States
  const [replyText, setReplyText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getAdminTickets(statusFilter, searchQuery);
      setTickets(data || []);
      
      // Keep selected ticket in sync if it is still in the fetched list
      if (selectedTicket) {
        const found = data.find((t: any) => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    if (!replyText.trim() && !updatingStatus) {
      toast.error("Please enter a reply or change the ticket status");
      return;
    }

    setSubmittingReply(true);
    const toastId = toast.loading("Updating support ticket...");
    try {
      const payload: any = {};
      if (updatingStatus) payload.status = updatingStatus;
      if (replyText.trim()) payload.adminReply = replyText.trim();

      const result = await ApiClient.updateTicketStatus(selectedTicket.id, payload);
      toast.success("Ticket updated successfully!", { id: toastId });
      setReplyText("");
      setUpdatingStatus("");
      
      // Refresh list
      const updatedList = await ApiClient.getAdminTickets(statusFilter, searchQuery);
      setTickets(updatedList || []);
      setSelectedTicket(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to update ticket", { id: toastId });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <AppShell title="Support Tickets" subtitle="Manage and reply to customer inquiries and issues">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 border-border bg-card rounded-2xl shadow-[var(--shadow-soft)] space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border text-xs focus-visible:ring-gold"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-xs rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </Card>

          {/* Tickets List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading && tickets.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl text-xs text-muted-foreground">
                No tickets found matching filters.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setUpdatingStatus(t.status);
                  }}
                  className={`p-4 border border-border bg-card rounded-xl shadow-sm cursor-pointer transition-all hover:border-gold hover:shadow-md ${
                    selectedTicket?.id === t.id ? "border-gold bg-gold/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{t.category}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
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
                  <h4 className="font-bold text-xs text-foreground mt-1.5 truncate">{t.subject}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">By {t.customer?.name} ({t.ticketNumber})</p>
                  <span className="text-[8px] text-muted-foreground/60 block mt-2">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & Reply */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="p-6 border border-border bg-card rounded-2xl shadow-[var(--shadow-soft)] space-y-6">
              {/* Detail Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">{selectedTicket.category}</span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">{selectedTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">{selectedTicket.ticketNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3.5 w-3.5" />
                      {selectedTicket.customer?.name} ({selectedTicket.customer?.customerNumber})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedTicket.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedTicket.status === "Open" 
                    ? "bg-gold/15 text-gold" 
                    : selectedTicket.status === "Resolved" 
                    ? "bg-success/15 text-success" 
                    : selectedTicket.status === "Closed"
                    ? "bg-muted text-muted-foreground"
                    : "bg-info/15 text-info"
                }`}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Customer Description</span>
                <p className="text-xs text-foreground bg-muted/40 p-4 rounded-xl border border-border whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Existing Response */}
              {selectedTicket.adminReply && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-gold font-bold tracking-wider">Current Staff Response</span>
                  <p className="text-xs text-foreground bg-gold/5 p-4 rounded-xl border border-gold/10 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.adminReply}
                  </p>
                  <span className="text-[9px] text-muted-foreground/60 block">
                    Last updated: {new Date(selectedTicket.updatedAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleUpdateTicket} className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Take Action</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ticketStatus" className="text-xs text-muted-foreground font-semibold">Update Status</Label>
                    <select
                      id="ticketStatus"
                      value={updatingStatus}
                      onChange={(e) => setUpdatingStatus(e.target.value)}
                      className="w-full bg-background border border-border text-foreground text-xs rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="replyText" className="text-xs text-muted-foreground font-semibold">
                    {selectedTicket.adminReply ? "Edit Response" : "Write Response / Reply"}
                  </Label>
                  <Textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter message for the customer..."
                    className="rounded-xl border-border text-xs focus-visible:ring-gold"
                    rows={4}
                    disabled={submittingReply}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={submittingReply}
                    className="bg-gold hover:bg-gold/90 text-gold-foreground rounded-xl h-10 px-6 font-medium shadow-[var(--shadow-gold)] gap-2"
                  >
                    {submittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Changes
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="h-80 border border-border bg-card rounded-2xl shadow-[var(--shadow-soft)] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3" />
              <p className="text-xs font-semibold">Select a support ticket from the list to view details and reply.</p>
            </Card>
          )}
        </div>

      </div>
    </AppShell>
  );
}

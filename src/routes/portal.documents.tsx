import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ApiClient, getFileUrl } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/documents")({
  component: CustomerDocumentsPage,
});

function CustomerDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetchDocumentsData();
  }, []);

  const fetchDocumentsData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getPortalDocuments();
      setDocuments(data || []);
    } catch (error) {
      toast.error("Failed to load documents list");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (filePath: string, fileName: string) => {
    const url = getFileUrl(filePath);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Documents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Access your submitted KYC proofs and loan agreement documents.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 max-w-lg mx-auto space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 border-border bg-card rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-foreground leading-normal">{doc.documentType}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-full">
                    {doc.fileName}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-1 border-t border-border">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(getFileUrl(doc.filePath), "_blank")}
                  className="flex-1 rounded-lg text-xs h-8.5 border-border gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  onClick={() => handleDownloadFile(doc.filePath, doc.fileName)}
                  className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground rounded-lg text-xs h-8.5 gap-1.5 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

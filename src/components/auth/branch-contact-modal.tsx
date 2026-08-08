import React from "react";
import { Phone, Mail, MapPin, X, Shield, Clock } from "lucide-react";
import { VFLogo } from "@/components/ui/vf-logo";

interface BranchContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchContactModal({ isOpen, onClose }: BranchContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-gold/5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="branch-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Close branch contact information"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <VFLogo size="sm" />
          <div>
            <h3 id="branch-modal-title" className="text-lg font-bold text-foreground leading-tight">
              Vyas Finance Branch Support
            </h3>
            <p className="text-xs text-muted-foreground">Gold Loan Administrative Branch</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-foreground">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/60">
            <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Branch Address</p>
              <p className="text-sm font-medium mt-0.5">MG Road, Bengaluru, KA 560001</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/60">
            <Phone className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Helpline & WhatsApp</p>
              <a href="tel:+919845000000" className="text-sm font-medium hover:text-gold transition-colors mt-0.5 inline-block">
                +91 98450 00000
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/60">
            <Mail className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Official Email Support</p>
              <a href="mailto:otp@neelvyas.me" className="text-sm font-medium hover:text-gold transition-colors mt-0.5 inline-block">
                support@neelvyas.me
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/60">
            <Clock className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Operating Hours</p>
              <p className="text-xs text-muted-foreground mt-0.5">Monday – Saturday: 9:30 AM – 6:30 PM IST</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-gold" /> Encrypted & Verified Branch Portal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

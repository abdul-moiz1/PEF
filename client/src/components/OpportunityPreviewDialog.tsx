import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MapPin, Calendar, DollarSign, Briefcase, Mail } from "lucide-react";

interface Opportunity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  sector?: string | null;
  country?: string | null;
  city?: string | null;
  budgetOrSalary?: string | null;
  contactPreference?: string | null;
  status: string;
  approvalStatus: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface OpportunityPreviewDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpportunityPreviewDialog({
  opportunity,
  open,
  onOpenChange,
}: OpportunityPreviewDialogProps) {
  if (!opportunity) return null;

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "investment":
        return "default";
      case "partnership":
        return "secondary";
      case "collaboration":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "default";
      case "closed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getApprovalBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const location = [opportunity.city, opportunity.country].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <DialogTitle className="text-xl">{opportunity.title}</DialogTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getTypeBadgeVariant(opportunity.type)} data-testid="badge-type">
                {opportunity.type}
              </Badge>
              <Badge variant={getStatusBadgeVariant(opportunity.status)} data-testid="badge-status">
                {opportunity.status}
              </Badge>
              <Badge variant={getApprovalBadgeVariant(opportunity.approvalStatus)} data-testid="badge-approval">
                {opportunity.approvalStatus}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {opportunity.sector && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sector:</span>
                <span className="font-medium">{opportunity.sector}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{location}</span>
              </div>
            )}
            {opportunity.budgetOrSalary && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium">{opportunity.budgetOrSalary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Posted:</span>
              <span className="font-medium">
                {format(new Date(opportunity.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {opportunity.description}
            </p>
          </div>

          {opportunity.contactPreference && (
            <div className="flex items-start gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-muted-foreground">Contact Preference: </span>
                <span className="font-medium">{opportunity.contactPreference}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-preview">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

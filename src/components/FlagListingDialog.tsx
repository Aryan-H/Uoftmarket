
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";

interface FlagListingDialogProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const FlagListingDialog = ({ listingId, isOpen, onClose }: FlagListingDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Authentication required", {
        description: "You must be logged in to report listings."
      });
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Please provide a reason", {
        description: "You must explain why you're flagging this listing."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert directly into flagged_listings table
      const { data, error } = await supabase
        .from('flagged_listings')
        .insert({
          flagger_id: user.id,
          listing_id: listingId,
          reason: reason.trim()
        })
        .select();
      
      if (error) {
        console.error("Error flagging listing:", error);
        toast.error("Error flagging listing", {
          description: error.message || "There was a problem reporting this listing. Please try again."
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Listing flagged successfully:", data);
      toast.success("Listing flagged", {
        description: "Thank you for helping keep our marketplace safe. An admin will review this listing."
      });
      
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error flagging listing:", error);
      toast.error("Error flagging listing", {
        description: "There was an unexpected problem. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Listing</DialogTitle>
          <DialogDescription>
            Tell us why you're reporting this listing. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you're reporting this listing..."
              rows={4}
              required
            />
          </div>
          
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Report Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlagListingDialog;

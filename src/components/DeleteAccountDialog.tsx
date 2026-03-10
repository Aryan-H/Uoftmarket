
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteUserAccount } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { clearAppCache } from '@/utils/cacheUtils';
import { revokeTokensForAccountDeletion } from '@/utils/tokenManagement';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ isOpen, onClose }: DeleteAccountDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      // First revoke all tokens for this account
      await revokeTokensForAccountDeletion();
      
      const { success, error } = await deleteUserAccount();
      
      if (success) {
        toast.success("Account Deleted", {
          description: "Your account and all associated data have been permanently deleted."
        });
        
        // Close dialog
        onClose();
        
        // Clear app cache to remove any user data
        clearAppCache();
        
        // Navigate to home page and force a reload to clear any remaining state
        navigate('/', { replace: true });
        window.location.reload();
      } else {
        let message = "There was a problem deleting your account.";
        
        // Check for specific error types
        if (error?.message?.includes("not allowed")) {
          message = "You don't have permission to delete this account. This may be because you have related data (like listings) or because of your account type.";
        } else if (error?.message) {
          message = error.message;
        }
        
        setErrorMessage(message);
        
        toast.error("Deletion Failed", {
          description: message
        });
      }
    } catch (error) {
      console.error('Error during account deletion:', error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.";
      setErrorMessage(message);
      
      toast.error("Deletion Failed", {
        description: message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All your data, including listings, messages, and profile information will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 p-4 rounded-md border border-red-200 my-4">
          <p className="text-sm text-red-800 font-medium">
            Are you absolutely sure you want to delete your account?
          </p>
          
          {errorMessage && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
              <p className="font-medium">Error: {errorMessage}</p>
              <p className="mt-1">You may need to delete your listings first before deleting your account.</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount} 
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;

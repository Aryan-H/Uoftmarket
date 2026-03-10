
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SignInFormProps {
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  signInEmail: string;
  setSignInEmail: (email: string) => void;
  signInPassword: string;
  setSignInPassword: (password: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

const SignInForm = ({
  handleSignIn,
  signInEmail,
  setSignInEmail,
  signInPassword,
  setSignInPassword,
  isLoading,
  errorMessage
}: SignInFormProps) => {
  // Helper function to detect UofT email
  const isUofTEmail = (email: string) => {
    return email.endsWith('@mail.utoronto.ca');
  };

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const openForgot = () => {
    setForgotEmail(signInEmail);
    setIsForgotOpen(true);
  };

  const handleSendReset = async () => {
    if (!forgotEmail || !isUofTEmail(forgotEmail)) {
      toast.error('Enter your UofT email', { description: 'Use your @mail.utoronto.ca address.' });
      return;
    }
    try {
      setIsSendingReset(true);
      // Redirect back to /auth so the app can render the password reset form
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
      if (error) {
        console.error('resetPasswordForEmail error:', error);
        toast.error('Could not send reset link', { description: error.message });
        return;
      }
      toast.success('Reset email sent', { description: 'Check your inbox for the password reset link.' });
      setIsForgotOpen(false);
    } catch (e: any) {
      console.error('Reset email exception:', e);
      toast.error('Unexpected error', { description: e?.message || 'Please try again.' });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4 font-sans">
      <div className="space-y-2">
        <Label htmlFor="email" className="font-sans">UofT Email Address</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            id="email" 
            type="email" 
            placeholder="your.name@mail.utoronto.ca"
            className={`pl-10 font-sans ${!isUofTEmail(signInEmail) && signInEmail.length > 0 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
          />
          {!isUofTEmail(signInEmail) && signInEmail.length > 0 && (
            <p className="text-xs text-red-500 mt-1 font-sans">Please use your UofT email address (@mail.utoronto.ca)</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password" className="font-sans">Password</Label>
          <Button type="button" onClick={openForgot} variant="link" className="p-0 h-auto text-sm text-toronto-blue font-sans">
            Forgot password?
          </Button>
        </div>
        <Input 
          id="password" 
          type="password" 
          value={signInPassword}
          onChange={(e) => setSignInPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
          className="font-sans"
        />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2 font-sans">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-toronto-blue hover:bg-toronto-blue/90 font-sans" 
        disabled={isLoading || !isUofTEmail(signInEmail)}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>

      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your UofT email and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="forgotEmail">UofT Email</Label>
            <Input
              id="forgotEmail"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="your.name@mail.utoronto.ca"
              autoComplete="email"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsForgotOpen(false)} disabled={isSendingReset}>
              Cancel
            </Button>
            <Button onClick={handleSendReset} disabled={isSendingReset}>
              {isSendingReset ? (
                <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sending...</span>
              ) : (
                'Send reset link'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default SignInForm;

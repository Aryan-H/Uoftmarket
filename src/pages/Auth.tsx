import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { clearAllLocalStorage } from '@/utils/storageUtils';
import { resetAllSessions } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client'; // For calling verifyOtp directly
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import VerificationSuccess from '@/components/auth/VerificationSuccess';
import { Loader2, RefreshCw, ArrowRight, CheckCircle } from "lucide-react";
import { ensureSafariCompatibility } from '@/utils/cacheUtils';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // ----- Verification Code Flow -----
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifyErrorMessage, setVerifyErrorMessage] = useState('');
  const [verifySuccessMessage, setVerifySuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // ----- Resend Verification Flow -----
  const [isResending, setIsResending] = useState(false);

  // ----- Password Recovery Flow -----
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const type = params.get('type');
    if (type === 'recovery') {
      setActiveTab('signin');
      setShowResetPasswordForm(true);
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password too short', { description: 'Use at least 8 characters.' });
      return;
    }
    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('updateUser error:', error);
        toast.error('Could not update password', { description: error.message });
        return;
      }
      toast.success('Password updated');
      setShowResetPasswordForm(false);
      setNewPassword('');
    } catch (e: any) {
      console.error('Password update exception:', e);
      toast.error('Unexpected error', { description: e?.message || 'Please try again.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Used for verifying tokens
  const handleVerifyToken = async () => {
    setVerifyErrorMessage('');
    setVerifySuccessMessage('');
    setIsVerifying(true);

    try {
      console.log('handleVerifyToken: Attempting to verify code:', verificationToken);
      // Use the signUpEmail that was used during sign-up
      const { data, error } = await supabase.auth.verifyOtp({
        email: signUpEmail,
        token: verificationToken,
        type: 'signup'
      });

      if (error) {
        console.error('verifyOtp error:', error);
        setVerifyErrorMessage(error.message);
      } else {
        console.log('verifyOtp success:', data);
        setVerifySuccessMessage('Email verified! You can now log in.');
        toast.success("Email Verified", {
          description: "Your email is confirmed. You can now log in."
        });
      }
    } catch (err: any) {
      console.error('Exception in verifyOtp:', err);
      setVerifyErrorMessage(err.message || String(err));
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!signUpEmail.trim()) {
      toast.error("Email Required", {
        description: "Please enter your email address to resend the verification."
      });
      return;
    }
    setIsResending(true);
    try {
      // This function must be implemented in your Auth context:
      // e.g., async function resendVerificationEmail(email: string): Promise<boolean>
      const success = await resendVerificationEmail(signUpEmail);
      // if (success) {
      //   toast.success("Verification Email Sent", {
      //     description: "Check your inbox or spam folder for the new verification code."
      //   });
      // } else {
      //   toast.error("Resend Failed", {
      //     description: "There was an error resending your verification email. Please try again."
      //   });
      // }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error("Resend Failed", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsResending(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as any)?.from || '/';
  const [searchParams] = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const tabParam = searchParams.get('tab');
  const resendParam = searchParams.get('resend') === 'true';
  const [activeTab, setActiveTab] = useState(tabParam === "signup" ? "signup" : "signin");
  const [showResendOption, setShowResendOption] = useState(resendParam || false);
  const [isSafari, setIsSafari] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [loginStartTime, setLoginStartTime] = useState<number | null>(null);
  const [initializationTimeout, setInitializationTimeout] = useState(false);
  const [isResettingSession, setIsResettingSession] = useState(false);

  // ---- Sign-In State ----
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // ---- Sign-Up State ----
  const [signUpName, setSignUpName] = useState('');
  // Keep signUpEmail for verification
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();

  // On mount, set default year
  useEffect(() => {
    if (!year) {
      setYear(currentYear.toString());
    }
  }, [year, currentYear]);

  // Pull from Auth context
  const {
    login,
    signup,
    resendVerificationEmail,
    isResendingVerification,
    isAuthenticated,
    isLoading: authLoading
  } = useAuth();

  // Safari checks
  useEffect(() => {
    setIsSafari(window.isSafari || false);
    if (window.isSafari) {
      console.log('Auth component detected Safari browser');
      ensureSafariCompatibility();
    }
  }, []);

  useEffect(() => {
    console.log('Auth component mount/update - Auth state:', {
      isAuthenticated,
      authLoading,
      redirectAttempted,
      locationState: location.state,
      isRedirecting,
      browser: isSafari ? 'Safari' : 'Other'
    });
  }, [isAuthenticated, authLoading, redirectAttempted, location.state, isRedirecting, isSafari]);

  // Let UI render if auth is slow
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.log('Auth initialization taking too long, allowing UI rendering anyway');
        setInitializationTimeout(true);
      }
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  // If user is authenticated but not verified, redirect after 1s
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isVerified && !redirectAttempted) {
      console.log('User authenticated, preparing redirect', { to: fromPath });
      setRedirectAttempted(true);
      setIsRedirecting(true);
      setTimeout(() => {
        console.log('Executing redirect', { to: fromPath });
        window.location.href = fromPath;
      }, 1000);
    }
  }, [isAuthenticated, authLoading, isVerified, redirectAttempted, fromPath]);

  // Redirection countdown
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    if (isRedirecting && redirectCountdown > 0) {
      countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      if (redirectCountdown === 0) {
        window.location.href = '/';
      }
    }
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isRedirecting, redirectCountdown]);

  // Show "still working" if sign-in or sign-up is slow
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (isLoading && loginStartTime) {
      timerId = setTimeout(() => {
        if (isLoading) {
          toast.info("Still working...", {
            description: "Authentication is taking longer than usual. Please wait."
          });
        }
      }, 4000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isLoading, loginStartTime]);

  // Clear local storage if not auth
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllLocalStorage();
    }
  }, [isAuthenticated]);

  // ----- Sign In -----
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(undefined);
    setLoginStartTime(Date.now());
    setRedirectAttempted(false);

    if (isSafari) {
      console.log("Safari-specific login handling for:", signInEmail);
      try {
        localStorage.removeItem('supabase-auth');
        Object.keys(localStorage)
          .filter(key => key.startsWith('supabase.auth.'))
          .forEach(key => localStorage.removeItem(key));
        console.log("Safari: cleared potential conflicting auth data");
      } catch (err) {
        console.warn("Error clearing auth data in Safari:", err);
      }
    }

    try {
      console.log("Attempting login with:", signInEmail);
      const success = await login(signInEmail, signInPassword);
      if (!success) {
        setErrorMessage("Login failed. Please check your credentials and try again.");
        toast.error("Authentication Failed", {
          description: "Invalid email or password. Please try again."
        });
      } else {
        console.log("Login successful, redirecting", { to: fromPath });
        setIsRedirecting(true);
        setRedirectCountdown(3);

        // Force redirect after 3s
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            console.log('Forcing redirect after timeout', { to: fromPath });
            window.location.href = fromPath;
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("An error occurred during login. Please try again.");
      toast.error("Authentication Failed", {
        description: "An error occurred during login. Please try again."
      });
    } finally {
      setIsLoading(false);
      setLoginStartTime(null);
    }
  };

  // ----- Validation for Sign Up -----
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!signUpName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!program.trim()) {
      newErrors.program = "Program is required";
    }
    if (!year) {
      newErrors.year = "Graduation year is required";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!bio.trim()) {
      newErrors.bio = "Bio is required";
    }
    if (signUpPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----- Sign Up -----
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      toast.error("Required Fields Missing", {
        description: "Please fill out all required fields to continue."
      });
      setIsLoading(false);
      return;
    }

    // Define the regex to check for @mail.utoronto.ca
    const emailRegex = /^.*@mail\.utoronto\.ca$/i;
    if (!emailRegex.test(signUpEmail)) {
      toast.error("Invalid Email", {
        description: "You must use a valid UofT email address ending with @mail.utoronto.ca."
      });
      setIsLoading(false);
      return;
    }

    // Validate the year: must be an integer between 2025 and 2031 (inclusive).
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 2025 || parsedYear > 2031) {
      toast.error("Invalid Year", {
        description: "Year must be an integer between 2025 and 2031 (inclusive)."
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting signup with:", signUpEmail);
      const success = await signup(signUpName, signUpEmail, signUpPassword, {
        program,
        year,
        bio,
        phone,
        hasCompletedSetup: true
      });

      if (success) {
        // Clear fields except the email
        setSignUpName('');
        setSignUpPassword('');
        setConfirmPassword('');
        setProgram('');
        setYear('');
        setPhone('');
        setBio('');

        // Show the "Verify Token" form
        setShowVerificationForm(true);
        // toast.info("Check Your Email", {
        //   description: "We sent you a verification token. Please paste it below."
        // });
      } else {
        toast.error("Registration Failed", {
          description: "There was an error during registration. Please try again."
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Registration Failed", {
        description: "An error occurred during account creation. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----- Reset Sessions (Safari troubleshooting) -----
  const handleResetSession = async () => {
    setIsResettingSession(true);
    try {
      const success = await resetAllSessions();
      if (success) {
        clearAllLocalStorage();
        toast.success("Session Reset", {
          description: "Your session has been completely reset."
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to reset sessions");
      }
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error("Reset Error", {
        description: "There was a problem resetting your session."
      });
    } finally {
      setIsResettingSession(false);
    }
  };

  // Force redirect
  const handleForceRedirect = () => {
    console.log('User clicked force redirect button');
    window.location.href = '/';
  };

  // If email is verified, show success
  if (isVerified) {
    return <VerificationSuccess />;
  }

  // If auth is still loading
  if (authLoading && !initializationTimeout) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-toronto-blue" />
        <span className="ml-2 text-gray-600">Initializing authentication...</span>
      </div>
    );
  }

  // If user is logged in and not redirecting => "Already Logged In"
  if (isAuthenticated && !isRedirecting) {
    return (
      <AuthLayout showRequestedPage={true} requestPath="/">
        <div className="p-6 rounded-lg shadow-md bg-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Already Logged In</h2>
          <div className="text-center mb-6">
            <p className="mb-2">You already have an active session.</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setIsRedirecting(true);
                console.log('Manual navigation to home from Auth page');
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Home
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Show "redirecting" overlay if in progress
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center glass-card animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-12 w-12 rounded-full bg-blue-100/50"></span>
            </div>
            <Loader2 className="h-12 w-12 animate-spin text-toronto-blue mx-auto relative z-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-toronto-dark">
            <span className="text-gradient bg-gradient-to-r from-toronto-blue to-toronto-lightblue">
              Login Successful!
            </span>
          </h2>
          <p className="text-gray-600 mb-6">
            Redirecting you to the homepage in {redirectCountdown} seconds...
          </p>
          <Button
            onClick={handleForceRedirect}
            className="w-full mb-4 bg-toronto-blue hover:bg-toronto-lightblue flex items-center justify-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Continue Now</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <div className="w-full mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-toronto-blue h-full rounded-full"
              style={{
                width: `${((3 - redirectCountdown) / 3) * 100}%`,
                transition: 'width 1s linear'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setShowResendOption(false);
  };

  // Safari-specific troubleshooting
  const renderTroubleshootingSection = () => {
    return null;
    // if (!isSafari) return null;
    // return (
    //   <div className="mt-6 pt-6 border-t border-gray-200">
    //     <p className="text-sm text-gray-600 mb-2">
    //       Having trouble logging in? Try resetting your session:
    //     </p>
    //     <Button
    //       variant="outline"
    //       size="sm"
    //       onClick={handleResetSession}
    //       disabled={isResettingSession}
    //       className="w-full flex items-center justify-center"
    //     >
    //       {isResettingSession ? (
    //         <>
    //           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    //           Resetting...
    //         </>
    //       ) : (
    //         <>
    //           <RefreshCw className="h-4 w-4 mr-2" />
    //           Reset Session
    //         </>
    //       )}
    //     </Button>
    //   </div>
    // );
  };

  return (
    <AuthLayout showRequestedPage={true} requestPath="/">
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* ---------- SIGN IN TAB ---------- */}
          <TabsContent value="signin">
            <SignInForm
              handleSignIn={handleSignIn}
              signInEmail={signInEmail}
              setSignInEmail={setSignInEmail}
              signInPassword={signInPassword}
              setSignInPassword={setSignInPassword}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />

            {renderTroubleshootingSection()}

            {showResetPasswordForm && (
              <div className="border p-4 mt-4 rounded">
                <h3 className="text-xl font-semibold mb-2">Set a new password</h3>
                <p className="text-sm text-gray-600 mb-3">Enter a new password for your account.</p>
                <div className="grid gap-2">
                  <label htmlFor="newPassword" className="text-sm">New password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="border border-gray-300 p-2 rounded"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setShowResetPasswordForm(false)} className="px-3 py-2 border rounded" disabled={isUpdatingPassword}>Cancel</button>
                  <button onClick={handleUpdatePassword} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ---------- SIGN UP TAB ---------- */}
          <TabsContent value="signup">
            {/* If we're NOT verifying, show sign-up */}
            {!showVerificationForm && (
              <SignUpForm
                handleSignUp={handleSignUp}
                signUpName={signUpName}
                setSignUpName={setSignUpName}
                signUpEmail={signUpEmail}
                setSignUpEmail={setSignUpEmail}
                signUpPassword={signUpPassword}
                setSignUpPassword={setSignUpPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                program={program}
                setProgram={setProgram}
                year={year}
                setYear={setYear}
                phone={phone}
                setPhone={setPhone}
                bio={bio}
                setBio={setBio}
                errors={errors}
                isLoading={isLoading}
              />
            )}

            {showVerificationForm && (
              <div className="border p-4 mt-4 rounded">
                 <h3 className="text-xl font-semibold mb-4">Verify Your Email</h3>

                <p className="text-sm text-gray-700 mb-4">
                  Verification Email Sent (could take 1-2 minutes).
                  <br />
                  <strong>If you don’t see it, check your spam or junk folder.</strong>
                  <br />
                </p>

                {/* Error or Success Messages */}
                {verifyErrorMessage && (
                  <p className="text-red-500 mb-2">{verifyErrorMessage}</p>
                )}
                {verifySuccessMessage && (
                  <p className="text-green-500 mb-2">{verifySuccessMessage}</p>
                )}

                {/* Verification Code Input */}
                <label
                  htmlFor="verificationCode"
                  className="block mb-1 font-medium"
                >
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  className="border border-gray-300 p-2 w-full mb-4 rounded"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Paste the code from your email"
                />

                {/* Buttons: Verify & Resend */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    onClick={handleVerifyToken}
                    disabled={isVerifying || !verificationToken}
                    className="w-full sm:w-auto"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Email'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full sm:w-auto"
                  >
                    {isResending ? 'Resending...' : 'Resend Verification Email'}
                  </Button>
                </div>
              </div>
            )}

          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
};

export default Auth;

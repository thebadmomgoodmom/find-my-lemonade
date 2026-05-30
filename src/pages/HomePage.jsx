import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("register");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode });
      base44.auth.setToken(res.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="font-nunito min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-5xl">🍋</span>
          <h1 className="text-2xl font-extrabold mt-3">
            {step === "register" ? "Join the Fun" : "Verify Email"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "register"
              ? "Create your Find My Lemonade account"
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === "register" ? (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full rounded-full h-11 font-bold">
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogle}
              className="w-full rounded-full h-11 font-semibold"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/sign-in" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Verification Code</Label>
              <Input
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="rounded-xl h-11 text-center text-lg tracking-widest"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full rounded-full h-11 font-bold">
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={() => base44.auth.resendOtp(email)}
              className="w-full text-sm text-primary font-semibold hover:underline"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
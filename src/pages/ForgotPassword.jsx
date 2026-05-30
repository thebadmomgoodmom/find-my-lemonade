import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success message
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="font-nunito min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-5xl">🔑</span>
          <h1 className="text-2xl font-extrabold mt-3">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent
              ? "Check your email for a reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" disabled={loading} className="w-full rounded-full h-11 font-bold">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="text-center bg-secondary/10 rounded-2xl p-6">
            <span className="text-3xl">✉️</span>
            <p className="text-sm font-semibold mt-2">
              If an account exists with that email, you'll receive a reset link shortly.
            </p>
          </div>
        )}

        <Link
          to="/sign-in"
          className="flex items-center justify-center gap-1.5 text-sm text-primary font-semibold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
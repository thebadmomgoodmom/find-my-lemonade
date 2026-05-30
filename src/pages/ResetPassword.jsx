import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      window.location.href = "/sign-in";
    } catch (err) {
      setError(err.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-nunito min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-5xl">🔐</span>
          <h1 className="text-2xl font-extrabold mt-3">New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">New Password</Label>
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
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
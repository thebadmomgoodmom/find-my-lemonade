import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
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
          <h1 className="text-2xl font-extrabold mt-3">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Find My Lemonade</p>
        </div>

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

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full rounded-full h-11 font-bold">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
            Forgot password?
          </Link>
        </div>

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
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
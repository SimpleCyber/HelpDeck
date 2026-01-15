"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AdminPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/admin/dashboard");
  }, [user, loading, router]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={isLogin ? "Welcome back" : "Create an account"} 
      subtitle={isLogin ? "Enter your details to access your workspace" : "Get started with your 14-day free trial"}
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 text-lg"
          disabled={authLoading}
        >
          {authLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            isLogin ? "Sign in" : "Create account"
          )}
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[var(--bg-card)] text-[var(--text-muted)]">Or continue with</span>
          </div>
        </div>

        <Button 
          type="button"
          variant="secondary" 
          onClick={signInWithGoogle} 
          className="w-full h-14 border border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--bg-main)] bg-[var(--bg-card)] text-[var(--text-main)]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
          Google
        </Button>

        <p className="text-center text-sm text-[var(--text-muted)]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

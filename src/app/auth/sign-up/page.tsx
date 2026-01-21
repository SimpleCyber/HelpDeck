"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HelpDeckLogo } from "@/components/common/HelpDeckLogo";
import Link from "next/link";

export default function SignUpPage() {
  const { user, loading, signInWithGoogle, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/admin/dashboard");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setAuthLoading(true);
    try {
      await signUpWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent" />
        
        <div className="relative z-10">
          <HelpDeckLogo className="w-10 h-10" textClassName="text-2xl text-white" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-5xl font-black tracking-tight leading-tight">
            Start Your Free Trial Today.
          </h1>
          <p className="text-lg text-gray-300 font-medium leading-relaxed">
            Create an account and get 14 days of unlimited access to all HelpDeck features. No credit card required.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-gray-400">
           <span>©  2026 HelpDeck Inc.</span>
           <div className="w-1 h-1 rounded-full bg-gray-600" />
           <span>Privacy Policy</span>
           <div className="w-1 h-1 rounded-full bg-gray-600" />
           <span>Terms</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-[420px] space-y-8">
           <div className="text-center lg:text-left space-y-2">
             <div className="lg:hidden flex justify-center mb-6">
               <HelpDeckLogo className="w-12 h-12" textClassName="text-2xl" />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">
               Create an account
             </h2>
             <p className="text-slate-500 font-medium">
               Start your 14-day free trial today.
             </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
             <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 ml-1">Email</label>
                  <Input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="h-12 bg-white border-slate-200 focus:border-black transition-all rounded-xl placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 ml-1">Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="h-12 bg-white border-slate-200 focus:border-black transition-all rounded-xl placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 ml-1">Confirm Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    className="h-12 bg-white border-slate-200 focus:border-black transition-all rounded-xl placeholder:text-gray-400"
                  />
                </div>
             </div>

             {error && (
               <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  {error}
               </div>
             )}

             <Button 
               type="submit" 
               className="w-full h-12 text-base font-bold bg-black text-white hover:bg-gray-900 rounded-xl shadow-lg shadow-black/5 active:scale-[0.98] transition-all"
               disabled={authLoading}
             >
               {authLoading ? "Processing..." : "Create Account"}
             </Button>
           </form>

           <div className="relative">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
             <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-slate-500">
               <span className="px-4 bg-slate-50">Or continue with</span>
             </div>
           </div>

           <Button 
             type="button"
             variant="outline" 
             onClick={signInWithGoogle} 
             className="w-full h-12 text-base font-bold bg-white border border-slate-200 hover:bg-gray-50 flex items-center justify-center gap-3 rounded-xl transition-all text-slate-900"
           >
             <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
             Sign up with Google
           </Button>

           <p className="text-center text-sm font-medium text-slate-500">
             Already have an account?{" "}
             <Link
               href="/auth/sign-in"
               className="font-bold text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
             >
               Log in
             </Link>
           </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginUser, loginWithGoogle, getUserProfile, getRoleRedirect, resetPassword } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const firebaseUser = await loginUser(data.email, data.password);
      const profile = await getUserProfile(firebaseUser.uid);
      if (!profile) throw new Error("Profile not found");
      setUser(profile);
      toast.success(`Welcome back, ${profile.name}!`);
      router.push(getRoleRedirect(profile.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg.includes("invalid-credential") ? "Invalid email or password" : msg);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const firebaseUser = await loginWithGoogle();
      const profile = await getUserProfile(firebaseUser.uid);
      if (!profile) throw new Error("Profile not found");
      setUser(profile);
      toast.success(`Welcome, ${profile.name}!`);
      router.push(getRoleRedirect(profile.role));
    } catch {
      toast.error("Google sign-in failed. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) return toast.error("Enter your email address");
    try {
      await resetPassword(forgotEmail);
      toast.success("Password reset email sent!");
      setForgotOpen(false);
    } catch {
      toast.error("Could not send reset email");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center">
            <span className="text-white font-outfit font-black text-xl">O</span>
          </div>
          <span className="font-outfit font-bold text-2xl text-white">
            Okoa<span className="text-orange-300">Time</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-outfit font-black text-4xl text-white mb-4 leading-tight">
            Welcome back to<br />
            <span className="text-orange-300">OkoaTime</span>
          </h2>
          <p className="font-josefin text-white/70 text-lg mb-8">
            Saving Time, Delivering Convenience.
          </p>

          <div className="space-y-4">
            {[
              { icon: "⚡", text: "30-60 minute delivery to Lamu, Shela & Manda" },
              { icon: "📱", text: "Pay with M-Pesa — fast and secure" },
              { icon: "🗺️", text: "Track your order live on Google Maps" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-josefin text-white/80 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="font-josefin text-white/40 text-sm relative z-10">
          © {new Date().getFullYear()} OkoaTime
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center">
              <span className="text-white font-outfit font-black text-lg">O</span>
            </div>
            <span className="font-outfit font-bold text-xl text-navy">
              Okoa<span className="text-orange">Time</span>
            </span>
          </Link>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <h1 className="font-outfit font-black text-2xl text-navy mb-1">Sign In</h1>
            <p className="font-josefin text-gray-500 text-sm mb-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-teal font-semibold hover:text-navy transition-colors">
                Register here
              </Link>
            </p>

            {/* Google Button */}
            <Button
              variant="outline"
              size="md"
              className="w-full mb-4"
              onClick={handleGoogle}
              loading={googleLoading}
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="font-josefin text-gray-400 text-xs">or sign in with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="label">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-teal font-josefin hover:text-navy transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPass ? "text" : "password"}
                    className={`input-field pl-10 pr-10 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 font-josefin">{errors.password.message}</p>}
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={isSubmitting}>
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setForgotOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-outfit font-bold text-xl text-navy mb-2">Reset Password</h3>
            <p className="font-josefin text-gray-500 text-sm mb-4">
              Enter your email and we&apos;ll send a reset link.
            </p>
            <input
              className="input-field mb-4"
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleForgotPassword}>
                Send Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

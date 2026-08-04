"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useLockStore } from "@/lib/store/useLockStore";
import {
  hasPasswordProvider,
  unlockWithPassword,
  unlockWithGoogleRedirect,
  logoutUser,
} from "@/lib/firebase/auth";
import Button from "@/components/ui/Button";

export default function LockScreen() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const { unlock } = useLockStore();
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const usesPassword = hasPasswordProvider();

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    try {
      await unlockWithPassword(password);
      setPassword("");
      unlock();
    } catch {
      toast.error("Incorrect password");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleUnlock() {
    setGoogleLoading(true);
    try {
      // Navigates away and back — resolved by IdleLockProvider on return.
      await unlockWithGoogleRedirect();
    } catch {
      toast.error("Could not start Google sign-in");
      setGoogleLoading(false);
    }
  }

  async function handleSignOut() {
    await logoutUser();
    clearUser();
    unlock();
    router.push("/login");
  }

  return (
    <div className="fixed inset-0 z-[999] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-orange" />
        </div>
        <h2 className="font-outfit font-black text-xl text-navy mb-1">Session Locked</h2>
        <p className="font-josefin text-gray-500 text-sm mb-6">
          You&apos;ve been inactive for a while.
          {user?.email && <> Signed in as <strong className="text-navy">{user.email}</strong>.</>}
        </p>

        {usesPassword ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="input-field pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full" loading={submitting}>
              Unlock
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="md" className="w-full" onClick={handleGoogleUnlock} loading={googleLoading}>
            Continue with Google to unlock
          </Button>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full mt-4 text-gray-400 hover:text-red-500 text-sm font-josefin transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Not you? Sign out
        </button>
      </div>
    </div>
  );
}

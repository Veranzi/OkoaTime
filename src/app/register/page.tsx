"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { registerUser, getUserProfile, getRoleRedirect } from "@/lib/firebase/auth";
import type { UserRole } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["customer", "supplier", "rider", "boat"]),
  businessName: z.string().optional(),
  serviceCategory: z.string().optional(),
  location: z.string().optional(),
  idNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  boatName: z.string().optional(),
  capacity: z.coerce.number().optional(),
  serviceArea: z.string().optional(),
  terms: z.boolean().refine((v) => v === true, { message: "You must accept the terms" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: "customer", label: "Customer", icon: "🛒", desc: "Order deliveries" },
  { value: "supplier", label: "Supplier", icon: "🏪", desc: "Sell your products" },
  { value: "rider", label: "Rider", icon: "🛵", desc: "Deliver orders" },
  { value: "boat", label: "Boat Operator", icon: "⛵", desc: "Offer boat transport" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { role: "customer" },
  });

  const role = watch("role");

  async function onSubmit(data: FormData) {
    try {
      const { terms, confirmPassword, ...rest } = data;
      void terms; void confirmPassword;
      const firebaseUser = await registerUser(rest as Parameters<typeof registerUser>[0]);
      const profile = await getUserProfile(firebaseUser.uid);
      if (!profile) throw new Error("Profile not found");
      setUser(profile);
      toast.success("Account created successfully!");
      router.push(getRoleRedirect(profile.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg.includes("email-already-in-use") ? "Email already registered" : msg);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center">
              <span className="text-white font-outfit font-black text-lg">O</span>
            </div>
            <span className="font-outfit font-bold text-xl text-navy">
              Okoa<span className="text-orange">Time</span>
            </span>
          </Link>
          <h1 className="font-outfit font-black text-3xl text-navy mb-2">Create Your Account</h1>
          <p className="font-josefin text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-teal font-semibold hover:text-navy transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="bg-white rounded-3xl shadow-card p-8 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="label mb-3 block">I want to join as a...</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setValue("role", r.value as "customer" | "supplier" | "rider" | "boat")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === r.value
                      ? "border-orange bg-orange-50 text-orange"
                      : "border-gray-200 hover:border-gray-300 text-gray-500"
                  }`}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <span className="font-outfit font-semibold text-xs text-navy">{r.label}</span>
                  <span className="font-josefin text-xs text-gray-400">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="Fatuma Hassan" error={errors.name?.message} {...register("name")} />
            <Input label="Email Address" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
            <Input label="Phone Number (M-Pesa)" type="tel" placeholder="0712 345 678" error={errors.phone?.message} {...register("phone")} />

            <div className="flex flex-col gap-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={`input-field pr-10 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                  placeholder="At least 6 characters"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {/* Supplier Fields */}
          {role === "supplier" && (
            <div className="bg-orange-50 rounded-2xl p-4 space-y-4">
              <p className="font-outfit font-semibold text-orange text-sm">🏪 Supplier Information</p>
              <Input label="Business Name" placeholder="Fatuma Fresh Fish" error={errors.businessName?.message} {...register("businessName")} />
              <div>
                <label className="label">Service Category</label>
                <select className="input-field" {...register("serviceCategory")}>
                  <option value="">Select category...</option>
                  <option value="seafood">Seafood</option>
                  <option value="groceries">Groceries</option>
                  <option value="fruits_veg">Fruits & Vegetables</option>
                  <option value="household">Household Items</option>
                </select>
              </div>
              <Input label="Location / Area" placeholder="Lamu Town, near the market" {...register("location")} />
            </div>
          )}

          {/* Rider Fields */}
          {role === "rider" && (
            <div className="bg-teal-50 rounded-2xl p-4 space-y-4">
              <p className="font-outfit font-semibold text-teal text-sm">🛵 Rider Information</p>
              <Input label="ID Number" placeholder="12345678" error={errors.idNumber?.message} {...register("idNumber")} />
              <div>
                <label className="label">Vehicle Type</label>
                <select className="input-field" {...register("vehicleType")}>
                  <option value="">Select vehicle...</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorbike">Motorbike</option>
                  <option value="on-foot">On Foot</option>
                </select>
              </div>
            </div>
          )}

          {/* Boat Fields */}
          {role === "boat" && (
            <div className="bg-blue-50 rounded-2xl p-4 space-y-4">
              <p className="font-outfit font-semibold text-navy text-sm">⛵ Boat Information</p>
              <Input label="Boat Name" placeholder="Al-Noor" {...register("boatName")} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Capacity (passengers)" type="number" placeholder="8" {...register("capacity")} />
                <Input label="Service Area" placeholder="Lamu, Shela, Manda" {...register("serviceArea")} />
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 w-4 h-4 rounded border-gray-300 text-orange focus:ring-orange"
              {...register("terms")}
            />
            <label htmlFor="terms" className="font-josefin text-sm text-gray-600">
              I agree to the{" "}
              <Link href="/terms" className="text-teal hover:text-navy transition-colors font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-teal hover:text-navy transition-colors font-semibold">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && <p className="text-xs text-red-500 -mt-4">{errors.terms.message}</p>}

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}

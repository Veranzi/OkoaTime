"use client";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Star, Camera } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RiderProfilePage() {
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      vehicleType: user?.vehicleType ?? "bicycle",
    },
  });

  async function onSubmit(data: Record<string, string>) {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Profile updated!");
    void data;
  }

  return (
    <div className="max-w-xl">
      <h1 className="page-header mb-6">My Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="card text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <div className="w-24 h-24 bg-teal rounded-3xl flex items-center justify-center">
              <span className="font-outfit font-black text-white text-4xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
          <p className="font-outfit font-bold text-navy text-lg">{user?.name}</p>
          <p className="font-josefin text-gray-400 text-sm">{user?.vehicleType ?? "Bicycle"} Rider</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
            ))}
            <span className="font-josefin text-gray-500 text-sm ml-1">4.8 (47 reviews)</span>
          </div>
        </div>

        {/* Info */}
        <div className="card space-y-4">
          <h3 className="font-outfit font-bold text-navy">Personal Information</h3>
          <Input label="Full Name" {...register("name")} />
          <Input label="Phone Number" type="tel" {...register("phone")} />
          <Input label="Email" type="email" {...register("email")} />
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input-field" {...register("vehicleType")}>
              <option value="bicycle">Bicycle</option>
              <option value="motorbike">Motorbike</option>
              <option value="on-foot">On Foot</option>
            </select>
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
          Save Profile
        </Button>
      </form>
    </div>
  );
}

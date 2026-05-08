"use client";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SupplierProfilePage() {
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      businessName: user?.businessName ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      description: "",
      location: user?.location ?? "",
      openTime: "06:00",
      closeTime: "20:00",
    },
  });

  async function onSubmit(data: Record<string, string>) {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Profile updated successfully!");
    void data;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="page-header mb-6">Supplier Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Info */}
        <div className="card space-y-4">
          <h3 className="font-outfit font-bold text-navy mb-2">Business Information</h3>

          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 bg-orange rounded-2xl flex items-center justify-center text-3xl">
              🏪
            </div>
            <div>
              <Button variant="outline" size="sm" type="button">Upload Shop Photo</Button>
              <p className="font-josefin text-gray-400 text-xs mt-1">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <Input label="Business Name" placeholder="Fatuma Fresh Fish" {...register("businessName")} />
          <div>
            <label className="label">Service Category</label>
            <select className="input-field" {...register("serviceCategory" as never)}>
              <option value="seafood">Seafood</option>
              <option value="groceries">Groceries</option>
              <option value="fruits_veg">Fruits & Vegetables</option>
              <option value="household">Household Items</option>
            </select>
          </div>
          <Input label="Location / Area" placeholder="Near Lamu market, Lamu Town" {...register("location")} />
          <div>
            <label className="label">Business Description</label>
            <textarea
              className="input-field resize-none h-24"
              placeholder="Tell customers about your business..."
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening Time" type="time" {...register("openTime")} />
            <Input label="Closing Time" type="time" {...register("closeTime")} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="card space-y-4">
          <h3 className="font-outfit font-bold text-navy mb-2">Contact Information</h3>
          <Input label="Contact Name" {...register("name")} />
          <Input label="Email" type="email" {...register("email")} />
          <Input label="Phone Number (M-Pesa)" type="tel" {...register("phone")} />
        </div>

        <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
          Save Profile
        </Button>
      </form>
    </div>
  );
}

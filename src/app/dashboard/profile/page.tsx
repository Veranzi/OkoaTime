"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { User, MapPin, Bell, Lock, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CustomerProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "notifications" | "password">("profile");
  const [addresses, setAddresses] = useState([
    "Near the old fort, Lamu Town",
    "Shela village, seafront house",
  ]);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  async function onSubmit(data: Record<string, string>) {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Profile updated!");
    void data;
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="max-w-2xl">
      <h1 className="page-header mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-josefin font-semibold transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? "bg-white text-navy shadow-sm"
                : "text-gray-500 hover:text-navy"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center">
              <span className="font-outfit font-black text-white text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-outfit font-bold text-navy text-lg">{user?.name}</p>
              <p className="font-josefin text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block bg-teal-100 text-teal-700 text-xs font-outfit font-semibold px-2 py-0.5 rounded-full mt-1 capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register("name")} />
            <Input label="Email Address" type="email" {...register("email")} />
            <Input label="Phone Number (M-Pesa)" type="tel" {...register("phone")} />
            <Button type="submit" variant="primary" size="md" loading={isSubmitting}>
              Save Changes
            </Button>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="card space-y-4">
          <h3 className="font-outfit font-bold text-navy">Saved Addresses</h3>
          {addresses.map((addr, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-teal flex-shrink-0" />
              <p className="font-josefin text-navy text-sm flex-1">{addr}</p>
              <button
                onClick={() => setAddresses(addresses.filter((_, j) => j !== i))}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setAddresses([...addresses, ""])}
            className="flex items-center gap-2 text-teal font-josefin text-sm font-semibold hover:text-navy transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="card space-y-4">
          <h3 className="font-outfit font-bold text-navy">Notification Preferences</h3>
          {[
            { label: "Order status updates", desc: "Get notified when your order status changes", enabled: true },
            { label: "Rider assigned", desc: "Know when a rider picks up your order", enabled: true },
            { label: "Delivery confirmation", desc: "Confirmation when your order is delivered", enabled: true },
            { label: "Promotions & offers", desc: "Special deals and discount codes", enabled: false },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-josefin font-semibold text-navy text-sm">{pref.label}</p>
                <p className="font-josefin text-gray-400 text-xs">{pref.desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${pref.enabled ? "bg-teal" : "bg-gray-200"} relative`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${pref.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="card">
          <h3 className="font-outfit font-bold text-navy mb-4">Change Password</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Password updated!"); }}>
            <Input label="Current Password" type="password" placeholder="••••••••" />
            <Input label="New Password" type="password" placeholder="At least 6 characters" />
            <Input label="Confirm New Password" type="password" placeholder="Repeat new password" />
            <Button type="submit" variant="primary" size="md">Update Password</Button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, MapPin, User, LogOut, Menu, X,
  Package, DollarSign, Settings, Users, TrendingUp, Ship, Truck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import toast from "react-hot-toast";

type PortalType = "customer" | "supplier" | "rider" | "boat" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const portalNavs: Record<PortalType, NavItem[]> = {
  customer: [
    { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "New Order", href: "/dashboard/order/new", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Track Order", href: "/dashboard/orders", icon: <MapPin className="w-5 h-5" /> },
    { label: "Order History", href: "/dashboard/orders", icon: <Package className="w-5 h-5" /> },
    { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  ],
  supplier: [
    { label: "Dashboard", href: "/supplier", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Products", href: "/supplier/products", icon: <Package className="w-5 h-5" /> },
    { label: "Orders", href: "/supplier/orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Earnings", href: "/supplier/earnings", icon: <DollarSign className="w-5 h-5" /> },
    { label: "Profile", href: "/supplier/profile", icon: <User className="w-5 h-5" /> },
  ],
  rider: [
    { label: "Home", href: "/rider", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Available Orders", href: "/rider/orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Active Delivery", href: "/rider/active", icon: <Truck className="w-5 h-5" /> },
    { label: "Earnings", href: "/rider/earnings", icon: <DollarSign className="w-5 h-5" /> },
    { label: "Profile", href: "/rider/profile", icon: <User className="w-5 h-5" /> },
  ],
  boat: [
    { label: "Dashboard", href: "/boat", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Boats", href: "/boat/listings", icon: <Ship className="w-5 h-5" /> },
    { label: "Bookings", href: "/boat/bookings", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Earnings", href: "/boat/earnings", icon: <DollarSign className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
    { label: "Orders", href: "/admin/orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Suppliers", href: "/admin/suppliers", icon: <Package className="w-5 h-5" /> },
    { label: "Riders", href: "/admin/riders", icon: <Truck className="w-5 h-5" /> },
    { label: "Payments", href: "/admin/payments", icon: <DollarSign className="w-5 h-5" /> },
    { label: "Analytics", href: "/admin", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ],
};

const portalTitles: Record<PortalType, string> = {
  customer: "My Account",
  supplier: "Supplier Portal",
  rider: "Rider Portal",
  boat: "Boat Operator",
  admin: "Admin Panel",
};

interface PortalLayoutProps {
  children: React.ReactNode;
  portal: PortalType;
}

export default function PortalLayout({ children, portal }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const navItems = portalNavs[portal];

  async function handleLogout() {
    await logoutUser();
    clearUser();
    toast.success("Logged out successfully");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-navy text-white flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-navy-600">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/okoatiimelogoo.png" alt="OkoaTime" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div>
              <div className="font-outfit font-bold text-base text-white leading-tight">
                Okoa<span className="text-orange">Time</span>
              </div>
              <div className="text-navy-300 text-xs font-josefin">{portalTitles[portal]}</div>
            </div>
          </Link>
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-navy-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 mb-1 rounded-xl text-sm font-josefin font-semibold transition-all",
                  isActive
                    ? "bg-orange text-white shadow-orange/30 shadow-md"
                    : "text-navy-200 hover:bg-navy-700 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-navy-600">
          {user && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 bg-teal rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="font-outfit font-bold text-white text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-josefin font-semibold text-white text-sm truncate">{user.name}</p>
                <p className="text-navy-300 text-xs truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-navy-300 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-josefin"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-navy" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-navy" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

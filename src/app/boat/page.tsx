"use client";
import Link from "next/link";
import { ChevronRight, Ship, Calendar, DollarSign, Users } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { formatKES, formatRelative } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const upcomingBookings = [
  { id: "BK-001", customer: "Fatuma Hassan", route: "Lamu → Shela", datetime: new Date(Date.now() + 3 * 3600000), passengers: 3, amount: 1500, status: "confirmed" },
  { id: "BK-002", customer: "Ahmed Bakari", route: "Shela → Manda", datetime: new Date(Date.now() + 26 * 3600000), passengers: 5, amount: 2500, status: "pending" },
  { id: "BK-003", customer: "Mama Rehema", route: "Lamu → Manda", datetime: new Date(Date.now() + 2 * 86400000), passengers: 2, amount: 2000, status: "confirmed" },
];

export default function BoatDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="page-header">Welcome, {user?.name?.split(" ")[0] ?? "Captain"} ⛵</h1>
        <p className="font-josefin text-gray-500 text-sm mt-1">
          {user?.boatName ?? "Your Boat"} · {new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings" value="2" icon={<Calendar className="w-4 h-4" />} color="teal" />
        <StatCard label="Today's Revenue" value={formatKES(4000)} icon={<DollarSign className="w-4 h-4" />} color="orange" />
        <StatCard label="Passengers Today" value="8" icon={<Users className="w-4 h-4" />} color="navy" />
        <StatCard label="Pending Requests" value="1" icon={<Ship className="w-4 h-4" />} color="green" />
      </div>

      {/* Upcoming Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-outfit font-bold text-lg text-navy">Upcoming Trips</h2>
          <Link href="/boat/bookings" className="text-teal font-josefin text-sm font-semibold flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className={`card ${booking.status === "pending" ? "border-l-4 border-l-orange" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">{formatRelative(booking.datetime)}</p>
                  <p className="font-outfit font-bold text-navy">{booking.route}</p>
                  <p className="font-josefin text-gray-500 text-sm">{booking.customer} · {booking.passengers} passengers</p>
                </div>
                <div className="text-right">
                  <Badge variant={booking.status === "confirmed" ? "green" : "yellow"}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  <p className="font-outfit font-bold text-navy mt-1">{formatKES(booking.amount)}</p>
                </div>
              </div>
              {booking.status === "pending" && (
                <Link href="/boat/bookings">
                  <button className="text-orange font-josefin text-xs font-semibold hover:text-navy transition-colors">
                    Action required → View Booking
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

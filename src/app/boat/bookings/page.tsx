"use client";
import { useEffect, useState } from "react";
import { Check, X, Users, MapPin, Calendar, RefreshCw } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getBookingsByBoatOperator, updateBookingStatus, tsToDate } from "@/lib/firebase/db";
import type { Booking, BookingStatus } from "@/lib/firebase/db";

const statusVariant: Record<BookingStatus, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  confirmed: "blue",
  pending: "yellow",
  rejected: "red",
  completed: "green",
};

export default function BoatBookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try { setBookings(await getBookingsByBoatOperator(user.uid)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.uid]);

  async function changeStatus(id: string, status: BookingStatus) {
    try {
      await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      toast.success(status === "confirmed" ? "Booking confirmed!" : "Booking rejected");
    } catch { toast.error("Failed to update booking"); }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Bookings</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">
            {bookings.filter((b) => b.status === "pending").length} pending · {bookings.length} total
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="card animate-pulse h-36 bg-gray-50" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⛵</p>
          <p className="font-outfit font-bold text-navy mb-1">No bookings yet</p>
          <p className="font-josefin text-gray-400 text-sm">Bookings from customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className={`card ${booking.status === "pending" ? "border-l-4 border-l-orange" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-josefin text-gray-400 text-xs">#{booking.id.slice(0, 10)}</p>
                  <p className="font-outfit font-bold text-navy text-lg mt-0.5">{booking.route}</p>
                  <p className="font-josefin text-gray-500 text-sm">{booking.customerName}</p>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariant[booking.status]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  <p className="font-outfit font-bold text-navy mt-1">{formatKES(booking.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">{formatDate(tsToDate(booking.datetime))}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs">{booking.passengers} passengers</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                  <MapPin className="w-3.5 h-3.5" />
                  <a href={`tel:${booking.customerPhone}`} className="text-xs hover:text-navy transition-colors">{booking.customerPhone}</a>
                </div>
              </div>

              {booking.notes && <p className="font-josefin text-gray-400 text-xs italic mb-3">Note: {booking.notes}</p>}

              {booking.status === "pending" && (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => changeStatus(booking.id, "confirmed")}>
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => changeStatus(booking.id, "rejected")}>
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

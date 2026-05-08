"use client";
import { useState } from "react";
import { Check, X, Users, MapPin, Calendar } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

type BookingStatus = "pending" | "confirmed" | "rejected" | "completed";

interface Booking {
  id: string;
  customer: string;
  phone: string;
  route: string;
  datetime: Date;
  passengers: number;
  amount: number;
  status: BookingStatus;
  notes?: string;
}

const INITIAL_BOOKINGS: Booking[] = [
  { id: "BK-001", customer: "Fatuma Hassan", phone: "+254712345678", route: "Lamu → Shela", datetime: new Date(Date.now() + 3 * 3600000), passengers: 3, amount: 1500, status: "confirmed" },
  { id: "BK-002", customer: "Ahmed Bakari", phone: "+254723456789", route: "Shela → Manda", datetime: new Date(Date.now() + 26 * 3600000), passengers: 5, amount: 2500, status: "pending", notes: "Will have luggage" },
  { id: "BK-003", customer: "Hotel La Verandah", phone: "+254734567890", route: "Lamu → Manda", datetime: new Date(Date.now() - 3 * 3600000), passengers: 8, amount: 4000, status: "completed" },
];

const statusVariant: Record<BookingStatus, "green" | "red" | "yellow" | "blue" | "teal" | "orange" | "gray"> = {
  confirmed: "blue",
  pending: "yellow",
  rejected: "red",
  completed: "green",
};

export default function BoatBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  function updateStatus(id: string, status: BookingStatus) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.success(status === "confirmed" ? "Booking confirmed!" : "Booking rejected");
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
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className={`card ${booking.status === "pending" ? "border-l-4 border-l-orange" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-josefin text-gray-400 text-xs">#{booking.id}</p>
                <p className="font-outfit font-bold text-navy text-lg mt-0.5">{booking.route}</p>
                <p className="font-josefin text-gray-500 text-sm">{booking.customer}</p>
              </div>
              <div className="text-right">
                <Badge variant={statusVariant[booking.status]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
                <p className="font-outfit font-bold text-navy mt-1">{formatKES(booking.amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{formatDate(booking.datetime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs">{booking.passengers} passengers</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 font-josefin">
                <MapPin className="w-3.5 h-3.5" />
                <a href={`tel:${booking.phone}`} className="text-xs hover:text-navy transition-colors">{booking.phone}</a>
              </div>
            </div>

            {booking.notes && (
              <p className="font-josefin text-gray-400 text-xs italic mb-3">Note: {booking.notes}</p>
            )}

            {booking.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => updateStatus(booking.id, "confirmed")}>
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => updateStatus(booking.id, "rejected")}>
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Search, Filter, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { UserRole } from "@/lib/firebase/auth";

interface AdminUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
  totalOrders: number;
}

const USERS: AdminUser[] = [
  { uid: "1", name: "Fatuma Hassan", email: "fatuma@example.com", phone: "+254712345678", role: "customer", status: "active", createdAt: new Date(Date.now() - 30 * 86400000), totalOrders: 12 },
  { uid: "2", name: "Ahmed Bakari", email: "ahmed@example.com", phone: "+254723456789", role: "supplier", status: "active", createdAt: new Date(Date.now() - 60 * 86400000), totalOrders: 0 },
  { uid: "3", name: "Hassan Mwangi", email: "hassan@example.com", phone: "+254734567890", role: "rider", status: "active", createdAt: new Date(Date.now() - 45 * 86400000), totalOrders: 0 },
  { uid: "4", name: "Mama Rehema", email: "rehema@example.com", phone: "+254745678901", role: "supplier", status: "pending", createdAt: new Date(Date.now() - 2 * 86400000), totalOrders: 0 },
  { uid: "5", name: "Ali Captain", email: "ali@example.com", phone: "+254756789012", role: "boat", status: "active", createdAt: new Date(Date.now() - 15 * 86400000), totalOrders: 0 },
  { uid: "6", name: "David Omondi", email: "david@example.com", phone: "+254767890123", role: "customer", status: "suspended", createdAt: new Date(Date.now() - 90 * 86400000), totalOrders: 3 },
];

const roleColors: Record<UserRole, string> = {
  customer: "bg-blue-100 text-blue-700",
  supplier: "bg-orange-100 text-orange-700",
  rider: "bg-teal-100 text-teal-700",
  boat: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function toggleStatus(uid: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">User Management</h1>
          <p className="font-josefin text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input-field pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input-field w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
            <option value="rider">Riders</option>
            <option value="boat">Boat Operators</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-4">User</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-4">Role</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-4">Status</th>
                <th className="text-left font-outfit font-semibold text-gray-400 text-xs p-4">Joined</th>
                <th className="text-right font-outfit font-semibold text-gray-400 text-xs p-4">Orders</th>
                <th className="text-right font-outfit font-semibold text-gray-400 text-xs p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="font-outfit font-bold text-white text-sm">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-josefin font-semibold text-navy text-sm">{user.name}</p>
                        <p className="font-josefin text-gray-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-josefin font-semibold px-2 py-0.5 rounded-full capitalize ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.status === "active" ? "green" : user.status === "pending" ? "yellow" : "red"}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 font-josefin text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="p-4 text-right font-outfit font-bold text-navy">{user.totalOrders}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(user.uid)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.status === "active"
                            ? "hover:bg-red-50 text-gray-400 hover:text-red-500"
                            : "hover:bg-green-50 text-gray-400 hover:text-green-500"
                        }`}
                        title={user.status === "active" ? "Suspend user" : "Activate user"}
                      >
                        {user.status === "active"
                          ? <UserX className="w-4 h-4" />
                          : <UserCheck className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

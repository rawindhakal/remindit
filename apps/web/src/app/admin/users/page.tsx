"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  timezone: string;
  createdAt: string;
  _count: {
    reminders: number;
    pushSubscriptions: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setUsers(json.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setActionMessage({ type: "success", text: "User role updated successfully." });
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update role" });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setActionMessage({ type: "success", text: `User marked as ${newStatus}.` });
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update status" });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${email}? All their reminders and data will be removed.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setActionMessage({ type: "success", text: "User deleted successfully." });
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete user" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user roles, access statuses, and view user activity.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700 w-fit">
          {users.length} Registered Users
        </span>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-sm font-semibold border ${
            actionMessage.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by Role"
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by Status"
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reminders</th>
                <th className="p-4">Push</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No users found matching your query.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{user.name || "Unnamed"}</p>
                      <p className="text-slate-400 text-[11px]">{user.email}</p>
                    </td>

                    {/* Role Dropdown */}
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        aria-label={`Role for ${user.email}`}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          user.role === "super_admin"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : user.role === "admin"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        <option value="user" className="bg-slate-900 text-white">user</option>
                        <option value="admin" className="bg-slate-900 text-white">admin</option>
                        <option value="super_admin" className="bg-slate-900 text-white">super_admin</option>
                      </select>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          user.status === "active"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>

                    <td className="p-4 font-mono">{user._count.reminders}</td>
                    <td className="p-4 font-mono">{user._count.pushSubscriptions > 0 ? "✓" : "—"}</td>
                    <td className="p-4 text-slate-400">{formatDate(user.createdAt)}</td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.67.028 2.488.083.21-.015.42-.033.632-.054V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.279c.212.021.422.039.632.054A34.42 34.42 0 0110 4zm-2.75 5.5a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6zm5 0a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

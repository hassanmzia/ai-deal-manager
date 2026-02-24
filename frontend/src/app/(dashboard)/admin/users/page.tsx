"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { getUsers, User } from "@/services/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, Search } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "executive", label: "Executive" },
  { value: "capture_manager", label: "Capture Manager" },
  { value: "proposal_manager", label: "Proposal Manager" },
  { value: "viewer", label: "Viewer" },
  { value: "user", label: "User" },
];

export default function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setError("Access denied. Only admins can manage users.");
    }
  }, [user]);

  // Fetch users
  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "executive":
        return "bg-purple-100 text-purple-800";
      case "capture_manager":
        return "bg-blue-100 text-blue-800";
      case "proposal_manager":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error && !user) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and roles
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Username</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Role</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">MFA</th>
                    <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.username}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(u.role)}`}>
                          {ROLES.find((r) => r.value === u.role)?.label || u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {u.is_mfa_enabled ? "✓ Enabled" : "Disabled"}
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowModal(true);
                          }}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete user ${u.username}?`)) {
                              // TODO: Implement delete functionality
                              console.log("Delete user", u.id);
                            }
                          }}
                          className="p-1 hover:bg-muted rounded text-red-600"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about backend support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> User creation, role updates, and deletion require backend API endpoints.
            Currently, the backend supports listing users and viewing user details. Contact your administrator
            to implement user management endpoints in the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

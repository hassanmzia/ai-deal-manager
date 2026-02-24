import api from "@/lib/api";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "executive" | "capture_manager" | "proposal_manager" | "viewer" | "user";
  is_mfa_enabled: boolean;
  is_active: boolean;
  date_joined: string;
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get("/auth/users/");
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function createUser(userData: Partial<User> & { password: string }): Promise<User> {
  const response = await api.post("/auth/users/", userData);
  return response.data;
}

export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  const response = await api.patch(`/auth/users/${id}/`, userData);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/auth/users/${id}/`);
}

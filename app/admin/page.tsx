"use client";

import { useEffect, useState } from "react";
import { useAuth, logout } from "@/app/lib/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  outOfOffice: boolean;
  createdAt: string;
}

interface OrderItem {
  id: string;
  menuItem: { name: string; price: number };
  quantity: number;
}

interface Order {
  id: string;
  user: { name: string; email: string };
  restaurant: { name: string };
  items: OrderItem[];
  status: string;
  createdAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  createdAt?: string;
  menuItems?: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function AdminDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [weeklyRestaurant, setWeeklyRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "employee" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: "" });
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [updatingWeeklyRestaurant, setUpdatingWeeklyRestaurant] = useState(false);
  const [togglingOutOfOffice, setTogglingOutOfOffice] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "" });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    } else if (!isLoading && session?.user?.role !== "admin") {
      router.push("/orders");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, usersRes, restaurantsRes, weeklyRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/users"),
        fetch("/api/restaurants"),
        fetch("/api/restaurant-of-week"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json();
        setRestaurants(restaurantsData);
      }

      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json();
        setWeeklyRestaurant(weeklyData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setNewUser({ email: "", name: "", password: "", role: "employee" });
        alert("User created successfully!");
      } else {
        const error = await response.json();
        alert("Failed to create user: " + error.error);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("An error occurred while creating the user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurant.name.trim()) {
      alert("Please enter a restaurant name");
      return;
    }

    setCreatingRestaurant(true);

    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRestaurant.name }),
      });

      if (response.ok) {
        const createdRestaurant = await response.json();
        setRestaurants([...restaurants, { ...createdRestaurant, menuItems: [] }]);
        setNewRestaurant({ name: "" });
        alert("Restaurant created successfully!");
      } else {
        const error = await response.json();
        alert("Failed to create restaurant: " + error.error);
      }
    } catch (error) {
      console.error("Error creating restaurant:", error);
      alert("An error occurred while creating the restaurant");
    } finally {
      setCreatingRestaurant(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm("Are you sure you want to delete this restaurant? All menu items will be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRestaurants(restaurants.filter((r) => r.id !== restaurantId));
        alert("Restaurant deleted successfully!");
      } else {
        const error = await response.json();
        alert("Failed to delete restaurant: " + error.error);
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      alert("An error occurred while deleting the restaurant");
    }
  };

  const handleUpdateWeeklyRestaurant = async (restaurantId: string) => {
    setUpdatingWeeklyRestaurant(true);

    try {
      const response = await fetch("/api/restaurant-of-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWeeklyRestaurant(data.restaurant);
        alert("Restaurant of the week updated successfully!");
      } else {
        const error = await response.json();
        alert("Failed to update restaurant of the week: " + error.error);
      }
    } catch (error) {
      console.error("Error updating weekly restaurant:", error);
      alert("An error occurred while updating the restaurant of the week");
    } finally {
      setUpdatingWeeklyRestaurant(false);
    }
  };

  const handleToggleOutOfOffice = async (userId: string, currentStatus: boolean) => {
    setTogglingOutOfOffice(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outOfOffice: !currentStatus }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      } else {
        alert("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("An error occurred while updating user status");
    } finally {
      setTogglingOutOfOffice(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditFormData({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === editingUserId ? updatedUser : u)));
        setEditingUserId(null);
        setEditFormData({ name: "", email: "", role: "" });
        alert("User updated successfully!");
      } else {
        const error = await response.json();
        alert("Failed to update user: " + error.error);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while updating the user");
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ name: "", email: "", role: "" });
  };

  const hasUserOrdered = (userId: string): boolean => {
    return orders.some((order) => order.user.email === users.find((u) => u.id === userId)?.email);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "picked-up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    return role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-12 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Falcon Northwest - Management Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            <Link
              href="/orders"
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              View Orders
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Restaurant of the Week */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant of the Week</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {weeklyRestaurant ? (
                <div>
                  <p className="text-gray-600 text-sm">Currently Selected:</p>
                  <p className="text-xl font-semibold text-gray-900">{weeklyRestaurant.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{weeklyRestaurant.menuItems?.length || 0} menu items</p>
                </div>
              ) : (
                <p className="text-gray-600">No restaurant selected for this week</p>
              )}
            </div>
            <div className="w-64">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleUpdateWeeklyRestaurant(e.target.value);
                  }
                }}
                disabled={updatingWeeklyRestaurant}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                style={{ color: '#1f2937' }}
              >
                <option value="">Select a restaurant...</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <p className="text-gray-600 text-sm font-medium">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 font-medium ${
              activeTab === "orders"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`px-4 py-2 font-medium ${
              activeTab === "restaurants"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Restaurants ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium ${
              activeTab === "users"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.restaurant.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <div className="space-y-8">
            {/* Create Restaurant Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Restaurant</h2>
              <form onSubmit={handleCreateRestaurant} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={creatingRestaurant}
                />
                <button
                  type="submit"
                  disabled={creatingRestaurant}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingRestaurant ? "Creating..." : "Create Restaurant"}
                </button>
              </form>
            </div>

            {/* Restaurants List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {restaurants.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  No restaurants yet. Create one to get started.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Menu Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {restaurant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {restaurant.menuItems?.length || 0} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteRestaurant(restaurant.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-8">
            {/* Create User Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  style={{ color: '#1f2937' }}
                  required
                  disabled={creatingUser}
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  style={{ color: '#1f2937' }}
                  required
                  disabled={creatingUser}
                />
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    style={{ color: '#1f2937', paddingRight: '2.5rem' }}
                    required
                    disabled={creatingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    disabled={creatingUser}
                  >
                    {showCreatePassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="4" y1="4" x2="20" y2="20" />
                      </svg>
                    )}
                  </button>
                </div>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-no-repeat bg-left"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundSize: '1.5em 1.5em', backgroundPosition: '0.5rem center', paddingLeft: '2rem' }}
                  disabled={creatingUser}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="col-span-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </form>
            </div>

            {/* Edit User Form */}
            {editingUserId && (
              <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
                <form onSubmit={handleSaveEditUser} className="grid grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#1f2937' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#1f2937' }}
                    required
                  />
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-no-repeat bg-left"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundSize: '1.5em 1.5em', backgroundPosition: '0.5rem center', paddingLeft: '2rem' }}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md font-medium hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ordered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasUserOrdered(user.id) ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ordered
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleOutOfOffice(user.id, user.outOfOffice)}
                          disabled={togglingOutOfOffice === user.id}
                          className={`px-3 py-1 rounded font-medium text-xs transition ${
                            user.outOfOffice
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          } ${togglingOutOfOffice === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {user.outOfOffice ? "Out of Office" : "In Office"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={editingUserId !== null}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/lib/use-auth";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
}

interface Restaurant {
  id: string;
  name: string;
  menuItems: MenuItem[];
  menuUrl?: string | null;
}

const emptyForm = { name: "", description: "", price: "" };

export default function ManageMenuPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    } else if (!isLoading && session?.user?.role !== "admin") {
      router.push("/orders");
    }
  }, [isLoading, session, router]);

  const fetchRestaurant = useCallback(async () => {
    try {
      const response = await fetch("/api/restaurants");
      if (response.ok) {
        const all: Restaurant[] = await response.json();
        setRestaurant(all.find((r) => r.id === restaurantId) || null);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      const timeout = window.setTimeout(() => {
        void fetchRestaurant();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [session, fetchRestaurant]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateMenu = (update: (items: MenuItem[]) => MenuItem[]) => {
    setRestaurant((prev) =>
      prev
        ? { ...prev, menuItems: update(prev.menuItems).sort((a, b) => a.name.localeCompare(b.name)) }
        : prev
    );
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || "", price: String(item.price) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `/api/menu-items/${editingId}` : `/api/restaurants/${restaurantId}/menu-items`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (response.ok) {
        const saved: MenuItem = await response.json();
        updateMenu((items) =>
          editingId ? items.map((item) => (item.id === saved.id ? saved : item)) : [...items, saved]
        );
        resetForm();
      } else {
        const error = await response.json();
        alert("Failed to save menu item: " + error.error);
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("An error occurred while saving the menu item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/menu-items/${itemId}`, { method: "DELETE" });

      if (response.ok) {
        updateMenu((items) => items.filter((item) => item.id !== itemId));
        if (editingId === itemId) resetForm();
      } else {
        const error = await response.json();
        alert("Failed to delete menu item: " + error.error);
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("An error occurred while deleting the menu item");
    }
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
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/orders" aria-label="Go to orders">
              <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-10 w-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Falcon Northwest</h1>
          </div>
          <Link href="/admin?tab=restaurants" className="text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Manage Menu</h2>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!restaurant ? (
          <div className="bg-yellow-50 rounded-lg shadow p-8 text-center">
            <p className="text-lg font-semibold text-yellow-900">Restaurant Not Found</p>
            <Link
              href="/admin?tab=restaurants"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {/* Menu */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Restaurant</h2>
                <p className="text-indigo-600 text-2xl font-bold mt-2">{restaurant.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600">Add, edit, or remove menu items</p>
                  {restaurant.menuUrl && (
                    <a href={restaurant.menuUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                      View Official Menu
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{restaurant.name} Menu</h3>
                {restaurant.menuItems.length === 0 ? (
                  <p className="text-gray-600">No menu items yet. Add one to get started.</p>
                ) : (
                  <div className="grid gap-4">
                    {restaurant.menuItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b pb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.name} <span className="text-gray-600 font-normal">- ${item.price.toFixed(2)}</span>
                          </h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add / Edit Sidebar */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingId ? "Edit Item" : "Add Item"}
                </h2>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      disabled={saving}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

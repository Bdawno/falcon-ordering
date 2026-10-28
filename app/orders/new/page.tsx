"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/lib/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface Restaurant {
  id: string;
  name: string;
  menuItems: MenuItem[];
  menuUrl?: string | null;
}

interface CartItem {
  menuItemId: string;
  quantity: number;
  specialRequests: string;
  price: number;
  name: string;
}

export default function NewOrderPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [weeklyRestaurant, setWeeklyRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  const fetchWeeklyRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/restaurant-of-week");
      if (response.ok) {
        const data = await response.json();
        setWeeklyRestaurant(data);
      }
    } catch (error) {
      console.error("Error fetching weekly restaurant:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      const timeout = window.setTimeout(() => {
        void fetchWeeklyRestaurant();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [session, fetchWeeklyRestaurant]);

  const addToCart = (item: MenuItem) => {
    const cartKey = item.id;
    const existing = cart.get(cartKey);

    if (existing) {
      const updated = { ...existing, quantity: existing.quantity + 1 };
      cart.set(cartKey, updated);
    } else {
      cart.set(cartKey, {
        menuItemId: item.id,
        quantity: 1,
        specialRequests: "",
        price: item.price,
        name: item.name,
      });
    }
    setCart(new Map(cart));
  };

  const updateCartItem = (menuItemId: string, quantity: number, specialRequests: string) => {
    if (quantity <= 0) {
      cart.delete(menuItemId);
    } else {
      const item = cart.get(menuItemId);
      if (item) {
        item.quantity = quantity;
        item.specialRequests = specialRequests;
      }
    }
    setCart(new Map(cart));
  };

  const removeFromCart = (menuItemId: string) => {
    cart.delete(menuItemId);
    setCart(new Map(cart));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weeklyRestaurant || cart.size === 0) {
      alert("Please add items to your order");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: weeklyRestaurant.id,
          items: Array.from(cart.values()).map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialRequests: item.specialRequests,
          })),
          notes,
        }),
      });

      if (response.ok) {
        router.push("/orders");
      } else {
        const error = await response.json();
        alert("Failed to create order: " + error.error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred while creating the order");
    } finally {
      setSubmitting(false);
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
          <Link href="/orders" className="text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!weeklyRestaurant ? (
          <div className="bg-yellow-50 rounded-lg shadow p-8 text-center">
            <p className="text-lg font-semibold text-yellow-900">No Restaurant Selected</p>
            <p className="text-yellow-800 mt-2">
              Please contact an admin to set the restaurant of the week.
            </p>
            <Link
              href="/orders"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Orders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {/* Menu Selection */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  This Week&apos;s Restaurant
                </h2>
                <p className="text-indigo-600 text-2xl font-bold mt-2">{weeklyRestaurant.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600">Select items below to add to your order</p>
                  {weeklyRestaurant.menuUrl && (
                    <a href={weeklyRestaurant.menuUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                      View Official Menu
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {weeklyRestaurant.name} Menu
                </h3>
                <div className="grid gap-4">
                  {weeklyRestaurant.menuItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b pb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 py-2 ml-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Cart</h2>

                {cart.size === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Your cart is empty. Add items to get started.
                  </p>
                ) : (
                  <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {Array.from(cart.values()).map((item) => (
                      <div key={item.menuItemId} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.menuItemId)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs text-gray-600">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(item.menuItemId, parseInt(e.target.value), item.specialRequests)
                            }
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Special requests..."
                          value={item.specialRequests}
                          onChange={(e) =>
                            updateCartItem(item.menuItemId, item.quantity, e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <textarea
                      placeholder="Order notes (optional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-4"
                      rows={3}
                    />

                    <form onSubmit={handleSubmit}>
                      <button
                        type="submit"
                        disabled={submitting || cart.size === 0}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {submitting ? "Creating Order..." : "Place Order"}
                      </button>
                    </form>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

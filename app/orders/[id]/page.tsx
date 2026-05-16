"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/use-auth";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  menuItem: { name: string; price: number };
  quantity: number;
  specialRequests?: string;
}

interface Order {
  id: string;
  user: { name: string; email: string };
  restaurant: { name: string };
  items: OrderItem[];
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    if (session?.user && orderId) {
      fetchOrder();
    }
  }, [session, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!session?.user || session.user.role !== "admin") {
      alert("Only admins can update order status");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        alert("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("An error occurred while updating the order");
    } finally {
      setUpdating(false);
    }
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

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Falcon Northwest</h1>
          </div>
          <Link href="/orders" className="text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Order Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.restaurant.name}</h2>
              <p className="text-gray-600 mt-1">
                Order by {order.user.name} ({order.user.email})
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Order ID: {order.id}
              </p>
              <p className="text-sm text-gray-500">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-4 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.menuItem.name}</p>
                    {item.specialRequests && (
                      <p className="text-sm text-gray-600 italic mt-1">{item.specialRequests}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mb-8 p-4 bg-blue-50 rounded">
              <p className="text-sm font-semibold text-gray-900 mb-1">Order Notes:</p>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Admin Controls */}
          {session?.user?.role === "admin" && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
              <div className="flex gap-2">
                {["pending", "confirmed", "ready", "picked-up"].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => handleStatusUpdate(statusOption)}
                    disabled={updating || order.status === statusOption}
                    className={`px-4 py-2 rounded font-medium transition ${
                      order.status === statusOption
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

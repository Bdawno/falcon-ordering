"use client";

import { useEffect, useState } from "react";
import { useAuth, logout } from "@/app/lib/use-auth";
import { useRouter } from "next/navigation";
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
  createdAt: string;
}

export default function OrdersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch both pending and confirmed orders (active orders)
      const pendingRes = filter === "active" ? await fetch(`/api/orders?status=pending`) : null;
      const confirmedRes = filter === "active" ? await fetch(`/api/orders?status=confirmed`) : null;
      const readyRes = filter === "ready" ? await fetch(`/api/orders?status=ready`) : null;
      const pickedUpRes = filter === "picked-up" ? await fetch(`/api/orders?status=picked-up`) : null;

      let data: any[] = [];
      if (filter === "active") {
        const pendingData = pendingRes?.ok ? await pendingRes.json() : [];
        const confirmedData = confirmedRes?.ok ? await confirmedRes.json() : [];
        data = [...pendingData, ...confirmedData];
      } else {
        const res = filter === "ready" ? readyRes : pickedUpRes;
        data = res?.ok ? await res.json() : [];
      }
      
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-12 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Falcon Northwest</h1>
              <p className="text-sm text-gray-600">Food Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/orders/new"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
          >
            + New Order
          </Link>
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {["active", "ready", "picked-up"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium ${
                filter === status
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {status === "active" ? "Orders" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No {filter === "active" ? "" : filter} orders found
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      By {order.user.name} ({order.user.email})
                    </p>
                  </div>
                  {filter !== "active" && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm text-gray-600">
                        • {item.quantity}x {item.menuItem.name}
                        {item.specialRequests && (
                          <span className="text-gray-500 italic"> - {item.specialRequests}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
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

interface EmployeeOrderStatus {
  id: string;
  name: string;
  email: string;
  outOfOffice: boolean;
  latestOrderStatus: string;
  confirmedOrderDetails: {
    id: string;
    restaurant: string;
    items: OrderItem[];
    createdAt: string;
  } | null;
  lastOrderDate: string | null;
}

export default function OrdersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<EmployeeOrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      // Fetch both pending and confirmed orders (active orders)
      const pendingRes = await fetch(`/api/orders?status=pending`);
      const confirmedRes = await fetch(`/api/orders?status=confirmed`);
      const pendingData = pendingRes.ok ? await pendingRes.json() : [];
      const confirmedData = confirmedRes.ok ? await confirmedRes.json() : [];
      const data: Order[] = [...pendingData, ...confirmedData];
      
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/users/with-order-status");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    if (session?.user) {
      const timeout = window.setTimeout(() => {
        if (session.user?.role === "admin") {
          void fetchEmployees();
        } else {
          void fetchOrders();
        }
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [session, fetchEmployees, fetchOrders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "no order":
        return "bg-gray-50 text-gray-600 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/orders" aria-label="Go to orders">
              <img src="/falcon-logo.png" alt="Falcon Northwest" className="h-12 w-auto" />
            </Link>
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

        {/* Employees Dashboard (Admin Only) */}
        {session?.user?.role === "admin" ? (
          <>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No employees found</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Office Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <>
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              {employee.confirmedOrderDetails && (
                                <div className="text-sm text-gray-600 truncate max-w-xs">
                                  {employee.confirmedOrderDetails.items
                                    .slice(0, 3)
                                    .map((it) => `${it.quantity}x ${it.menuItem.name}`)
                                    .join(", ")}{employee.confirmedOrderDetails.items.length > 3 ? "..." : ""}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded ${getOrderStatusColor(employee.latestOrderStatus)}`}>
                              {employee.latestOrderStatus.charAt(0).toUpperCase() + employee.latestOrderStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded ${
                              employee.outOfOffice
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {employee.outOfOffice ? "Out of Office" : "In Office"}
                            </span>
                          </td>
                        </tr>
                        {/* Show confirmed order details in expanded row */}
                        {employee.confirmedOrderDetails && (
                          <tr key={`${employee.id}-order`} className="bg-blue-50">
                            <td colSpan={3} className="px-6 py-4">
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                  📦 Order from {employee.confirmedOrderDetails.restaurant}
                                </p>
                                <ul className="space-y-1">
                                  {employee.confirmedOrderDetails.items.map((item) => (
                                    <li key={item.id} className="text-sm text-gray-600">
                                      • {item.quantity}x {item.menuItem.name}
                                      {item.specialRequests && (
                                        <span className="text-gray-500 italic"> - {item.specialRequests}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Orders List */}
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No orders found
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
          </>
        )}
      </main>
    </div>
  );
}

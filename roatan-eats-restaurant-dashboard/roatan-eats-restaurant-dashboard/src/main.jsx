
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, Clock, CheckCircle, Utensils, Bike, PackageCheck, RefreshCw } from "lucide-react";
import { supabase } from "./supabase";
import "./styles.css";

const statusMeta = {
  new: { label: "New", icon: Clock },
  preparing: { label: "Preparing", icon: Utensils },
  ready: { label: "Ready for pickup", icon: PackageCheck },
  picked_up: { label: "Picked up", icon: Bike },
  delivered: { label: "Delivered", icon: CheckCircle },
};

const statusOrder = ["new", "preparing", "ready", "picked_up", "delivered"];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function App() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tab] = useState("orders");
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);

    const [{ data: ordersData, error: ordersError }, { data: itemsData }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
    ]);

    if (ordersError) {
      alert(`Could not load orders: ${ordersError.message}`);
      setLoading(false);
      return;
    }

    setOrders(ordersData || []);
    setOrderItems(itemsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("restaurant-dashboard-live-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
    const text = `${order.id} ${order.customer_name || ""} ${order.phone || ""} ${order.address || ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  });

  const counts = statusOrder.reduce((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {});

  function itemsForOrder(orderId) {
    return orderItems.filter((item) => item.order_id === orderId);
  }

  function nextStatus(order) {
    const index = statusOrder.indexOf(order.status);
    return statusOrder[Math.min(index + 1, statusOrder.length - 1)];
  }

  async function updateOrderStatus(order) {
    const next = nextStatus(order);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);

    if (error) {
      alert(`Could not update order: ${error.message}`);
      return;
    }

    await loadOrders();
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Roatan Eats MVP</p>
          <h1>Restaurant Dashboard</h1>
          <p>Live Supabase orders for West End, Roatán.</p>
        </div>
        <div className="heroCard">
          <strong>{orders.length}</strong>
          <span>Total orders today</span>
        </div>
      </header>

      <nav className="tabs">
        <button className="active">Orders</button>
        <button onClick={loadOrders}><RefreshCw size={16} /> Refresh</button>
      </nav>

      {tab === "orders" && (
        <>
          <section className="stats">
            {statusOrder.map((status) => {
              const Icon = statusMeta[status].icon;
              return (
                <article key={status} className="stat">
                  <Icon size={20} />
                  <strong>{counts[status]}</strong>
                  <span>{statusMeta[status].label}</span>
                </article>
              );
            })}
          </section>

          <section className="toolbar">
            <label>
              <Search size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders..." />
            </label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option>All</option>
              {statusOrder.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}
            </select>
          </section>

          {loading && <p className="empty">Loading live orders...</p>}
          {!loading && filteredOrders.length === 0 && <p className="empty">No live orders yet. Place an order from the customer app.</p>}

          <section className="orders">
            {filteredOrders.map((order) => {
              const items = itemsForOrder(order.id);
              const total = Number(order.total || items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0));
              const status = statusMeta[order.status] ? order.status : "new";

              return (
                <article key={order.id} className="orderCard">
                  <div className="orderTop">
                    <div>
                      <h2>{String(order.id).slice(0, 8).toUpperCase()}</h2>
                      <p>Supabase order · {formatTime(order.created_at)}</p>
                    </div>
                    <span className={`badge ${status}`}>{statusMeta[status].label}</span>
                  </div>

                  <div className="customer">
                    <strong>{order.customer_name || "Guest Customer"}</strong>
                    <span>{order.phone || "No phone"}</span>
                    <span>{order.address || "West End, Roatán"}</span>
                  </div>

                  <ul className="items">
                    {items.length === 0 ? (
                      <li><span>Order items loading...</span><strong>{money(total)}</strong></li>
                    ) : items.map((item) => (
                      <li key={item.id}>
                        <span>{item.quantity}× Menu item</span>
                        <strong>{money(Number(item.quantity || 0) * Number(item.price || 0))}</strong>
                      </li>
                    ))}
                  </ul>

                  <div className="orderBottom">
                    <strong>Total: {money(total)}</strong>
                    <button onClick={() => updateOrderStatus(order)} disabled={status === "delivered"}>
                      {status === "delivered" ? "Completed" : `Mark ${statusMeta[nextStatus({ ...order, status })].label}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

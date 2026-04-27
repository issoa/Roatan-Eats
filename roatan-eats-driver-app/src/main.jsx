import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bike, CheckCircle, MapPin, PackageCheck, RefreshCw, Utensils } from "lucide-react";
import { supabase } from "./supabase";
import "./styles.css";

const pickableStatuses = ["ready", "picked_up"];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function shortId(id) {
  return String(id || "").slice(0, 8).toUpperCase();
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function App() {
  const [orders, setOrders] = useState([]);
  const [driverName, setDriverName] = useState(localStorage.getItem("driverName") || "Driver 1");
  const [orderItems, setOrderItems] = useState([]);
  const [filter, setFilter] = useState("ready");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  async function loadOrders() {
    setError("");
    setLoading(true);

    const [{ data: ordersData, error: ordersError }, { data: itemsData, error: itemsError }] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .in("status", ["ready", "picked_up", "delivered"])
        .order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
    ]);

    if (ordersError || itemsError) {
      setError(ordersError?.message || itemsError?.message || "Could not load driver orders.");
      setLoading(false);
      return;
    }

    setOrders(ordersData || []);
    setOrderItems(itemsData || []);
    setLoading(false);
  }

  async function updateStatus(orderId, status) {
  const updateData = { status };

  // assign driver if not already assigned
  if (!updateData.driver_name) {
    updateData.driver_name = driverName;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    alert(`Could not update order: ${error.message}`);
    return;
  }

  await loadOrders();
}
useEffect(() => {
  if (newOrderAlert) {
    const timer = setTimeout(() => {
      setNewOrderAlert(false);
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }
}, [newOrderAlert]);
  useEffect(() => {
  loadOrders();

  const channel = supabase
  .channel("driver-live-orders")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "orders" },
    () => {
      setNewOrderAlert(true);
      playAlertSound();
      loadOrders();
    }
  )
  .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
  .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadOrders)
  .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

useEffect(() => {
  localStorage.setItem("driverName", driverName);
}, [driverName]);

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const readyCount = orders.filter((order) => order.status === "ready").length;
  const pickedCount = orders.filter((order) => order.status === "picked_up").length;
  const deliveredCount = orders.filter((order) => order.status === "delivered").length;

  function itemsFor(orderId) {
    return orderItems.filter((item) => item.order_id === orderId);
  }

  return (
    <main className="app">
  {newOrderAlert && (
    <div className="alert">
      🔔 New order available!
      <button onClick={() => setNewOrderAlert(false)}>Dismiss</button>
    </div>
  )}   
  <section className="hero">
  <div>
    <div className="eyebrow">ROATAN EATS MVP</div>
    <h1>Driver App</h1>
    <p>Pickup-ready orders for West End, Roatán.</p>
  </div>

  <div className="driver-card">
    <label>Driver Name</label>
    <input
      value={driverName}
      onChange={(e) => setDriverName(e.target.value)}
      placeholder="Enter driver name"
    />
  </div>
</section>

      <section className="toolbar">
        <button className={`tab ${filter === "ready" ? "active" : ""}`} onClick={() => setFilter("ready")}>
          <PackageCheck size={16} /> Ready
        </button>
        <button className={`tab ${filter === "picked_up" ? "active" : ""}`} onClick={() => setFilter("picked_up")}>
          <Bike size={16} /> Picked up
        </button>
        <button className={`tab ${filter === "delivered" ? "active" : ""}`} onClick={() => setFilter("delivered")}>
          <CheckCircle size={16} /> Delivered
        </button>
        <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className="btn ghost" onClick={loadOrders}>
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      <section className="grid">
        <div className="card">
          <Utensils />
          <h2>{readyCount}</h2>
          <p className="muted">Ready for pickup</p>
        </div>
        <div className="card">
          <Bike />
          <h2>{pickedCount}</h2>
          <p className="muted">Out for delivery</p>
        </div>
        <div className="card">
          <CheckCircle />
          <h2>{deliveredCount}</h2>
          <p className="muted">Delivered</p>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="empty">Loading driver orders...</div>
      ) : visibleOrders.length === 0 ? (
        <div className="empty">No orders in this status yet.</div>
      ) : (
        <section className="grid" style={{ marginTop: 20 }}>
          {visibleOrders.map((order) => {
            const items = itemsFor(order.id);
            return (
              <article className="card" key={order.id}>
                <div className="cardTop">
                  <div>
                    <div className="orderId">{order.order_number || shortId(order.id)}</div>
                    <p className="muted">Order placed · {formatTime(order.created_at)}</p>
                  </div>
                  <span className="badge">{String(order.status || "").replace("_", " ")}</span>
                </div>

                <div className="customer">{order.customer_name || "Guest Customer"}</div>
<p className="muted">{order.phone || "+504"}</p>
<p className="muted">
  <MapPin size={14} /> {order.address || "West End, Roatán"}
</p>

<p className="muted">
  Driver: {order.driver_name || "Unassigned"}
</p>

<div className="items">

                {items.length ? (
                    items.map((item) => (
                      <div className="line" key={item.id}>
                        <span>{item.quantity || 1} × {item.name || "Item"}</span>
                        <strong>{money(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="line"><span>1 × Menu item</span><strong>{money(order.total)}</strong></div>
                  )}
                </div>

                <div className="line total">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>

                <div className="actions">
                  {order.status === "ready" && (
                    <button className="btn primary" onClick={() => updateStatus(order.id, "picked_up")}>
                      Mark Picked Up
                    </button>
                  )}
                  {order.status === "picked_up" && (
                    <button className="btn secondary" onClick={() => updateStatus(order.id, "delivered")}>
                      Mark Delivered
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

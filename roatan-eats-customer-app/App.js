// CLEAN FIXED APP.JS

import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { restaurants, categories } from "./src/data/restaurants";
import { colors, shadow } from "./src/styles";
import { supabase } from "./src/supabase";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [customerName, setCustomerName] = useState("Guest Customer");
  const [phone, setPhone] = useState("+504 ");
  const [address, setAddress] = useState("West Bay, Roatán");

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesSearch =
        restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.category.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        category === "All" || restaurant.category.toLowerCase().includes(category.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [query, category]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  function openRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    setScreen("restaurant");
  }

  function addToCart(restaurant, item) {
    setCart((current) => {
      const key = `${restaurant.id}-${item.id}`;
      const existing = current.find((cartItem) => cartItem.key === key);
      if (existing) {
        return current.map((cartItem) =>
          cartItem.key === key ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        );
      }
      return [
        ...current,
        {
          key,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1
        }
      ];
    });
  }

  function changeQty(key, delta) {
    setCart((current) =>
      current
        .map((item) => (item.key === key ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, phone, address, status, total, created_at, order_number")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(
        data.map((order) => ({
          id: order.id,
          order_number: order.order_number,
          placedAt: new Date(order.created_at).toLocaleString(),
          status: order.status,
          total: Number(order.total || 0)
        }))
      );
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function generateOrderNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const { data } = await supabase.rpc("get_today_order_count");
    const count = Number(data || 0) + 1;

    return `${day}/${month}/${year}/${String(count).padStart(3, "0")}`;
  }

  async function placeOrder() {
    if (cart.length === 0) return;

    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        phone,
        address,
        status: "new",
        total: cartTotal,
        order_number: await generateOrderNumber()
      })
      .select()
      .single();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    const items = cart.map((item) => ({
      order_id: createdOrder.id,
      quantity: item.qty,
      price: item.price
    }));

    await supabase.from("order_items").insert(items);

    setLastOrder(createdOrder);
    setScreen("confirmation");
    setCart([]);
    loadOrders();
  }

  function ConfirmationScreen() {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            ✅ Order Confirmed
          </Text>
          <Text style={{ marginTop: 10 }}>
            Order #: {lastOrder?.order_number}
          </Text>
          <Pressable onPress={() => setScreen("orders")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Orders</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function OrdersScreen() {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <Text>{order.order_number}</Text>
              <Text>{order.placedAt}</Text>
              <Text>{order.status}</Text>
              <Text>{money(order.total)}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  let content = <SafeAreaView />;
  if (screen === "orders") content = <OrdersScreen />;
  if (screen === "confirmation") content = <ConfirmationScreen />;

  return (
    <>
      {content}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  orderCard: { padding: 10, borderBottomWidth: 1 },
  primaryButton: { backgroundColor: "black", padding: 10, marginTop: 20 },
  primaryButtonText: { color: "white" }
});
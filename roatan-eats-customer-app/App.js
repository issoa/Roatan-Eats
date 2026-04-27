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
      .select("id, customer_name, phone, address, status, total, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(
        data.map((order) => ({
          id: order.id,
          placedAt: new Date(order.created_at).toLocaleString(),
          status: order.status,
          total: Number(order.total || 0),
          items: []
        }))
      );
    }
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("customer-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
function generateOrderNumber() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const random = Math.floor(100 + Math.random() * 900);

  return `${day}/${month}/${year}/${random}`;
}
  async function placeOrder() {
    if (cart.length === 0) return;

    const { data: createdOrder, error: orderError } = await supabase
  .from("orders")
  .insert({
    customer_name: customerName || "Guest Customer",
    phone: phone || "",
    address: address || "West Bay, Roatán",
    status: "new",
    total: cartTotal,
    order_number: generateOrderNumber()
  })
  .select()
  .single();

    if (orderError) {
      Alert.alert("Order failed", orderError.message);
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: null,
      quantity: item.qty,
      price: item.price
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      Alert.alert("Order saved, item issue", itemsError.message);
    }

    setCart([]);
    await loadOrders();
    setScreen("orders");
    Alert.alert("Order placed", "The restaurant dashboard will receive this order.");
  }

  function Header({ title, back }) {
    return (
      <View style={styles.header}>
        {back ? (
          <Pressable onPress={() => setScreen(back)} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.logo}><Text style={styles.logoText}>RE</Text></View>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable onPress={() => setScreen("cart")} style={styles.cartButton}>
          <Ionicons name="bag-outline" size={24} color={colors.text} />
          {cartCount > 0 && <Text style={styles.cartBadge}>{cartCount}</Text>}
        </Pressable>
      </View>
    );
  }

  function BottomNav() {
    return (
      <View style={styles.bottomNav}>
        <Pressable onPress={() => setScreen("home")} style={styles.navItem}>
          <Ionicons name={screen === "home" ? "home" : "home-outline"} size={22} color={colors.primary} />
          <Text style={styles.navText}>Home</Text>
        </Pressable>
        <Pressable onPress={() => setScreen("orders")} style={styles.navItem}>
          <Ionicons name={screen === "orders" ? "receipt" : "receipt-outline"} size={22} color={colors.primary} />
          <Text style={styles.navText}>Orders</Text>
        </Pressable>
        <Pressable onPress={() => setScreen("cart")} style={styles.navItem}>
          <Ionicons name={screen === "cart" ? "bag" : "bag-outline"} size={22} color={colors.primary} />
          <Text style={styles.navText}>Cart</Text>
        </Pressable>
      </View>
    );
  }

  function HomeScreen() {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Roatan Eats" />
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>Delivering around</Text>
                <Text style={styles.heroTitle}>West Bay, Roatán</Text>
                <Text style={styles.heroCopy}>Browse island favorites, order ahead, and track your status.</Text>
              </View>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={colors.muted} />
                <TextInput
                  placeholder="Search restaurants or food"
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.restaurantCard} onPress={() => openRestaurant(item)}>
              <Image source={{ uri: item.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.muted}>{item.category}</Text>
                <Text style={styles.muted}>{item.area}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>⭐ {item.rating}</Text>
                  <Text style={styles.meta}>• {item.deliveryMinutes} min</Text>
                  <Text style={styles.meta}>• {money(item.deliveryFee)} delivery</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
        <BottomNav />
      </SafeAreaView>
    );
  }

  function RestaurantScreen() {
    const restaurant = selectedRestaurant;
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Menu" back="home" />
        <ScrollView contentContainerStyle={styles.listContent}>
          <Image source={{ uri: restaurant.image }} style={styles.coverImage} />
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.muted}>{restaurant.category} • {restaurant.area}</Text>
          <Text style={styles.sectionTitle}>Popular items</Text>
          {restaurant.menu.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.muted}>{item.description}</Text>
                <Text style={styles.price}>{money(item.price)}</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => addToCart(restaurant, item)}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    );
  }

  function CartScreen() {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Cart" back="home" />
        <ScrollView contentContainerStyle={styles.listContent}>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          ) : (
            <>
              {cart.map((item) => (
                <View key={item.key} style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.muted}>{item.restaurantName}</Text>
                    <Text style={styles.price}>{money(item.price * item.qty)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyButton} onPress={() => changeQty(item.key, -1)}>
                      <Text style={styles.qtyText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyNumber}>{item.qty}</Text>
                    <Pressable style={styles.qtyButton} onPress={() => changeQty(item.key, 1)}>
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{money(cartTotal)}</Text>
              </View>
              <View style={styles.checkoutBox}>
                <Text style={styles.sectionTitle}>Delivery details</Text>
                <TextInput
                  placeholder="Your name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  style={styles.checkoutInput}
                />
                <TextInput
                  placeholder="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.checkoutInput}
                />
                <TextInput
                  placeholder="Delivery address"
                  value={address}
                  onChangeText={setAddress}
                  style={styles.checkoutInput}
                />
              </View>
              <Pressable style={styles.primaryButton} onPress={placeOrder}>
                <Text style={styles.primaryButtonText}>Place order</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    );
  }

  function OrdersScreen() {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Orders" back="home" />
        <ScrollView contentContainerStyle={styles.listContent}>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.muted}>{order.placedAt}</Text>
                <Text style={styles.status}>Status: {order.status.replace("_", " ")}</Text>
                <Text style={styles.price}>{money(order.total)}</Text>
              </View>
            ))
          )}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    );
  }

  let content = <HomeScreen />;
  if (screen === "restaurant") content = <RestaurantScreen />;
  if (screen === "cart") content = <CartScreen />;
  if (screen === "orders") content = <OrdersScreen />;

  return (
    <>
      {content}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg
  },
  logo: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoText: { color: "white", fontWeight: "800" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  cartButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: 0, right: 0, backgroundColor: colors.primary, color: "white", fontSize: 11, paddingHorizontal: 5, borderRadius: 8 },
  listContent: { padding: 18, paddingBottom: 110 },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: 22, marginBottom: 16, ...shadow },
  eyebrow: { color: "#ccfbf1", fontWeight: "700", marginBottom: 4 },
  heroTitle: { color: "white", fontSize: 30, fontWeight: "900" },
  heroCopy: { color: "#ecfeff", marginTop: 8, lineHeight: 20 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "white", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 16 },
  categoryRow: { marginVertical: 14 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "white", borderRadius: 999, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.text, fontWeight: "700" },
  categoryTextActive: { color: "white" },
  restaurantCard: { backgroundColor: "white", borderRadius: 22, marginBottom: 16, overflow: "hidden", ...shadow },
  restaurantImage: { height: 150, width: "100%" },
  restaurantInfo: { padding: 14 },
  restaurantName: { fontSize: 18, fontWeight: "800", color: colors.text },
  muted: { color: colors.muted, marginTop: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  meta: { color: colors.text, fontWeight: "600", marginRight: 4 },
  coverImage: { width: "100%", height: 190, borderRadius: 24, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "900", color: colors.text },
  sectionTitle: { fontSize: 20, fontWeight: "900", marginTop: 22, marginBottom: 10, color: colors.text },
  menuItem: { backgroundColor: "white", borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border },
  menuName: { fontSize: 16, fontWeight: "800", color: colors.text },
  price: { marginTop: 8, fontWeight: "900", color: colors.text },
  addButton: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  addButtonText: { color: "white", fontWeight: "900" },
  bottomNav: { position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: "white", borderRadius: 24, paddingVertical: 12, flexDirection: "row", justifyContent: "space-around", ...shadow },
  navItem: { alignItems: "center" },
  navText: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 2 },
  cartItem: { backgroundColor: "white", borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  qtyText: { color: "white", fontSize: 22, fontWeight: "900" },
  qtyNumber: { fontWeight: "900", fontSize: 16 },
  totalBox: { flexDirection: "row", justifyContent: "space-between", padding: 18, backgroundColor: "white", borderRadius: 18, marginTop: 8 },
  totalLabel: { fontWeight: "800", color: colors.text },
  totalValue: { fontWeight: "900", color: colors.text, fontSize: 18 },
  checkoutBox: { backgroundColor: "white", borderRadius: 18, padding: 16, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  checkoutInput: { backgroundColor: colors.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 18, padding: 16, alignItems: "center", marginTop: 14 },
  primaryButtonText: { color: "white", fontWeight: "900", fontSize: 16 },
  emptyText: { textAlign: "center", color: colors.muted, marginTop: 60, fontSize: 16 },
  orderCard: { backgroundColor: "white", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  orderId: { fontSize: 18, fontWeight: "900", color: colors.text },
  status: { color: colors.primaryDark, fontWeight: "900", marginTop: 8 }
});

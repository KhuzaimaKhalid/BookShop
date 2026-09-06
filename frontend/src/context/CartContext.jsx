import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

const createEmptyCustomer = (name) => ({
  id: `${Date.now()}-${Math.random()}`,
  name,
  items: [],
  laborCharges: "",
  paidAmount: "",
  invoiceNo: null,
  saleId: null,
});

export const CartProvider = ({ children }) => {
  const [customers, setCustomers] = useState([createEmptyCustomer("Customer 1")]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [saving, setSaving] = useState(false);

  const activeCart = customers[activeIndex];

  const updateActiveCart = (updater) => {
    setCustomers((prev) =>
      prev.map((c, idx) => (idx === activeIndex ? updater(c) : c))
    );
  };

  const handleIncrement = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.map((i) =>
        i.product_id === productId && i.qty < i.maxStock ? { ...i, qty: i.qty + 1 } : i
      ),
    }));
  };

  const handleDecrement = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.map((i) =>
        i.product_id === productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i
      ),
    }));
  };

  const handleRemoveItem = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.filter((i) => i.product_id !== productId),
    }));
  };

  const handleLaborChange = (value) => {
    updateActiveCart((cart) => ({ ...cart, laborCharges: value }));
  };

  const handlePaidChange = (value) => {
    updateActiveCart((cart) => ({ ...cart, paidAmount: value }));
  };

  const handleClear = () => {
    updateActiveCart((cart) => ({
      ...cart,
      items: [],
      laborCharges: "",
      paidAmount: "",
      invoiceNo: null,
      saleId: null,
    }));
  };

  const handleAddCustomer = () => {
    setCustomers((prev) => [...prev, createEmptyCustomer(`Customer ${prev.length + 1}`)]);
    setActiveIndex(customers.length);
  };

  const value = {
    customers,
    setCustomers,
    activeIndex,
    setActiveIndex,
    activeCart,
    updateActiveCart,
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    handleLaborChange,
    handlePaidChange,
    handleClear,
    handleAddCustomer,
    scrollStart,
    setScrollStart,
    saving,
    setSaving,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};
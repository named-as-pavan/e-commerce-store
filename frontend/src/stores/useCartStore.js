import axios from "../lib/axios";
import toast from "react-hot-toast";
import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  Total: 0,
  subTotal: 0,
  isCouponApplied:false,



  getMyCoupons: async() => {
    try {
     const response = await axios.get("/coupons");
     set({coupon : response.data}) 
    } catch (error) {
      console.error("Error fetchiing coupon", error)
    }
  },

  applyCoupon: async(code) => {
    try {
      const response = await axios.post("/coupons/validate", {code});
      set({coupon:response.data, isCouponApplied:true})
      get().calculateTotals();
      toast.success("Coupon applied successfully")
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to apply coupon")
    }
  },

  removeCoupon: () => {
    set({coupon: null, isCouponApplied: false})
    get().calculateTotals();
    toast.success("Coupon removed")
  },

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response.data.message || "An error occured in cart");
    }
  },

  clearCart: async() => {
    try {
      set({cart:[], coupon: null, total:0, subTotal: 0})
    } catch (error) {
      
    }
  },

  addToCart: async (product) => {
    console.log(product._id);
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response.data.message || "An error occured while adding to cart"
      );
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete(`/cart`, { data: { productId } });
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
    } catch (error) {}
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }

    await axios.put(`/cart/${productId}`, { quantity });
    set((prevState) => ({
      cart: prevState.cart.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      ),
    }));
    get().calculateTotals();
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let Total = subTotal;

    if (coupon) {
      const discount = subTotal * (coupon.discountPercentage) / 100;
      Total = subTotal - discount;
    }
    set({ subTotal, Total });
  },
}));

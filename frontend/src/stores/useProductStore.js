import { create } from "zustand";

import toast from "react-hot-toast";
import axios from "../lib/axios";


export const useProductStore = create((set) => ({
    products: [],
    loading:false,

    setProducts: (products) => set({products}),

    createProduct: async (productData) => {
        set({loading:true});
        try {
            const res = await axios.post("/products", productData);
            set((prevState) => ({
                products: [...prevState.products, res.data],
                loading: false
            }))
        } catch (error) {
            set({loading:false})
        }
    },



    fetchAllProducts: async () => {
        set({loading: true});

        try {
            const res = await axios.get("/products");

            set({products: res.data.products, loading: false})
        } catch (error) {
            set({loading: false})
            toast.error(error.response.data.error)
        }
    },

    fetchFeaturedProducts: async() => {
        set({loading:true})
        try {
            const response = await axios.get("/products/featured");
            set({products: response.data, loading:false})
            console.log(response.data)
        } catch (error) {
            toast.error(error.message.data || "Error fetching Featured products")
            console.log(error)
        }
        finally{
            set({loading:false})
        }
    },

    fetchProductsByCategory: async(category) =>{
        set({loading:true});
        try {
            const response = await axios.get(`/products/category/${category}`);
            set({products: response.data?.products, loading: false})
        } catch (error) {
            toast.error(error.message.data.error || "Failed to fetch products")
        }
    },


    deleteProduct: async(productId) =>{
        set({loading: true})
        try {
            await axios.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter((product) => product._id !== productId),
                loading: false,
            }))
        } catch (error) {
            set({loading: false})
            toast.error(error.response.data.error || "Failed to delete post")
        }
    },


    toggleFeaturedProduct: async(productId) => {
        set({loading:true})
        try {
            const res = await axios.patch(`/products/${productId}`)
            set((prevState) => ({
                products: prevState.products.map((product) => product._id === productId ? {...product, isFeatured: res.data.isFeatured} : product)
            }))
            
        } catch (error) {
            set({error: "Failed to toggleFeatured products", loading: false})
            toast.error(error.response.data.error)
        }
    },
}))
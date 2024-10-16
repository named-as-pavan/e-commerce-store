import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getProductsByCategory, getRecomendedProducts, toggleFeaturedProducts } from '../controllers/productControllers.js';
import { adminRoute, protectRoute } from '../middlewares/authMiddleware.js';


const router = express.Router();


router.get("/",protectRoute, adminRoute,getAllProducts);
router.get("/featured",getFeaturedProducts);
router.get("/category/:category",getProductsByCategory);
router.get("/recommendations",getRecomendedProducts);
router.post("/",protectRoute,adminRoute,createProduct);
router.patch("/:id",protectRoute,adminRoute,toggleFeaturedProducts);
router.delete("/:id",protectRoute,adminRoute,deleteProduct);


export default router;
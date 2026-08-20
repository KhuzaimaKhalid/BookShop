const express = require("express");
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, updateStock, getLowStockProducts, getOutOfStockProducts, getProductsByCategory, searchProduct } = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, upload.single('image'), createProduct);
router.get("/", getAllProducts);
router.get("/search", searchProduct);
router.get("/low-stock", getLowStockProducts);
router.get("/out-of-stock", getOutOfStockProducts);
router.get("/category/:category_id", getProductsByCategory);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, adminMiddleware, upload.single('image'), updateProduct);
router.patch("/:id/stock", authMiddleware, adminMiddleware, updateStock);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
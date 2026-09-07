// frontend/local-server/backend/routes/salesRoutes.js
const express = require("express");
const {
  createSale,
  getAllSales,
  getSaleById,
  getSaleByInvoice,
  searchSaleByInvoice,
  getSalesByDateRange,
  deleteSale
} = require("../controllers/salesController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// 1. Static & Explicit Sub-routes FIRST
router.get("/", getAllSales);
router.get("/search", searchSaleByInvoice);
router.get("/date-range", getSalesByDateRange);
router.get("/invoice/:invoice_no", getSaleByInvoice);

// 2. Dynamic Param Routes LAST
router.get("/:id", getSaleById);

// Writes & Deletes
router.post("/", createSale);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSale);

module.exports = router;
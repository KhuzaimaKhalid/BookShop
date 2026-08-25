const express = require("express");

const {createSale, getAllSales, getSaleById, getSaleByInvoice, searchSaleByInvoice, getSalesByDateRange, deleteSale} = require("../controllers/salesController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSale);

router.get("/", authMiddleware, getAllSales);

router.get("/search", authMiddleware, searchSaleByInvoice);

router.get("/date-range", authMiddleware, getSalesByDateRange);

router.get("/invoice/:invoice_no", authMiddleware, getSaleByInvoice);

router.get("/:id", authMiddleware, getSaleById);

router.delete("/:id", authMiddleware, adminMiddleware, deleteSale);

module.exports = router;
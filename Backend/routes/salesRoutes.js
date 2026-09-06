const express = require("express");

const {createSale, getAllSales, getSaleById, getSaleByInvoice, searchSaleByInvoice, getSalesByDateRange, deleteSale} = require("../controllers/salesController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.post("/", createSale);

router.get("/", getAllSales);

router.get("/search", searchSaleByInvoice);

router.get("/date-range", getSalesByDateRange);

router.get("/invoice/:invoice_no", getSaleByInvoice);

router.get("/:id", getSaleById);

router.delete("/:id", authMiddleware, adminMiddleware, deleteSale);

module.exports = router;
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const { getDashboardSummary, getSalesReport, getSingleInvoiceReport, productSalesReport, stockReport, lowStockReport, outOfStockReport, returnsReport, profitReport, monthlySalesReport, topSellingProductsReport, dailySalesReport, categoryWiseSalesReport, inventoryValueReport} = require("../controllers/reportController");

router
    .get("/dashboard", authMiddleware, adminMiddleware, getDashboardSummary)
    .get("/sales", authMiddleware, adminMiddleware, getSalesReport)
    .get("/sales/:id", authMiddleware, adminMiddleware, getSingleInvoiceReport)
    .get("/products", authMiddleware, adminMiddleware, productSalesReport)
    .get("/stock", authMiddleware, adminMiddleware, stockReport)
    .get("/stock/low", authMiddleware, adminMiddleware, lowStockReport)
    .get("/stock/out", authMiddleware, adminMiddleware, outOfStockReport)
    .get("/returns", authMiddleware, adminMiddleware, returnsReport)
    .get("/profit", authMiddleware, adminMiddleware, profitReport)
    .get("/monthly-sales", authMiddleware, adminMiddleware, monthlySalesReport)
    .get("/top-products", authMiddleware, adminMiddleware, topSellingProductsReport)
    .get("/daily-sales", authMiddleware, adminMiddleware, dailySalesReport)
    .get("/category-sales", authMiddleware, adminMiddleware, categoryWiseSalesReport)
    .get("/inventory-value", authMiddleware, adminMiddleware, inventoryValueReport);

module.exports = router;
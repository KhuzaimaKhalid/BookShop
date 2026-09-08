const express = require("express");
const cors = require("cors");

function createLocalServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Local server only serves reads" });
    }
    next();
  });

  // Products
  app.use("/api/products", require("./backend/routes/productsRoutes"));
  app.use("/api/product", require("./backend/routes/productsRoutes"));

  // Categories
  app.use("/api/categories", require("./backend/routes/categoriesRoutes"));
  app.use("/api/category", require("./backend/routes/categoriesRoutes"));

  // Returns (Added singular alias)
  app.use("/api/returns", require("./backend/routes/returnRoutes"));
  app.use("/api/return", require("./backend/routes/returnRoutes"));

  // Expenses (Added singular alias)
  app.use("/api/expenses", require("./backend/routes/expenseRouter"));
  app.use("/api/expense", require("./backend/routes/expenseRouter"));

  // Pages (Added singular alias)
  app.use("/api/pages", require("./backend/routes/pagesRoutes"));
  app.use("/api/page", require("./backend/routes/pagesRoutes"));

  // Other entities
  app.use("/api/courses", require("./backend/routes/courseRoutes"));
  app.use("/api/reports", require("./backend/routes/reportRoutes"));
  app.use("/api/sales", require("./backend/routes/salesRoutes"));
  app.use("/api/stationary", require("./backend/routes/stationaryRoutes"));
  app.use("/api/business", require("./backend/routes/businessRoutes"));
  app.use("/api/users", require("./backend/routes/userRoutes"));

  // Fallback 404 handler
  app.use((req, res) => {
    console.warn(`[Local Server 404] No local route matched: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `Local endpoint ${req.originalUrl} not found` });
  });

  return app;
}

module.exports = { createLocalServer };
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { app: electronApp } = require("electron"); // 1. Import Electron app

function createLocalServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 2. Use userData in production, __dirname in dev
  const baseDir = electronApp && electronApp.isPackaged
    ? electronApp.getPath("userData")
    : path.join(__dirname, "backend");

  const imagesDir = path.join(baseDir, "images");
  fs.mkdirSync(path.join(imagesDir, "categories"), { recursive: true });
  fs.mkdirSync(path.join(imagesDir, "products"), { recursive: true });
  app.use("/images", express.static(imagesDir));

  const mount = (pluralPath, singularPath, routeFile) => {
    app.use(pluralPath, require(routeFile));
    app.use(singularPath, require(routeFile));
  };

  mount("/api/products", "/api/product", "./backend/routes/productsRoutes");
  mount("/api/categories", "/api/category", "./backend/routes/categoriesRoutes");
  mount("/api/returns", "/api/return", "./backend/routes/returnRoutes");
  mount("/api/expenses", "/api/expense", "./backend/routes/expenseRouter");
  mount("/api/pages", "/api/page", "./backend/routes/pagesRoutes");
  mount("/api/reports", "/api/report", "./backend/routes/reportRoutes");
  mount("/api/sales", "/api/sale", "./backend/routes/salesRoutes");
  mount("/api/stationary", "/api/stationary", "./backend/routes/stationaryRoutes");
  mount("/api/business", "/api/business", "./backend/routes/businessRoutes");
  mount("/api/users", "/api/user", "./backend/routes/userRoutes");
  mount("/api/courses", "/api/course", "./backend/routes/courseRoutes");
  mount("/api/courses", "/api/course", "./backend/routes/courseRoutes");
  mount("/api/packages", "/api/package", "./backend/routes/packageRoutes"); // add this

  app.use((req, res) => {
    console.warn(`[Local Server 404] No local route matched: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `Local endpoint ${req.originalUrl} not found` });
  });

  return app;
}

module.exports = { createLocalServer };
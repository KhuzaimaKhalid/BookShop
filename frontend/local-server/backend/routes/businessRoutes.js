const express = require('express');
const multer = require('multer');

const { createBusiness, getBusiness } = require('../controllers/businessController');
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.put("/settings", authMiddleware, adminMiddleware, upload.single('logo'), createBusiness)
      .get("/name", getBusiness);

module.exports = router;
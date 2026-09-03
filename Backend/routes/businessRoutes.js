const express = require('express')

const { createBusiness, getBusiness } = require('../controllers/businessController')
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const router = express.Router()

router.put("/settings",authMiddleware, adminMiddleware, createBusiness)
    .get("/name", getBusiness)

module.exports = router
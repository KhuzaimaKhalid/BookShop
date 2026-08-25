const express = require("express");
const { createPage, getAllPages, updatePage, deletePage } = require("../controllers/pagesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createPage);
router.get("/", getAllPages);
router.put("/:id", authMiddleware, adminMiddleware, updatePage);
router.delete("/:id", authMiddleware, adminMiddleware, deletePage);

module.exports = router;
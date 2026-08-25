const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {getReturns, getReturnById, getInvoiceForReturn, createReturn, deleteReturn} = require("../controllers/returnController");

router
    .get("/", authMiddleware, getReturns)
    .get("/:id", authMiddleware, getReturnById)
    .get("/invoice/:invoiceNo", authMiddleware, getInvoiceForReturn)
    .post("/", authMiddleware, createReturn)
    .delete("/:id", authMiddleware, deleteReturn);

module.exports = router;
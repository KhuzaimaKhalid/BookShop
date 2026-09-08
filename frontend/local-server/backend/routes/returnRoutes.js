const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {getReturns, getReturnById, getInvoiceForReturn, createReturn, deleteReturn} = require("../controllers/returnController");

router
    .get("/", getReturns)
    .get("/:id", getReturnById)
    .get("/invoice/:invoiceNo", getInvoiceForReturn)
    .post("/", createReturn)
    .delete("/:id", deleteReturn);

module.exports = router;
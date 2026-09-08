const db = require("../config/connectDB");

const getReturns = async (req, res) => {
    try {
        const returns = await db.prepare(`
            SELECT
                r.id,
                r.return_no,
                s.invoice_no,
                r.total_refund,
                r.reason,
                r.created_at
            FROM returns r
            JOIN sales s ON r.sale_id = s.id
            ORDER BY r.created_at DESC
        `).all();

        return res.status(200).json(returns);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getReturnById = async (req, res) => {
    try {
        const { id } = req.params;

        const returnData = await db.prepare(`
            SELECT
                r.id,
                r.return_no,
                r.sale_id,
                s.invoice_no,
                r.total_refund,
                r.reason,
                r.created_at
            FROM returns r
            JOIN sales s ON r.sale_id = s.id
            WHERE r.id = ?
        `).get(id);

        if (!returnData) {
            return res.status(404).json({ message: "Return not found" });
        }

        const items = await db.prepare(`
            SELECT
                p.name,
                ri.qty,
                ri.price,
                (ri.qty * ri.price) AS total
            FROM return_items ri
            JOIN products p ON ri.product_id = p.id
            WHERE ri.return_id = ?
        `).all(id);

        return res.status(200).json({
            return: returnData,
            items
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getInvoiceForReturn = async (req, res) => {
    try {
        const { invoiceNo } = req.params;

        const invoice = await db.prepare(`
            SELECT *
            FROM sales
            WHERE invoice_no = ?
        `).get(invoiceNo);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const items = await db.prepare(`
            SELECT
                si.id,
                si.product_id,
                p.name,
                si.qty,
                si.price
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(invoice.id);

        return res.status(200).json({
            invoice,
            items
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const createReturn = async (req, res) => {
    const { sale_id, reason, items } = req.body;

    if (!sale_id || !items || !items.length) {
        return res.status(400).json({ message: "Invalid return data" });
    }

    const transaction = db.transaction(async (txDb) => {
        const sale = await txDb.prepare(
            "SELECT * FROM sales WHERE id = ?"
        ).get(sale_id);

        if (!sale) {
            throw new Error("Sale not found");
        }

        let totalRefund = 0;

        const returnNo = `RE-${String(Date.now()).slice(-6)}`;

        const returnResult = await txDb.prepare(`
            INSERT INTO returns (
                return_no,
                sale_id,
                total_refund,
                reason
            )
            VALUES (?, ?, ?, ?)
        `).run(returnNo, sale_id, 0, reason || null);

        const returnId = returnResult.lastInsertRowid;

        for (const item of items) {
            const saleItem = await txDb.prepare(`
                SELECT id, product_id, qty, price
                FROM sale_items
                WHERE id = ? AND sale_id = ?
            `).get(item.sale_item_id, sale_id);

            if (!saleItem) {
                throw new Error("Invalid sale item");
            }

            const returnedQty = await txDb.prepare(`
                SELECT COALESCE(SUM(qty),0) AS returned
                FROM return_items
                WHERE sale_item_id = ?
            `).get(item.sale_item_id);

            const remainingQty = saleItem.qty - returnedQty.returned;

            if (item.qty > remainingQty) {
                throw new Error("Return quantity exceeds remaining quantity");
            }

            await txDb.prepare(`
                INSERT INTO return_items (
                    return_id,
                    sale_item_id,
                    product_id,
                    qty,
                    price
                )
                VALUES (?, ?, ?, ?, ?)
            `).run(returnId, saleItem.id, saleItem.product_id, item.qty, saleItem.price);

            await txDb.prepare(`
                UPDATE products
                SET stock_quantity = stock_quantity + ?
                WHERE id = ?
            `).run(item.qty, saleItem.product_id);

            totalRefund += item.qty * saleItem.price;
        }

        await txDb.prepare(`
            UPDATE returns
            SET total_refund = ?
            WHERE id = ?
        `).run(totalRefund, returnId);

        return {
            return_no: returnNo,
            total_refund: totalRefund
        };
    });

    try {
        const result = await transaction();

        return res.status(201).json({
            message: "Return processed successfully",
            ...result
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

const deleteReturn = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Return ID is required" });
      }

      const deleteTx = db.transaction(async (txDb, returnId) => {
        const items = await txDb.prepare('SELECT * FROM return_items WHERE return_id = ?').all(returnId);

        for (const item of items) {
          await txDb.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
            .run(item.qty, item.product_id);
        }

        await txDb.prepare('DELETE FROM return_items WHERE return_id = ?').run(returnId);
        const result = await txDb.prepare('DELETE FROM returns WHERE id = ?').run(returnId);

        return result.changes;
      });

      const changes = await deleteTx(id);

      if (changes === 0) {
        return res.status(404).json({ message: "Return not found" });
      }

      return res.status(200).json({ message: "Return deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getReturns,
    getReturnById,
    getInvoiceForReturn,
    createReturn,
    deleteReturn
};
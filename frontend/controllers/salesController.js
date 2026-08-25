const db = require('../config/connectDB');

const generateInvoiceNo = async () => {
    const sql = 'SELECT id FROM sales ORDER BY id DESC LIMIT 1';
    const last = await db.prepare(sql).get();
    const nextId = last ? last.id + 1 : 1;
    return `INV-${String(nextId).padStart(5, '0')}`;
}

const createSale = async (req, res) => {
    try {
      const { items, labor_charges, paid_amount } = req.body;
  
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart items cannot be empty." });
      }
  
      // Ensure numeric inputs fallback safely to 0 (prevents NaN)
      const labor = Number(labor_charges) || 0;
      const paid = Number(paid_amount) || 0;
  
      // Calculate subtotal safely
      const subtotal = items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 0;
        return sum + (qty * price);
      }, 0);
  
      const total = subtotal + labor;
  
      if (paid < total) {
        return res.status(400).json({ message: "Paid amount is less than total." });
      }
  
      const change = Math.max(0, paid - total);
      const invoice_no = `INV-${Date.now()}`;
      const createdBy = req.user?.id || null;
  
      // Execute database operations
      const transaction = db.transaction(async (txDb) => {
        const saleResult = await txDb.prepare(
          'INSERT INTO sales (invoice_no, subtotal, labor_charges, total, paid_amount, change, created_by) VALUES (?,?,?,?,?,?,?)'
        ).run(
          invoice_no, 
          Number(subtotal) || 0, 
          Number(labor) || 0, 
          Number(total) || 0, 
          Number(paid) || 0, 
          Number(change) || 0, 
          createdBy
        );
  
        const sale_id = Number(saleResult.lastInsertRowid);
  
        for (const item of items) {
          const itemQty = Number(item.qty) || 0;
          const itemPrice = Number(item.price) || 0;
  
          await txDb.prepare(
            'INSERT INTO sale_items (sale_id, product_id, qty, price) VALUES (?,?,?,?)'
          ).run(sale_id, item.product_id, itemQty, itemPrice);
  
          await txDb.prepare(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
          ).run(itemQty, item.product_id);
        }
  
        return sale_id;
      });
  
      const sale_id = await transaction();
  
      return res.status(201).json({
        message: 'Sale created successfully',
        sale_id,
        invoice_no,
        subtotal,
        labor_charges: labor,
        total,
        paid_amount: paid,
        change
      });
  
    } catch (error) {
      console.error("Error creating sale:", error);
      return res.status(500).json({ message: "Failed to create sale" });
    }
  };

const getAllSales = async (req, res) => {
    try {
        const sql = 'SELECT * FROM sales ORDER BY created_at DESC';
        const sales = await db.prepare(sql).all();
        return res.status(200).json(sales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        const items = await db.prepare(
            `SELECT sale_items.id, sale_items.product_id, products.name, sale_items.qty, sale_items.price
             FROM sale_items JOIN products ON sale_items.product_id = products.id
             WHERE sale_items.sale_id = ?`
        ).all(id);
        return res.status(200).json({ sale, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const searchSaleByInvoice = async (req, res) => {
    try {
        const { invoice_no } = req.query;
        if (!invoice_no) {
            return res.status(400).json({ message: 'Please provide invoice number' });
        }
        const sql = 'SELECT * FROM sales WHERE invoice_no LIKE ?';
        const sales = await db.prepare(sql).all(`%${invoice_no}%`);
        return res.status(200).json(sales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getSalesByDateRange = async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: 'Please provide from and to dates' });
        }
        const sql = 'SELECT * FROM sales WHERE date(created_at) BETWEEN date(?) AND date(?) ORDER BY created_at DESC';
        const sales = await db.prepare(sql).all(from, to);
        return res.status(200).json(sales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getSaleByInvoice = async (req, res) => {
    try {
        const { invoice_no } = req.params;

        const sale = await db.prepare(
            'SELECT * FROM sales WHERE invoice_no = ?'
        ).get(invoice_no);

        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found'
            });
        }

        const items = await db.prepare(`
            SELECT
                sale_items.id,
                sale_items.product_id,
                products.name,
                products.image,
                sale_items.qty,
                sale_items.price,
                (sale_items.qty * sale_items.price) AS subtotal
            FROM sale_items
            JOIN products
            ON sale_items.product_id = products.id
            WHERE sale_items.sale_id = ?
        `).all(sale.id);

        return res.status(200).json({
            sale,
            items
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Server error'
        });
    }
};

const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await db.prepare(
            "SELECT * FROM sales WHERE id = ?"
        ).get(id);

        if (!sale) {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        const saleItems = await db.prepare(
            "SELECT product_id, qty FROM sale_items WHERE sale_id = ?"
        ).all(id);

        const transaction = db.transaction(async (txDb) => {
            for (const item of saleItems) {
                await txDb.prepare(
                    "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?"
                ).run(item.qty, item.product_id);
            }

            await txDb.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(id);
            await txDb.prepare("DELETE FROM sales WHERE id = ?").run(id);
        });

        await transaction();

        return res.status(200).json({
            message: "Sale deleted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    searchSaleByInvoice,
    getSalesByDateRange,
    getSaleByInvoice,
    deleteSale
}
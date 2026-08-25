const db = require('../config/connectDB');

const getDashboardSummary = async (req, res) => {
    try {
        const totalSales = await db.prepare(
            `SELECT COALESCE(SUM(total),0) as total FROM sales`
        ).get();
        const totalOrders = await db.prepare(
            `SELECT COUNT(*) as count FROM sales`
        ).get();
        const totalProducts = await db.prepare(`SELECT COUNT(*) as count FROM products`).get();
        const lowStockItems = await db.prepare(
            `SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level`
        ).get();
        const salesOverview = await db.prepare(
            `SELECT date(created_at) as date, SUM(total) as total FROM sales
             WHERE date(created_at) >= date('now','localtime','-6 days')
             GROUP BY date(created_at) ORDER BY date(created_at) ASC`
        ).all();
        const topSelling = await db.prepare(
            `SELECT p.id, p.name, SUM(si.qty) as qty_sold
             FROM sale_items si JOIN products p ON si.product_id = p.id
             JOIN sales s ON si.sale_id = s.id
             WHERE date(s.created_at) >= date('now','localtime','-6 days')
             GROUP BY p.id, p.name ORDER BY qty_sold DESC LIMIT 3`
        ).all();
        const recentSales = await db.prepare(
            `SELECT invoice_no, created_at, total FROM sales ORDER BY created_at DESC LIMIT 6`
        ).all();
        return res.status(200).json({
            total_sales: totalSales.total,
            total_orders: totalOrders.count,
            total_products: totalProducts.count,
            low_stock_items: lowStockItems.count,
            sales_overview: salesOverview,
            top_selling_products: topSelling,
            recent_sales: recentSales
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getSalesReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = `date(created_at) >= date('now','localtime','-6 days')`;
        let params = [];
        if (from && to) {
            dateFilter = `date(created_at) BETWEEN date(?) AND date(?)`;
            params = [from, to];
        }
        const summary = await db.prepare(
            `SELECT COALESCE(SUM(total),0) as total_sales, COUNT(*) as total_orders,
             COALESCE(AVG(total),0) as avg_order_value FROM sales WHERE ${dateFilter}`
        ).get(...params);
        const totalItems = await db.prepare(
            `SELECT COALESCE(SUM(si.qty),0) as total_items_sold
             FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE ${dateFilter}`
        ).get(...params);
        const salesOverview = await db.prepare(
            `SELECT date(created_at) as date, SUM(total) as total FROM sales
             WHERE ${dateFilter} GROUP BY date(created_at) ORDER BY date(created_at) ASC`
        ).all(...params);
        const recentSales = await db.prepare(
            `SELECT invoice_no, created_at, total FROM sales
             WHERE ${dateFilter} ORDER BY created_at DESC LIMIT 6`
        ).all(...params);
        return res.status(200).json({
            total_sales: summary.total_sales,
            total_orders: summary.total_orders,
            avg_order_value: summary.avg_order_value,
            total_items_sold: totalItems.total_items_sold,
            sales_overview: salesOverview,
            recent_sales: recentSales
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getSingleInvoiceReport = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await db.prepare(
            `SELECT id, invoice_no, subtotal, labor_charges, total, paid_amount, change, created_at
             FROM sales WHERE id = ?`
        ).get(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const items = await db.prepare(
            `SELECT p.name as product_name, si.qty, si.price, (si.qty * si.price) as item_total
             FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`
        ).all(id);
        return res.status(200).json({ invoice, items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const productSalesReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = `date(s.created_at) >= date('now','localtime','-6 days')`;
        let params = [];
        if (from && to) {
            dateFilter = `date(s.created_at) BETWEEN date(?) AND date(?)`;
            params = [from, to];
        }
        const products = await db.prepare(
            `SELECT p.id, p.name, SUM(si.qty) as total_sold
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             JOIN sales s ON si.sale_id = s.id
             WHERE ${dateFilter}
             GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5`
        ).all(...params);
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const stockReport = async (req, res) => {
    try {
        const stock = await db.prepare(
           `SELECT p.id, p.name, p.stock_quantity, p.min_stock_level, p.purchase_price, p.selling_price, c.name as category_name,
             CASE WHEN p.stock_quantity = 0 THEN 'Out of Stock'
                  WHEN p.stock_quantity <= p.min_stock_level THEN 'Low Stock'
                  ELSE 'In Stock' END as stock_status
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.stock_quantity ASC`
        ).all();
        return res.status(200).json(stock);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const lowStockReport = async (req, res) => {
    try {
        const lowStock = await db.prepare(
            `SELECT id, name, stock_quantity, min_stock_level, purchase_price, selling_price
             FROM products WHERE stock_quantity <= min_stock_level AND stock_quantity > 0
             ORDER BY stock_quantity ASC`
        ).all();
        return res.status(200).json(lowStock);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const outOfStockReport = async (req, res) => {
    try {
        const outOfStock = await db.prepare(
            `SELECT id, name, stock_quantity, purchase_price, selling_price
             FROM products WHERE stock_quantity = 0`
        ).all();
        return res.status(200).json(outOfStock);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const returnsReport = async (req, res) => {
    try {
        const returns = await db.prepare(
            `SELECT r.id, r.return_no, r.sale_id, s.invoice_no, r.total_refund, r.reason, r.created_at
             FROM returns r JOIN sales s ON r.sale_id = s.id ORDER BY r.created_at DESC`
        ).all();
        return res.status(200).json(returns);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const profitReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = `1=1`;
        let params = [];
        let queryParams = [];

        if (from && to) {
            dateFilter = `date(s.created_at) BETWEEN date(?) AND date(?)`;
            params = [from, to];
            // Since dateFilter is used twice in the first query, duplicate params for both occurrences
            queryParams = [from, to, from, to];
        }

        const result = await db.prepare(
            `SELECT
(
    SELECT COALESCE(SUM(total),0)
    FROM sales
    WHERE ${dateFilter.replace(/s\.created_at/g, "created_at")}
) AS total_revenue,
COALESCE(SUM(p.purchase_price * si.qty),0) AS total_cost
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
WHERE ${dateFilter}`
        ).get(...queryParams); // <-- Pass queryParams (4 items) here

        const total_profit = result.total_revenue - result.total_cost;
        const profit_margin = result.total_revenue > 0 ? (total_profit / result.total_revenue) * 100 : 0;

        const monthly = await db.prepare(
            `SELECT strftime('%Y-%m', s.created_at) as month,
             SUM(s.total) as revenue,
             SUM(s.total) - SUM(p.purchase_price * si.qty) as profit
             FROM sales s JOIN sale_items si ON s.id = si.sale_id
             JOIN products p ON si.product_id = p.id
             WHERE ${dateFilter} GROUP BY month ORDER BY month ASC`
        ).all(...params); // <-- Standard 2 params here

        return res.status(200).json({
            total_revenue: result.total_revenue,
            total_cost: result.total_cost,
            total_profit,
            profit_margin: Number(profit_margin.toFixed(2)),
            monthly_breakdown: monthly
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const monthlySalesReport = async (req, res) => {
    try {
        const monthlySales = await db.prepare(
            `SELECT strftime('%Y-%m', created_at) as month, SUM(total) as total_sales
             FROM sales GROUP BY month ORDER BY month DESC`
        ).all();
        return res.status(200).json(monthlySales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const topSellingProductsReport = async (req, res) => {
    try {
        const topSellingProducts = await db.prepare(
            `SELECT p.id, p.name, SUM(si.qty) as total_sold
             FROM sale_items si JOIN products p ON si.product_id = p.id
             GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 10`
        ).all();
        return res.status(200).json(topSellingProducts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const dailySalesReport = async (req, res) => {
    try {
        const dailySales = await db.prepare(
            `SELECT date(created_at) as date, SUM(total) as total_sales
             FROM sales GROUP BY date ORDER BY date DESC`
        ).all();
        return res.status(200).json(dailySales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const categoryWiseSalesReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = `date(s.created_at) >= date('now','localtime','-6 days')`;
        let params = [];
        if (from && to) {
            dateFilter = `date(s.created_at) BETWEEN date(?) AND date(?)`;
            params = [from, to];
        }
        const categoryWiseSales = await db.prepare(
            `SELECT c.id, c.name, SUM(si.qty) as total_sold
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             JOIN categories c ON p.category_id = c.id
             JOIN sales s ON si.sale_id = s.id
             WHERE ${dateFilter}
             GROUP BY c.id, c.name ORDER BY total_sold DESC`
        ).all(...params);
        return res.status(200).json(categoryWiseSales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const inventoryValueReport = async (req, res) => {
    try {
        const inventoryValue = await db.prepare(
            `SELECT SUM(stock_quantity * purchase_price) as total_inventory_value FROM products`
        ).get();
        return res.status(200).json(inventoryValue);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getDashboardSummary,
    getSalesReport,
    getSingleInvoiceReport,
    productSalesReport,
    stockReport,
    lowStockReport,
    outOfStockReport,
    returnsReport,
    profitReport,
    monthlySalesReport,
    topSellingProductsReport,
    dailySalesReport,
    categoryWiseSalesReport,
    inventoryValueReport
}
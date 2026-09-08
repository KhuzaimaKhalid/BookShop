const db = require('../config/connectDB');

const createStationary = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const result = await db.prepare('INSERT INTO stationary (title) VALUES (?)').run(title);

        return res.status(201).json({
            message: "Stationery package created successfully", 
            stationary: { stationary_id: Number(result.lastInsertRowid), title }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getStationaryList = async (req, res) => {
    try {
        const stationeries = await db.prepare('SELECT * FROM v_stationary_totals').all();
        return res.status(200).json({ stationeries });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getNumberOfProductsInStationary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Stationery ID is required" });
        }

        const result = await db.prepare(
            'SELECT COUNT(*) AS product_count FROM stationary_products WHERE stationary_id = ?'
        ).get(id);

        return res.status(200).json({
            stationary_id: Number(id),
            product_count: result ? result.product_count : 0
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const addOrUpdateStationaryProduct = async (req, res) => {
    try {
        const { stationary_id, product_id, action, quantity } = req.body;

        if (!stationary_id || !product_id) {
            return res.status(400).json({ message: "stationary_id and product_id are required" });
        }

        const existingItem = await db.prepare(
            'SELECT quantity FROM stationary_products WHERE stationary_id = ? AND product_id = ?'
        ).get(stationary_id, product_id);

        if (!existingItem) {
            if (action === 'decrease' || action === 'remove') {
                return res.status(400).json({ message: "Product is not linked to this stationary package" });
            }

            const initialQty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;
            await db.prepare(
                'INSERT INTO stationary_products (stationary_id, product_id, quantity) VALUES (?, ?, ?)'
            ).run(stationary_id, product_id, initialQty);

            return res.status(201).json({ message: "Product added to stationary successfully", current_quantity: initialQty });
        }

        let newQty = existingItem.quantity;

        if (action === 'increase') {
            newQty += 1;
        } else if (action === 'decrease') {
            newQty -= 1;
        } else if (action === 'set') {
            if (typeof quantity !== 'number' || quantity < 0) {
                return res.status(400).json({ message: "Invalid quantity value" });
            }
            newQty = quantity;
        } else if (action === 'remove') {
            newQty = 0;
        } else {
            return res.status(400).json({ message: "Invalid action. Use 'increase', 'decrease', 'set', or 'remove'" });
        }

        if (newQty <= 0) {
            await db.prepare(
                'DELETE FROM stationary_products WHERE stationary_id = ? AND product_id = ?'
            ).run(stationary_id, product_id);

            return res.status(200).json({ message: "Product removed from stationary package", current_quantity: 0 });
        }

        await db.prepare(
            'UPDATE stationary_products SET quantity = ? WHERE stationary_id = ? AND product_id = ?'
        ).run(newQty, stationary_id, product_id);

        return res.status(200).json({ message: "Stationery product quantity updated", current_quantity: newQty });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getProductsByStationary = async (req, res) => {
    try {
        const { stationary_id } = req.params;

        if (!stationary_id) {
            return res.status(400).json({ message: "Stationery ID is required" });
        }

        const query = `
            SELECT 
                p.id,
                p.category_id,
                p.name,
                p.image,
                p.purchase_price,
                p.selling_price,
                p.stock_quantity,
                p.min_stock_level,
                p.status,
                p.created_at,
                sp.quantity AS stationary_quantity,
                (p.selling_price * sp.quantity) AS item_total_price
            FROM products p
            INNER JOIN stationary_products sp ON p.id = sp.product_id
            WHERE sp.stationary_id = ?
        `;

        const products = await db.prepare(query).all(stationary_id);

        const stationaryTotals = await db.prepare(`
            SELECT 
                COALESCE(SUM(sp.quantity), 0) AS total_items,
                COALESCE(SUM(p.selling_price * sp.quantity), 0) AS total_price
            FROM stationary_products sp
            JOIN products p ON sp.product_id = p.id
            WHERE sp.stationary_id = ?
        `).get(stationary_id);

        return res.status(200).json({
            stationary_id: Number(stationary_id),
            total_items: stationaryTotals.total_items,
            total_price: stationaryTotals.total_price,
            products
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const customizeStationaryForCheckout = async (req, res) => {
    try {
        const { stationary_id, excluded_product_ids, quantities } = req.body;

        if (!stationary_id) {
            return res.status(400).json({ message: "Stationery ID is required" });
        }

        const query = `
            SELECT 
                p.id,
                p.category_id,
                p.name,
                p.image,
                p.purchase_price,
                p.selling_price,
                p.stock_quantity,
                sp.quantity AS default_quantity
            FROM products p
            INNER JOIN stationary_products sp ON p.id = sp.product_id
            WHERE sp.stationary_id = ?
        `;

        const masterProducts = await db.prepare(query).all(stationary_id);

        if (!masterProducts || masterProducts.length === 0) {
            return res.status(404).json({ message: "Stationery package not found or has no products" });
        }

        const excludedSet = new Set(Array.isArray(excluded_product_ids) ? excluded_product_ids : []);
        const customQtyMap = quantities && typeof quantities === 'object' ? quantities : {};

        const finalProducts = masterProducts
            .filter(product => !excludedSet.has(product.id))
            .map(product => {
                const sessionQty = customQtyMap[product.id] !== undefined 
                    ? Number(customQtyMap[product.id]) 
                    : product.default_quantity;

                return {
                    ...product,
                    selected_quantity: sessionQty,
                    item_total_price: product.selling_price * sessionQty
                };
            })
            .filter(product => product.selected_quantity > 0);

        const sessionTotal = finalProducts.reduce((sum, item) => sum + item.item_total_price, 0);
        const sessionItemCount = finalProducts.reduce((sum, item) => sum + item.selected_quantity, 0);

        return res.status(200).json({
            stationary_id: Number(stationary_id),
            total_items: sessionItemCount,
            total_price: sessionTotal,
            products: finalProducts
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createStationary,
    getStationaryList,
    addOrUpdateStationaryProduct,
    getProductsByStationary,
    customizeStationaryForCheckout,
    getNumberOfProductsInStationary
};
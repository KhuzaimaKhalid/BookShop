const db = require('../config/connectDB');
const { put, del } = require('@vercel/blob');

const createCourse = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const result = await db.prepare('INSERT INTO course (title) VALUES (?)').run(title);

        return res.status(201).json({
            message: "Course created successfully", 
            course: { course_id: Number(result.lastInsertRowid), title }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const getCourses = async (req, res) => {
    try {
        const courses = await db.prepare('SELECT * FROM v_course_totals').all();
        return res.status(200).json({ courses });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const getNumberOfProductsInCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        const result = await db.prepare(
            'SELECT COUNT(*) AS product_count FROM course_products WHERE course_id = ?'
        ).get(id);

        return res.status(200).json({
            course_id: Number(id),
            product_count: result ? result.product_count : 0
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const addOrUpdateCourseProduct = async (req, res) => {
    try {
        const { course_id, product_id, action, quantity } = req.body;

        if (!course_id || !product_id) {
            return res.status(400).json({ message: "course_id and product_id are required" });
        }

        const existingItem = await db.prepare(
            'SELECT quantity FROM course_products WHERE course_id = ? AND product_id = ?'
        ).get(course_id, product_id);

        if (!existingItem) {
            if (action === 'decrease' || action === 'remove') {
                return res.status(400).json({ message: "Product is not linked to this course" });
            }

            const initialQty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;
            await db.prepare(
                'INSERT INTO course_products (course_id, product_id, quantity) VALUES (?, ?, ?)'
            ).run(course_id, product_id, initialQty);

            return res.status(201).json({ message: "Product added to course successfully", current_quantity: initialQty });
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
                'DELETE FROM course_products WHERE course_id = ? AND product_id = ?'
            ).run(course_id, product_id);

            return res.status(200).json({ message: "Product removed from course", current_quantity: 0 });
        }

        await db.prepare(
            'UPDATE course_products SET quantity = ? WHERE course_id = ? AND product_id = ?'
        ).run(newQty, course_id, product_id);

        return res.status(200).json({ message: "Course product quantity updated", current_quantity: newQty });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getProductsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;

        if (!course_id) {
            return res.status(400).json({ message: "Course ID is required" });
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
                cp.quantity AS course_quantity,
                (p.selling_price * cp.quantity) AS item_total_price
            FROM products p
            INNER JOIN course_products cp ON p.id = cp.product_id
            WHERE cp.course_id = ?
        `;

        const products = await db.prepare(query).all(course_id);

        const courseTotals = await db.prepare(`
            SELECT 
                COALESCE(SUM(cp.quantity), 0) AS total_items,
                COALESCE(SUM(p.selling_price * cp.quantity), 0) AS total_price
            FROM course_products cp
            JOIN products p ON cp.product_id = p.id
            WHERE cp.course_id = ?
        `).get(course_id);

        return res.status(200).json({
            course_id: Number(course_id),
            total_items: courseTotals.total_items,
            total_price: courseTotals.total_price,
            products
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const customizeCourseForCheckout = async (req, res) => {
    try {
        const { course_id, excluded_product_ids, quantities } = req.body;

        if (!course_id) {
            return res.status(400).json({ message: "Course ID is required" });
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
                cp.quantity AS default_quantity
            FROM products p
            INNER JOIN course_products cp ON p.id = cp.product_id
            WHERE cp.course_id = ?
        `;

        const masterProducts = await db.prepare(query).all(course_id);

        if (!masterProducts || masterProducts.length === 0) {
            return res.status(404).json({ message: "Course not found or has no products" });
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
            course_id: Number(course_id),
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
    createCourse,
    getCourses,
    addOrUpdateCourseProduct,
    getProductsByCourse,
    customizeCourseForCheckout,
    getNumberOfProductsInCourse
};
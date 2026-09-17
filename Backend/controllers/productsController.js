const path = require('path');
const fs = require('fs');
const db = require('../config/connectDB');
const { app: electronApp } = require('electron');

// Same baseDir logic as index.js and connectDB.js: userData when packaged,
// local `backend/images` folder in dev. This lives at
// local-server/backend/controllers/productsController.js, so `..` from here
// is local-server/backend — matching index.js's dev baseDir.
const baseDir = electronApp && electronApp.isPackaged
    ? electronApp.getPath('userData')
    : path.join(__dirname, '..');

const PRODUCTS_DIR = path.join(baseDir, 'images', 'products');
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

// Saves a multer memory-storage file to disk and returns the relative URL
// that index.js's `app.use("/images", express.static(imagesDir))` serves.
function saveProductImage(file) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    fs.writeFileSync(path.join(PRODUCTS_DIR, filename), file.buffer);
    return `/images/products/${filename}`;
}

// Deletes a previously-saved local product image, ignoring anything that
// isn't a local /images/products/... path (e.g. old Vercel URLs from before
// the migration, or a missing image).
function deleteProductImage(imageUrl) {
    if (!imageUrl || !imageUrl.startsWith('/images/products/')) return;
    const filePath = path.join(PRODUCTS_DIR, path.basename(imageUrl));
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Failed to delete old product image:', err.message);
        }
    }
}

const createProduct = async (req, res) => {
    try {
      const { category_id, name, purchase_price, selling_price, stock_quantity, min_stock_level, status } = req.body;
  
      if (!name || !purchase_price || !selling_price || !stock_quantity) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
  
      let imageUrl = null;
  
      if (req.file) {
        imageUrl = saveProductImage(req.file);
      }
  
      const sql = `
        INSERT INTO products (category_id, name, image, purchase_price, selling_price, stock_quantity, min_stock_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const info = await db.prepare(sql).run(
        category_id || null,
        name,
        imageUrl,
        purchase_price,
        selling_price,
        stock_quantity,
        min_stock_level || 0,
        status || 'Active'
      );
  
      return res.status(201).json({
        message: "Product created successfully",
        productId: Number(info.lastInsertRowid),
        image: imageUrl
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, purchase_price, selling_price, stock_quantity, min_stock_level, status } = req.body;
        if (!name || purchase_price == null || selling_price == null || stock_quantity == null || min_stock_level == null || !status || category_id == null) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        const existing = await db.prepare('SELECT image FROM products WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ message: "Product not found" });
        }
        let imageUrl = existing.image;
        if (req.file) {
            deleteProductImage(existing.image);
            imageUrl = saveProductImage(req.file);
        }
        const sql = 'UPDATE products SET name = ?, image = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?, min_stock_level = ?, status = ?, category_id = ? WHERE id = ?';
        await db.prepare(sql).run(name, imageUrl, purchase_price, selling_price, stock_quantity, min_stock_level, status, category_id, id);
        return res.status(200).json({ message: "Product updated successfully", image: imageUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await db.prepare('SELECT id FROM products WHERE id = ?').get(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await db.prepare("UPDATE products SET status = 'Inactive' WHERE id = ?").run(id);

        return res.status(200).json({ message: "Product archived successfully" });
    } catch (error) {
        console.error("Error soft deleting product:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        // Only return products whose associated category is not soft-deleted
        const sql = `
            SELECT p.* 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT p.* 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const product = await db.prepare(sql).get(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity } = req.body;
        if (stock_quantity == null) {
            return res.status(400).json({ message: "Please provide stock quantity" });
        }
        const sql = 'UPDATE products SET stock_quantity = ? WHERE id = ?';
        const result = await db.prepare(sql).run(stock_quantity, id);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getLowStockProducts = async (req, res) => {
    try {
        const sql = `
            SELECT p.* 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity < p.min_stock_level AND (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getOutOfStockProducts = async (req, res) => {
    try {
        const sql = `
            SELECT p.* 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity = 0 AND (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const sql = `
            SELECT p.* 
            FROM products p
            INNER JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const products = await db.prepare(sql).all(category_id);
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const searchProduct = async (req, res) => {
    try {
        const { name } = req.query;
        const sql = `
            SELECT p.* 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.name LIKE ? AND (c.is_delete = 0 OR c.is_delete IS NULL)
        `;
        const products = await db.prepare(sql).all(`%${name}%`);
        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts,
    getOutOfStockProducts,
    getProductsByCategory,
    searchProduct
};
const db = require('../config/connectDB');
const { put, del } = require('@vercel/blob');

const createProduct = async (req, res) => {
    try {
      const { category_id, name, purchase_price, selling_price, stock_quantity, min_stock_level, status } = req.body;
  
      if (!name || !purchase_price || !selling_price || !stock_quantity) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
  
      let imageUrl = null;
  
      if (req.file) {
        const blob = await put(`products/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        imageUrl = blob.url;
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
            if (existing.image && existing.image.includes('public.blob.vercel-storage.com')) {
                await del(existing.image);
            }
            const blob = await put(`products/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            imageUrl = blob.url;
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

const getAllProducts = async(req,res) =>{
    try {
        const sql = 'SELECT * FROM products';
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const getProductById = async(req,res) =>{
    try {
        const {id} = req.params;
        const sql = 'SELECT * FROM products WHERE id = ?';
        const product = await db.prepare(sql).get(id);
        if(!product) {
            return res.status(404).json({message: 'Product not found'});
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const updateStock = async(req,res) =>{
    try {
        const {id} = req.params;
        const {stock_quantity} = req.body;
        if (stock_quantity == null) {
            return res.status(400).json({ message: "Please provide stock quantity" });
        }
        const sql = 'UPDATE products SET stock_quantity = ? WHERE id = ?';
        const result = await db.prepare(sql).run(stock_quantity,id);
        if(result.changes === 0) {
            return res.status(404).json({message: 'Product not found'});
        }
        return res.status(200).json({message: 'Stock updated successfully'});
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const getLowStockProducts = async(req,res) =>{

    try {
        const sql = 'SELECT * FROM products WHERE stock_quantity < min_stock_level';
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const getOutOfStockProducts = async(req,res) =>{
    try {
        const sql = 'SELECT * FROM products WHERE stock_quantity = 0';
        const products = await db.prepare(sql).all();
        return res.status(200).json(products);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const getProductsByCategory = async(req,res) =>{
    try {
        const {category_id} = req.params;
        const sql = 'SELECT * FROM products WHERE category_id = ?';
        const products = await db.prepare(sql).all(category_id);
        return res.status(200).json(products);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

const searchProduct = async(req,res) =>{
    try {
        const {name} = req.query;
        const sql = 'SELECT * FROM products WHERE name LIKE ?';
        const products = await db.prepare(sql).all(`%${name}%`);
        return res.status(200).json(products);
    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Server error'});
    }
}

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
}
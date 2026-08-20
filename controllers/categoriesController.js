const db = require('../config/connectDB');
const { put, del } = require('@vercel/blob');

const createCategories = async (req, res) => {
    try {
        const { name, page_id } = req.body;

        if (!name || !req.file) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const blob = await put(`categories/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        const sql = 'INSERT INTO categories (name, image, page_id) VALUES (?, ?, ?)';
        const result = await db.prepare(sql).run(name, blob.url, page_id || null);

        return res.status(201).json({ 
            message: "Category created successfully", 
            category: {
                id: Number(result.lastInsertRowid),
                name,
                image: blob.url,
                page_id: page_id ? Number(page_id) : null
            }
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT' || error?.cause?.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: "A category with this name already exists under this page." });
        }
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, page_id } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        const existing = await db.prepare('SELECT image, page_id FROM categories WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }
        let imageUrl = existing.image;
        if (req.file) {
            if (existing.image && existing.image.includes('blob.vercel-storage.com')) {
                await del(existing.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
            const blob = await put(`categories/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
                access: 'public',
                addRandomSuffix: true
            });
            imageUrl = blob.url;
        }
        const newPageId = page_id !== undefined && page_id !== "" ? Number(page_id) : existing.page_id;
        const sql = 'UPDATE categories SET name = ?, image = ?, page_id = ? WHERE id = ?';
        const result = await db.prepare(sql).run(name, imageUrl, newPageId, id);
        if (result.changes === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({
            message: "Category updated successfully",
            category: {
                id: Number(id),
                name,
                image: imageUrl,
                page_id: newPageId
            }
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT' || error?.cause?.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: "A category with this name already exists under this page." });
        }
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const sql = 'SELECT * FROM categories'; 
        const categories = await db.prepare(sql).all();

        return res.status(200).json({ categories: categories || [] }); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message }); 
    }
};

const getCategoriesById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM categories where id = ?';
        const category = await db.prepare(sql).get(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({ category });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await db.prepare('SELECT image FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        if (category.image && category.image.includes('blob.vercel-storage.com')) {
            await del(category.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
        await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createCategories,
    getAllCategories,
    getCategoriesById,
    updateCategory,
    deleteCategory
};
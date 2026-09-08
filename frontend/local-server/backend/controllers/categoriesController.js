const db = require('../config/connectDB');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'images', 'categories');

function saveImageFile(file) {
    const filename = `${Date.now()}-${file.originalname}`;
    fs.writeFileSync(path.join(IMAGES_DIR, filename), file.buffer);
    return filename;
}

function deleteImageFile(filename) {
    if (!filename) return;
    const filePath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

const createCategories = async (req, res) => {
    try {
        const { name, page_id } = req.body;

        if (!name || !req.file) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const filename = saveImageFile(req.file);

        const sql = 'INSERT INTO categories (name, image, page_id) VALUES (?, ?, ?)';
        const result = await db.prepare(sql).run(name, filename, page_id || null);

        return res.status(201).json({ 
            message: "Category created successfully", 
            category: {
                id: Number(result.lastInsertRowid),
                name,
                image: filename,
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
        let imageFilename = existing.image;
        if (req.file) {
            deleteImageFile(existing.image);
            imageFilename = saveImageFile(req.file);
        }
        const newPageId = page_id !== undefined && page_id !== "" ? Number(page_id) : existing.page_id;
        const sql = 'UPDATE categories SET name = ?, image = ?, page_id = ? WHERE id = ?';
        const result = await db.prepare(sql).run(name, imageFilename, newPageId, id);
        if (result.changes === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({
            message: "Category updated successfully",
            category: {
                id: Number(id),
                name,
                image: imageFilename,
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
        const sql = 'SELECT * FROM categories WHERE CAST(is_delete AS INTEGER) = 0 OR is_delete IS NULL'; 
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
        const sql = 'SELECT * FROM categories WHERE id = ? AND (is_delete = 0 OR is_delete IS NULL)';
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
        const category = await db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        await db.prepare('UPDATE categories SET is_delete = 1 WHERE id = ?').run(id);
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
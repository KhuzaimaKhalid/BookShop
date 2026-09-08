const db = require('../config/connectDB');

const createPage = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        const sql = 'INSERT INTO pages (name) VALUES (?)';
        const result = await db.prepare(sql).run(name.trim());
        return res.status(201).json({ message: "Page created successfully", page: { id: Number(result.lastInsertRowid), name: name.trim() } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllPages = async (req, res) => {
    try {
        const sql = 'SELECT * FROM pages';
        const pages = await db.prepare(sql).all();
        return res.status(200).json({ pages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        const sql = 'UPDATE pages SET name = ? WHERE id = ?';
        const result = await db.prepare(sql).run(name.trim(), id);
        if (result.changes === 0) {
            return res.status(404).json({ message: "Page not found" });
        }
        return res.status(200).json({ message: "Page updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await db.prepare('SELECT id FROM pages WHERE id = ?').get(id);
        if (!page) {
            return res.status(404).json({ message: "Page not found" });
        }
        await db.prepare('DELETE FROM pages WHERE id = ?').run(id);
        return res.status(200).json({ message: "Page deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createPage,
    getAllPages,
    updatePage,
    deletePage
};
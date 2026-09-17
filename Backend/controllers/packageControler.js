const db = require('../config/connectDB');

const createPackage = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Please provide a package title" });
        }

        const result = await db.prepare(
            'INSERT INTO package (title, description) VALUES (?, ?)'
        ).run(title, description || null);

        return res.status(201).json({
            message: "Package created successfully",
            package: { package_id: Number(result.lastInsertRowid), title, description: description || null }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getPackages = async (req, res) => {
    try {
        const packages = await db.prepare(`
            SELECT
                pkg.package_id,
                pkg.title,
                pkg.description,
                pkg.created_at,
                COALESCE((SELECT COUNT(*) FROM course c WHERE c.package_id = pkg.package_id), 0) AS course_count,
                COALESCE((SELECT COUNT(*) FROM stationary s WHERE s.package_id = pkg.package_id), 0) AS stationary_count
            FROM package pkg
            ORDER BY pkg.title
        `).all();

        return res.status(200).json({ packages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Please provide a package title" });
        }

        await db.prepare('UPDATE package SET title = ?, description = ? WHERE package_id = ?')
            .run(title, description || null, id);

        return res.status(200).json({ message: "Package updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        // course/stationary rows keep existing, just get package_id = NULL (FK ON DELETE SET NULL)
        await db.prepare('DELETE FROM package WHERE package_id = ?').run(id);
        return res.status(200).json({ message: "Package deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// This is what the admin sidebar click will hit: "Matric" -> Class 11, Class 12 (courses)
// + any stationary packages tied to the same package
const getPackageContents = async (req, res) => {
    try {
        const { id } = req.params;

        const pkg = await db.prepare('SELECT * FROM package WHERE package_id = ?').get(id);
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        const courses = await db.prepare(
            'SELECT course_id, title, package_id FROM course WHERE package_id = ?'
        ).all(id);

        const stationaries = await db.prepare(
            'SELECT stationary_id, title, package_id FROM stationary WHERE package_id = ?'
        ).all(id);

        return res.status(200).json({ package: pkg, courses, stationaries });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const assignCourseToPackage = async (req, res) => {
    try {
        const { course_id, package_id } = req.body; // package_id can be null to unlink
        if (!course_id) {
            return res.status(400).json({ message: "course_id is required" });
        }
        await db.prepare('UPDATE course SET package_id = ? WHERE course_id = ?')
            .run(package_id || null, course_id);
        return res.status(200).json({ message: "Course package updated" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const assignStationaryToPackage = async (req, res) => {
    try {
        const { stationary_id, package_id } = req.body;
        if (!stationary_id) {
            return res.status(400).json({ message: "stationary_id is required" });
        }
        await db.prepare('UPDATE stationary SET package_id = ? WHERE stationary_id = ?')
            .run(package_id || null, stationary_id);
        return res.status(200).json({ message: "Stationary package updated" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// add to packageController.js
const getPackageSummary = async (req, res) => {
    try {
        const { id } = req.params;

        const pkg = await db.prepare('SELECT * FROM package WHERE package_id = ?').get(id);
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        const courses = await db.prepare(
            'SELECT * FROM v_course_totals WHERE package_id = ?'
        ).all(id);

        const stationaries = await db.prepare(
            'SELECT * FROM v_stationary_totals WHERE package_id = ?'
        ).all(id);

        return res.status(200).json({ package: pkg, courses, stationaries });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createPackage,
    getPackages,
    updatePackage,
    deletePackage,
    getPackageContents,
    getPackageSummary, // add
    assignCourseToPackage,
    assignStationaryToPackage
};
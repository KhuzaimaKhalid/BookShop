const db = require('../config/connectDB');
const { put, del } = require('@vercel/blob');


const createBusiness = async (req, res) => {
    try {
        const { name, business_id} = req.body

        if (!name) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const result = await db.prepare('INSERT INTO business (name) VALUES (?)').run(name);

        return res.status(200).json({ message: "Business name updated successfully", business: { business_id:Number(result.lastInsertRowid),name } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const getBusiness = async(req,res) =>{

    try {
        const result = await db.prepare('SELECT name, business_id FROM business ORDER BY business_id DESC LIMIT 1;').get();

        if (!result) {
            return res.status(404).json({ message: "Business not found" });
        }

        return res.status(200).json({ business: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = {
    createBusiness,
    getBusiness
}
const db = require('../config/connectDB');

const createExpense = async (req, res) => {
    try {
        const { name, amount, description, is_other } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Expense name is required" });
        }

        const expenseAmount = amount ? Number(amount) : 0;
        const expenseDesc = description !== undefined ? description : '';
        const isOtherVal = is_other ? 1 : 0;

        const result = await db.prepare(
            'INSERT INTO expenses (name, amount, description, is_other) VALUES (?, ?, ?, ?)'
        ).run(name, expenseAmount, expenseDesc, isOtherVal);

        return res.status(201).json({
            message: "Expense created successfully",
            expense: {
                id: Number(result.lastInsertRowid),
                name,
                amount: expenseAmount,
                description: expenseDesc,
                is_other: Boolean(isOtherVal)
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const expenses = await db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();

        const formattedExpenses = expenses.map(item => ({
            ...item,
            is_other: Boolean(item.is_other)
        }));

        const totalExpenseAmount = formattedExpenses.reduce((sum, item) => sum + item.amount, 0);

        return res.status(200).json({
            total_expense: totalExpenseAmount,
            expenses: formattedExpenses
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, description, is_other } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Expense ID is required" });
        }

        const existingExpense = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
        if (!existingExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const updatedName = name !== undefined ? name : existingExpense.name;
        const updatedAmount = amount !== undefined ? Number(amount) : existingExpense.amount;
        const updatedDesc = description !== undefined ? description : existingExpense.description;
        const updatedIsOther = is_other !== undefined ? (is_other ? 1 : 0) : existingExpense.is_other;

        await db.prepare(
            'UPDATE expenses SET name = ?, amount = ?, description = ?, is_other = ? WHERE id = ?'
        ).run(updatedName, updatedAmount, updatedDesc, updatedIsOther, id);

        return res.status(200).json({
            message: "Expense updated successfully",
            expense: {
                id: Number(id),
                name: updatedName,
                amount: updatedAmount,
                description: updatedDesc,
                is_other: Boolean(updatedIsOther)
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Expense ID is required" });
        }

        const result = await db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ message: "Expense not found" });
        }

        return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createExpense,
    getAllExpenses,
    updateExpense,
    deleteExpense
};
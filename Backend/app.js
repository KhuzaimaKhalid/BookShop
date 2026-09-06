const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { db, connectDB } = require('./config/connectDB.js')

const app = express()

const userRoutes = require('./routes/userRoutes.js')
const categoriesRoutes = require("./routes/categoriesRoutes.js")
const productRoutes = require("./routes/productsRoutes");
const pagesRoutes = require("./routes/pagesRoutes");
const salesRoutes = require("./routes/salesRoutes");
const returnRoutes = require("./routes/returnRoutes");
const reportRoutes = require("./routes/reportRoutes");
const businessRoutes = require("./routes/businessRoutes");
const courseRoutes = require('./routes/courseRoutes.js');
const expenseRoutes = require('./routes/expenseRouter.js');
const stationaryRoutes = require('./routes/stationaryRoutes.js');


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/user', userRoutes)
app.use("/user", userRoutes);

app.use("/api/categories", categoriesRoutes);
app.use("/categories", categoriesRoutes);

app.use("/api/product", productRoutes);
app.use("/product", productRoutes);

app.use("/api/pages", pagesRoutes);
app.use("/pages", pagesRoutes);

app.use("/api/sales", salesRoutes);
app.use("/sales", salesRoutes);

app.use("/api/return", returnRoutes);
app.use("/return", returnRoutes);

app.use("/api/report", reportRoutes);
app.use("/report", reportRoutes);

app.use("/api/business", businessRoutes);
app.use("/business", businessRoutes);

app.use("/api/courses", courseRoutes);
app.use("/course", courseRoutes);

app.use('/api/expenses', expenseRoutes);
app.use('/expense', expenseRoutes);

app.use("/api/stationary", stationaryRoutes);
app.use("/stationary", stationaryRoutes);

const PORT = process.env.PORT


app.get('/', (req,res)=>{
    res.send('Hello World!')
})

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})
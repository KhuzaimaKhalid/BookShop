const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { db, connectDB } = require('./config/connectDB.js')

const app = express()

const userRoutes = require('./routes/userRoutes.js')
const categoriesRoutes = require("./routes/categoriesROutes.js")
const productRoutes = require("./routes/productsRoutes");
const pagesRoutes = require("./routes/pagesRoutes");


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)
app.use("/user", userRoutes);

app.use("/api/categories", categoriesRoutes);
app.use("/categories", categoriesRoutes);

app.use("/api/product", productRoutes);
app.use("/product", productRoutes);

app.use("/api/pages", pagesRoutes);
app.use("/pages", pagesRoutes);

const PORT = process.env.PORT


app.get('/', (req,res)=>{
    res.send('Hello World!')
})

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})
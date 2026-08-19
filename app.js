const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { db, connectDB } = require('./config/connectDB.js')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT
connectDB();


app.get('/', (req,res)=>{
    res.send('Hello World!')
})

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})
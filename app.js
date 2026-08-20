const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { db, connectDB } = require('./config/connectDB.js')

const app = express()

const userRoutes = require('./routes/userRoutes.js')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)

const PORT = process.env.PORT


app.get('/', (req,res)=>{
    res.send('Hello World!')
})

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})
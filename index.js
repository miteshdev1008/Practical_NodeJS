const express=require('express');
const app=express();
require('dotenv').config();

const cors = require('cors');
const { connectDB } = require('./connection'); 

require('./connection');
app.use(express.json())
app.use(cors())

app.use('/v1/api/roles',require('./Routes/RoleRoute'));
app.use('/v1/api/user',require('./Routes/UserRoute'));
const port=process.env.PORT||3000;

app.listen(port,async()=>{
    await connectDB();
    console.log(`app is live on ${port}`)
})

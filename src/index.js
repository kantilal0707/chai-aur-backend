//require ('dotenv').config({path : './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
//import express from "express";
//const app = express()
//app.use(express.json())

//import { DB_NAME } from "./constants.js";

dotenv.config({
    path: './.env'
})

connectDB()
//.then(()=>{
//    app.listen (process.env.PORT || 8000, ()=>{
 //       console.log(`0 server is running ar port :${
//            process.env.PORT
//        } `);
//    })
//})
//.catch((err)=>{
//    console.log("MONGODB connection faile!!1",err)
//})

/* first method for database connection for mongodb
import express from 'express'

const app = express()

(async ()=>{
   try {
     await mongoose.connect(`{process.env.MONGODB_URL}/${DB_NAME}`)
    app.on("error", (error) =>{
        console.log("Error",error)
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
    })
   } catch (error) {
    console.log("Error", error);
    throw error;
   }
})() */
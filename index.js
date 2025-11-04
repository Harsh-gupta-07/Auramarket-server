const express = require("express")
const app = express()
const cors = require("cors")
app.use(cors())

app.get("/",(req,res)=>{
    res.status(200).send("Working")
})

const port = process.env.PORT || 10000

app.listen(port,()=>{
    console.log("Server started at " + port)
})
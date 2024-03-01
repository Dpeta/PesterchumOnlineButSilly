const express= require("express")
const app =express()

//app.use('/static',express.static(__dirname))
app.get('/' ,(req,res)=>{res.send("hi")})

app.listen(3001, console.log("server on 3001"))

require("dotenv").config()

const app = require("./src/app")
const connectTodb = require("./src/config/db")

connectTodb();



app.listen(3000,()=>{
    console.log("server is live on port 3000")
})


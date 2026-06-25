const mongoose = require("mongoose")

async function connectTodb(){
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("server is connected to db")
    })
    .catch(err=>{
        console.log("Error connecting to DB")
        process.exit(1) //server band ho jaega if connect ni hua
    })
}

module.exports = connectTodb;
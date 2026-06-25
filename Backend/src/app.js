const express = require("express");
const cookieParser = require("cookie-parser")
const app = express();

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("../src/routes/transaction.routes")


app.use(express.json())
app.use(cookieParser())

// all auth related routes
app.use("/api/auth",authRouter)

// account related routes
app.use("/api/accounts",accountRouter)


app.use("/api/transactions",transactionRoutes)
module.exports = app 
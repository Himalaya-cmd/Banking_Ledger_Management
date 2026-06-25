const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")
const transactionRoutes = Router();

/**
 * -POST /api/transaction
 * -Create a new transaction
 */

transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

/**
 * -POST /api/transaction/system/initial-funds
 * -Create a new transaction for system initial funds
 */

transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createSystemInitialFunds)
module.exports = transactionRoutes;
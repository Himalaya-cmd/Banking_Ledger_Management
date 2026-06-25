const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")
/**
 * - Create a new transaction
 * THE 10 STEP FLOW
 *      *1. Validate request
 *      *2. Validate idempotency key
 *      *3. Check Account status
 *      *4. Derive sender balance from ledger
 *      *5. Create transaction (PENDING
 *      *6. Create DEBIT ledger entry
 *      *7. Mark transaction COMPLETED
 *      *9. Commit MongoDB session
 *      *10. Send email notif
 */

async function createTransaction(req,res){

    const{ fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "Data Missing"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    const isTransactionExists = await transactionModel.findOne({
        idempotencyKey
    })

    if(isTransactionExists){
        if(isTransactionExists.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction already completed",
                transaction: isTransactionExists
            })
        }
        if(isTransactionExists.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction is still pending",
                transaction: isTransactionExists
            })
        }
        if(isTransactionExists.status === "FAILED"){
            return res.status(500).json({
                message: "Transaction has failed"
            })
        }
        if(isTransactionExists.status === "REVERSED"){
            return res.status(500).json({
                message: "Transaction has been reversed"
            })
        }
    }

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message: "Both accounts must be active to perform a transaction"
        })
    }

    const fromUserBalance = await fromUserAccount.getBalance()

    if(fromUserBalance < amount){
        return res.status(400).json({
            message: `Insufficient balance in the sender's account. Current balance: ${fromUserBalance}`
        })
    }

    /**
     * 5. Create transaction (PENDING)
     */

    const session = await mongoose.startSession()
    session.startTransaction() 

    const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        type: "DEBIT",
        amount,
        transaction: transaction._id
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        type: "CREDIT",
        amount,
        transaction: transaction._id
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Transaction completed",
        amount: amount
    })

    /**
     * 10. Send email notif
     */
    const fromUser = await accountModel.findById(fromAccount).populate("user")
    const toUser = await accountModel.findById(toAccount).populate("user")

    const transactionDetails = `Transaction ID: ${transaction._id}\nFrom Account: ${fromAccount}\nTo Account: ${toAccount}\nAmount: ${amount}\nStatus: ${transaction.status}`;

   // await emailService.sendTransactionEmail(fromUser.user.email, fromUser.user.name, transactionDetails);
   // await emailService.sendTransactionEmail(toUser.user.email, toUser.user.name, transactionDetails);

}

async function createSystemInitialFunds(req,res){

    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}
module.exports = {
    createSystemInitialFunds,
    createTransaction
}
const accountModel = require("../models/account.model")


async function createAccountController(req,res){
    const user = req.user

    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        account
    })
}

async function getAllAccountsController(req,res){
    const user = req.user

    const accounts = await accountModel.find({user: user._id})

    res.status(200).json({
        message: "Accounts fetched successfully",
        accounts
    })
}

async function getBalanceController(req,res){
    const {accountId} = req.params

    const accExists = await accountModel.findOne({_id:accountId, user: req.user._id})

    if(!accExists){
        return res.status(404).json({
            message: "Account does not exists. "
        })
    }

    const balance = await accExists.getBalance()

    return res.status(200).json({
        message: "Balance fetched successfully",
        balance: balance
    })

}

module.exports = {
    createAccountController,
    getAllAccountsController,
    getBalanceController
}
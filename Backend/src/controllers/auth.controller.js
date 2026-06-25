const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const blacklistModel = require("../models/blacklist.model")

async function userRegister(req,res){
    const {name,email,password} = req.body

    const isExists = await userModel.findOne({email})

    if(isExists){
        return res.status(422).json({
            message : "user already exists",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email,password,name
    })

    const token = jwt.sign({
        userId : user._id
    },process.env.JWT_SECRET,
    {
        expiresIn : "3d"
    })

    res.cookie("token",token)

    res.status(201).json({
        user: {
            _id:user._id,
            email:user.email,
            name:user.name
        },
        message : "User created successfully"  
    })

    await emailService.sendRegistrationEmail(user.email,user.name)
}

async function login(req,res){
    const{email,password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message : "Email or password is invalid"
        })
    }

    const isValid = user.comparePassword(password)

    if(!isValid) {
        return res.status(401).json({
            message : "Email or password is invalid"
        })
    }

    const token = jwt.sign({
        userId : user._id
    },process.env.JWT_SECRET,
    {
        expiresIn : "3d"
    })

    res.cookie("token",token)

    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        message : "User Logged In successfully"  
    })
}

async function logoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(400).json({
            message: "Already logged out"
        })
    }

    res.clearCookie('token');

    await blacklistModel.create({token})

    res.status(200).json({
        message: "User logged Out"
    })
}

module.exports = {
    userRegister,
    login,
    logoutController
}
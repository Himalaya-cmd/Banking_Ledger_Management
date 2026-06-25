const express = require("express");
const authController = require("../controllers/auth.controller")

const router = express.Router()

router.post("/register",authController.userRegister)

router.post("/login",authController.login)

router.post("/logout",authController.logoutController)
module.exports = router
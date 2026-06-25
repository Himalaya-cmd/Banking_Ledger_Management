const mongoose = require("mongoose")

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to blacklist"],
        unique: [true, "Token should be unique"]
    }
},{
    timestamps: true
})

blacklistSchema.index({createdAt: 1},{
    expiredAfterSeconds: 60*60*24*3 //3days
})

const blacklistModel = new mongoose.model("blacklist",blacklistSchema)

module.exports = blacklistModel
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
    certificateId :{
        type: String,
    },
    mainOwner: {
        type:String,
    },
    totalArea: Number,
    numberofTokens: Number,
    certificateHash: String,
    tokenIds:[String]
});

module.exports = mongoose.model("Certificate",certificateSchema);
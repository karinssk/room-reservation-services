const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ["omise", "stripe"],
            default: "omise",
            index: true,
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PaymentSetting", paymentSettingSchema);

const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        href: { type: String, required: true },
        children: { type: [Object], default: [] },
    },
    { _id: false }
);

const menuSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        items: { type: [menuItemSchema], default: [] },
        cta: {
            label: { type: String, default: "Book Appointment" },
            href: { type: String, default: "#booking" },
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Menu", menuSchema);

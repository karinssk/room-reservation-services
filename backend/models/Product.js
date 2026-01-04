const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        code: { type: String, default: "" },
        btu: { type: String, default: "" },
        status: { type: String, default: "draft", index: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductCategory",
            default: null,
        },
        description: { type: Object, default: {} },
        features: { type: Map, of: String, default: {} },
        highlights: { type: [String], default: [] },
        warranty: {
            device: { type: String, default: "" },
            compressor: { type: String, default: "" },
        },
        inBox: { type: [String], default: [] },
        price: {
            device: { type: Number, default: 0 },
            installation: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        images: { type: [String], default: [] },
        seo: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            image: { type: String, default: "" },
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Product", productSchema);

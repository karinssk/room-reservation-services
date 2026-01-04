const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceCategory",
            default: null,
        },
        price: { type: String, default: "" },
        shortDescription: { type: String, default: "" },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        coverImage: { type: String, default: "" },
        gallery: { type: [String], default: [] },
        videos: { type: [String], default: [] },
        content: { type: Object, default: {} },
        seo: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            image: { type: String, default: "" },
        },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Service", serviceSchema);

const mongoose = require("mongoose");

const pageBlockSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        props: { type: Object, default: {} },
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        seo: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            image: { type: String, default: "" },
        },
        theme: {
            background: { type: String, default: "" },
        },
        layout: { type: [pageBlockSchema], default: [] },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Page", pageSchema);

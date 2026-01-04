const express = require("express");
const router = express.Router();
const Page = require("../models/Page");

router.get("/", async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    const pages = await Page.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({
        pages: pages.map((page) => ({
            id: page._id,
            title: page.title,
            slug: page.slug,
            status: page.status,
            updatedAt: page.updatedAt,
        })),
    });
});

router.get("/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const query = { slug: req.params.slug };
    if (!preview) {
        query.status = "published";
    }
    const page = await Page.findOne(query).lean();
    if (!page) {
        return res.status(404).json({ error: "Page not found" });
    }
    res.json({ page: { ...page, id: page._id } });
});

module.exports = router;

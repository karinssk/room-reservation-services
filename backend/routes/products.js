const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const ProductCategory = require("../models/ProductCategory");
const { normalizeUploadPath, normalizeUploadsDeep } = require("../utils/helpers");

// Categories
router.get("/product-categories", async (_req, res) => {
    const categories = await ProductCategory.find({})
        .sort({ order: 1, name: 1 })
        .lean();
    res.json({
        categories: categories.map((c) => ({
            id: c._id,
            name: c.name,
            slug: c.slug,
            logo: c.logo,
            order: c.order,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })),
    });
});

router.post("/product-categories", async (req, res) => {
    try {
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            logo: req.body?.logo || "",
            order: req.body?.order || 0,
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const category = await ProductCategory.create(payload);
        res.json({ category: { ...category.toObject(), id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create category" });
    }
});

router.put("/product-categories/:id", async (req, res) => {
    try {
        const category = await ProductCategory.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: req.body?.name,
                    slug: req.body?.slug,
                    logo: req.body?.logo || "",
                    order: req.body?.order || 0,
                },
            },
            { new: true }
        ).lean();
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json({ category: { ...category, id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to update category" });
    }
});

router.delete("/product-categories/:id", async (req, res) => {
    const category = await ProductCategory.findByIdAndDelete(req.params.id).lean();
    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }
    await Product.updateMany(
        { categoryId: category._id },
        { $set: { categoryId: null } }
    );
    res.json({ ok: true });
});

// Products
router.get("/products", async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.q) {
        const term = String(req.query.q).trim();
        if (term) {
            filter.$or = [
                { name: { $regex: term, $options: "i" } },
                { code: { $regex: term, $options: "i" } },
            ];
        }
    }
    if (req.query.category) {
        const categorySlug = String(req.query.category);
        if (categorySlug !== "all") {
            const category = await ProductCategory.findOne({ slug: categorySlug }).lean();
            if (category) {
                filter.categoryId = category._id;
            } else {
                return res.json({ products: [] });
            }
        }
    }
    const products = await Product.find(filter)
        .populate("categoryId")
        .sort({ updatedAt: -1 })
        .lean();

    res.json({
        products: products.map((p) => ({
            id: p._id,
            name: p.name,
            slug: p.slug,
            code: p.code,
            btu: p.btu,
            status: p.status,
            category: p.categoryId
                ? { id: p.categoryId._id, name: p.categoryId.name, slug: p.categoryId.slug }
                : null,
            price: p.price,
            images: p.images,
            updatedAt: p.updatedAt,
        })),
    });
});

router.get("/products/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const query = { slug: req.params.slug };
    if (!preview) {
        query.status = "published";
    }
    const p = await Product.findOne(query).populate("categoryId").lean();
    if (!p) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json({
        product: {
            ...p,
            id: p._id,
            category: p.categoryId
                ? { id: p.categoryId._id, name: p.categoryId.name, slug: p.categoryId.slug }
                : null,
        },
    });
});

router.post("/products", async (req, res) => {
    try {
        const status = req.body?.status || "draft";
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            code: req.body?.code || "",
            btu: req.body?.btu || "",
            status,
            categoryId: req.body?.categoryId || null,
            description: req.body?.description || {},
            features: req.body?.features || {},
            highlights: req.body?.highlights || [],
            warranty: req.body?.warranty || { device: "", compressor: "" },
            inBox: req.body?.inBox || [],
            price: req.body?.price || { device: 0, installation: 0, total: 0 },
            images: Array.isArray(req.body?.images)
                ? req.body.images.map((item) => normalizeUploadPath(item))
                : [],
            seo: req.body?.seo || { title: "", description: "", image: "" },
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const product = await Product.create(payload);
        res.json({ product: { ...product.toObject(), id: product._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create product" });
    }
});

router.put("/products/:id", async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.images) {
            updates.images = normalizeUploadsDeep(updates.images);
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).lean();
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ product: { ...product, id: product._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to update product" });
    }
});

router.delete("/products/:id", async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true });
});

module.exports = router;

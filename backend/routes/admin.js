const express = require("express");
const router = express.Router();
const AdminUser = require("../models/AdminUser");
const { requireAdmin, requireOwner } = require("../utils/auth");

router.get("/users", requireAdmin, requireOwner, async (_req, res) => {
    const users = await AdminUser.find({})
        .sort({ createdAt: -1 })
        .lean();
    res.json({
        users: users.map((user) => ({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            provider: user.provider,
            createdAt: user.createdAt,
        })),
    });
});

router.post("/users/:id/approve", requireAdmin, requireOwner, async (req, res) => {
    const user = await AdminUser.findByIdAndUpdate(
        req.params.id,
        { $set: { status: "approved" } },
        { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: user._id, status: user.status } });
});

router.post("/users/:id/reject", requireAdmin, requireOwner, async (req, res) => {
    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

module.exports = router;

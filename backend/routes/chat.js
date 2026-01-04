const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const ChatSession = require("../models/ChatSession");
const { nowDate, retentionDate, normalizeBaseUrl } = require("../utils/helpers");

// Helpers for chat (duplicated from index or extracted? Need to ensure socket can use them too if needed)
// For now, I'm defining them here or using utils.
// access to io?
// The REST endpoints emit socket events.
// I need `io` instance.
// I'll create the router as a function that accepts `io` and `adminPresence`.

const toPublicSession = (session) => ({
    id: session.sessionId,
    visitorId: session.visitorId,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt ? session.createdAt.toISOString() : null,
    lastMessageAt: session.lastMessageAt ? session.lastMessageAt.toISOString() : null,
    messageCount: session.messages?.length || 0,
});

module.exports = (io, adminPresence) => {
    const emitSessionUpdate = (session) => {
        const payload = toPublicSession(session);
        io.to("admins").emit("sessionUpdated", payload);
    };

    router.post("/session", async (req, res) => {
        const visitorId = req.body?.visitorId || `visitor_${randomUUID()}`;
        const sessionId = randomUUID();
        const createdAt = nowDate();
        const session = new ChatSession({
            sessionId,
            visitorId,
            status: "open",
            assignedAdminId: null,
            createdAt,
            lastMessageAt: null,
            expiresAt: retentionDate(createdAt),
            messages: [],
        });

        await session.save();
        emitSessionUpdate(session);

        res.status(201).json({ sessionId, visitorId });
    });

    router.get("/sessions", async (_req, res) => {
        const sessions = await ChatSession.find({}).lean();
        const sorted = sessions
            .map(toPublicSession)
            .sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
        res.json({ sessions: sorted });
    });

    router.post("/sessions/:id/assign", async (req, res) => {
        const force = Boolean(req.body?.force);
        const adminId = req.body?.adminId || null;
        let finalAdminId = adminId;

        if (!finalAdminId) {
            const admins = Array.from(adminPresence.entries());
            if (admins.length === 0) {
                return res.status(409).json({ error: "No admin available" });
            }
            admins.sort((a, b) => a[1].size - b[1].size);
            finalAdminId = admins[0][0];
        }

        const session = await ChatSession.findOne({ sessionId: req.params.id });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.assignedAdminId && session.assignedAdminId !== finalAdminId) {
            if (!force) {
                return res.status(409).json({ error: "Session already assigned" });
            }
        }

        session.assignedAdminId = finalAdminId;
        session.status = "assigned";
        session.expiresAt = retentionDate(new Date());
        await session.save();

        emitSessionUpdate(session);
        res.json({ session: toPublicSession(session) });
    });

    router.get("/sessions/:id/messages", async (req, res) => {
        const session = await ChatSession.findOne({ sessionId: req.params.id }).lean();
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json({ messages: session.messages || [] });
    });

    router.post("/sessions/:id/messages", async (req, res) => {
        const { sender, text } = req.body || {};
        if (!text) {
            return res.status(400).json({ error: "Missing text" });
        }

        const message = {
            id: randomUUID(),
            sessionId: req.params.id,
            sender: sender || "visitor",
            text,
            createdAt: nowDate(),
        };

        const session = await ChatSession.findOneAndUpdate(
            { sessionId: req.params.id },
            {
                $push: { messages: message },
                $set: {
                    lastMessageAt: message.createdAt,
                    expiresAt: retentionDate(message.createdAt),
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        io.to(`session:${session.sessionId}`).emit("message", message);
        emitSessionUpdate(session);

        res.status(201).json({ message });
    });

    return router;
};

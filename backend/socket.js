const { randomUUID } = require("crypto");
const { nowDate, retentionDate } = require("./utils/helpers");
const ChatSession = require("./models/ChatSession");

const toPublicSession = (session) => ({
    id: session.sessionId,
    visitorId: session.visitorId,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt ? session.createdAt.toISOString() : null,
    lastMessageAt: session.lastMessageAt ? session.lastMessageAt.toISOString() : null,
    messageCount: session.messages?.length || 0,
});

const emitSessionUpdate = (io, session) => {
    const payload = toPublicSession(session);
    io.to("admins").emit("sessionUpdated", payload);
};

const initSocket = (io, adminPresence) => {
    io.on("connection", (socket) => {
        const auth = socket.handshake.auth || {};
        const role = auth.role || "visitor";
        const adminId = auth.adminId || null;

        if (role === "admin" && adminId) {
            socket.join("admins");
            if (!adminPresence.has(adminId)) {
                adminPresence.set(adminId, new Set());
            }
        }

        if (role === "visitor" && auth.sessionId) {
            socket.join(`session:${auth.sessionId}`);
        }

        socket.on("joinSession", ({ sessionId } = {}) => {
            if (!sessionId) return;
            socket.join(`session:${sessionId}`);
            if (role === "admin" && adminId) {
                adminPresence.get(adminId)?.add(sessionId);
            }
        });

        socket.on("leaveSession", ({ sessionId } = {}) => {
            if (!sessionId) return;
            socket.leave(`session:${sessionId}`);
            if (role === "admin" && adminId) {
                adminPresence.get(adminId)?.delete(sessionId);
            }
        });

        socket.on("message", async ({ sessionId, sender, text } = {}) => {
            if (!sessionId || !text) return;

            const message = {
                id: randomUUID(),
                sessionId,
                sender: sender || (role === "admin" ? "admin" : "visitor"),
                text,
                createdAt: nowDate(),
            };

            const session = await ChatSession.findOneAndUpdate(
                { sessionId },
                {
                    $push: { messages: message },
                    $set: {
                        lastMessageAt: message.createdAt,
                        expiresAt: retentionDate(message.createdAt),
                    },
                },
                { new: true }
            );

            if (!session) return;

            io.to(`session:${sessionId}`).emit("message", message);
            emitSessionUpdate(io, session);
        });

        socket.on("disconnect", () => {
            if (role === "admin" && adminId) {
                adminPresence.delete(adminId);
            }
        });
    });
};

module.exports = initSocket;

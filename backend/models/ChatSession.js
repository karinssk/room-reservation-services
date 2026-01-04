const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        sessionId: { type: String, required: true },
        sender: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, required: true },
    },
    { _id: false }
);

const sessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        visitorId: { type: String, required: true },
        status: { type: String, default: "open", index: true },
        assignedAdminId: { type: String, default: null, index: true },
        createdAt: { type: Date, required: true },
        lastMessageAt: { type: Date, default: null, index: true },
        expiresAt: { type: Date, index: { expires: 0 } },
        messages: { type: [messageSchema], default: [] },
    },
    { versionKey: false }
);

module.exports = mongoose.model("ChatSession", sessionSchema);

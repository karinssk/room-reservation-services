const express = require("express");
const https = require("https");
const dns = require("dns");
const router = express.Router();
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const IndividualRoom = require("../models/IndividualRoom");
const PaymentSetting = require("../models/PaymentSetting");
const { resolveBaseUrl } = require("../utils/helpers");
const { sendBookingConfirmation } = require("../utils/emailService");

const FRONTEND_URL = resolveBaseUrl(
    "FRONTEND_PRODUCTION_URL",
    "FRONTEND_DEVELOPMENT_URL"
);

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const OMISE_API_BASE = "https://api.omise.co";

const requestOmise = ({ method, path, authHeader, body }) =>
    new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: "api.omise.co",
                path,
                method,
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/x-www-form-urlencoded",
                    ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
                },
                timeout: 20000,
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    const statusCode = res.statusCode || 500;
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({
                            ok: statusCode >= 200 && statusCode < 300,
                            statusCode,
                            data: parsed,
                        });
                    } catch (error) {
                        resolve({
                            ok: false,
                            statusCode,
                            data: { message: "Invalid JSON response" },
                        });
                    }
                });
            }
        );

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy(new Error("Omise request timeout"));
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });

const serializeParams = (params) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            value.forEach((item) => search.append(key, String(item)));
            return;
        }
        search.append(key, String(value));
    });
    return search;
};

const buildFrontendUrl = (path) => {
    if (!FRONTEND_URL) return path;
    return `${FRONTEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const ensurePaymentSetting = async () => {
    let setting = await PaymentSetting.findOne().lean();
    if (!setting) {
        setting = await PaymentSetting.create({ provider: "omise" });
    }
    return setting;
};

const finalizeBookingPayment = async (booking, paymentInfo) => {
    if (!booking || booking.paymentStatus === "paid") {
        return { alreadyPaid: true };
    }

    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.paymentMethod = paymentInfo.method || booking.paymentMethod || "";
    booking.paymentProvider = paymentInfo.provider || booking.paymentProvider || "";
    booking.paymentReference = paymentInfo.reference || booking.paymentReference || "";
    await booking.save();

    const room = await Room.findById(booking.roomTypeId).lean();
    const individualRoom = booking.individualRoomId
        ? await IndividualRoom.findById(booking.individualRoomId).lean()
        : null;

    if (room) {
        await sendBookingConfirmation(booking.toObject(), room, individualRoom);
    }

    return { alreadyPaid: false };
};

router.get("/payment-setting", async (_req, res) => {
    try {
        console.log("[payments] GET /payment-setting");
        const setting = await ensurePaymentSetting();
        res.json({ setting: { provider: setting.provider } });
    } catch (error) {
        console.error("[payments] Failed to fetch payment setting:", error);
        res.status(500).json({ error: "Failed to fetch payment setting" });
    }
});

router.put("/payment-setting", async (req, res) => {
    try {
        console.log("[payments] PUT /payment-setting", { provider: req.body?.provider });
        const provider = String(req.body?.provider || "").toLowerCase();
        if (!["omise", "stripe"].includes(provider)) {
            return res.status(400).json({ error: "Invalid payment provider" });
        }
        const setting = await PaymentSetting.findOneAndUpdate(
            {},
            { $set: { provider } },
            { new: true, upsert: true }
        ).lean();
        res.json({ setting: { provider: setting.provider } });
    } catch (error) {
        res.status(500).json({ error: "Failed to update payment setting" });
    }
});

router.post("/payments/stripe/create-session", async (req, res) => {
    try {
        console.log("[payments] POST /payments/stripe/create-session", {
            bookingNumber: req.body?.bookingNumber,
        });
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            return res.status(400).json({ error: "Stripe secret key missing" });
        }

        const bookingNumber = req.body?.bookingNumber;
        const locale = req.body?.locale || "en";
        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0) * 100));
        const successUrl = buildFrontendUrl(
            `/${locale}/payment/stripe/return?bookingNumber=${bookingNumber}&session_id={CHECKOUT_SESSION_ID}`
        );
        const cancelUrl = buildFrontendUrl(
            `/${locale}/checkout?bookingNumber=${bookingNumber}&canceled=1`
        );

        const params = serializeParams({
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: booking.guestEmail,
            "line_items[0][price_data][currency]": "thb",
            "line_items[0][price_data][unit_amount]": amount,
            "line_items[0][price_data][product_data][name]": "Room booking",
            "line_items[0][quantity]": 1,
            "payment_method_types[]": ["card", "promptpay"],
            "metadata[bookingNumber]": bookingNumber,
        });

        const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeSecret}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const session = await response.json();
        if (!response.ok) {
            console.error("[payments] Stripe session error:", session);
            return res.status(400).json({ error: session.error?.message || "Stripe error" });
        }

        booking.paymentProvider = "stripe";
        booking.paymentMethod = "stripe_checkout";
        booking.paymentReference = session.id || "";
        await booking.save();

        console.log("[payments] Stripe session created", {
            bookingNumber,
            sessionId: session.id,
        });
        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error("[payments] Failed to create Stripe session:", error);
        res.status(500).json({ error: "Failed to create Stripe session" });
    }
});

router.post("/payments/stripe/confirm", async (req, res) => {
    try {
        console.log("[payments] POST /payments/stripe/confirm", {
            sessionId: req.body?.sessionId,
            bookingNumber: req.body?.bookingNumber,
        });
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            return res.status(400).json({ error: "Stripe secret key missing" });
        }

        const sessionId = req.body?.sessionId;
        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${stripeSecret}` },
        });
        const session = await response.json();
        if (!response.ok) {
            console.error("[payments] Stripe confirm error:", session);
            return res.status(400).json({ error: session.error?.message || "Stripe error" });
        }

        if (session.payment_status !== "paid") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        const bookingNumber = session.metadata?.bookingNumber || req.body?.bookingNumber;
        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        await finalizeBookingPayment(booking, {
            provider: "stripe",
            method: "stripe_checkout",
            reference: sessionId,
        });

        console.log("[payments] Stripe payment confirmed", {
            bookingNumber,
            sessionId,
        });
        res.json({ ok: true, bookingNumber });
    } catch (error) {
        console.error("[payments] Failed to confirm Stripe payment:", error);
        res.status(500).json({ error: "Failed to confirm Stripe payment" });
    }
});

router.post("/payments/omise/create", async (req, res) => {
    try {
        console.log("[payments] POST /payments/omise/create", {
            bookingNumber: req.body?.bookingNumber,
            sourceType: req.body?.sourceType,
            hasCardToken: Boolean(req.body?.cardToken),
        });
        const omiseSecret = process.env.OMISE_SECRET_KEY;
        if (!omiseSecret) {
            return res.status(400).json({ error: "Omise secret key missing" });
        }

        const bookingNumber = req.body?.bookingNumber;
        const locale = req.body?.locale || "en";
        const sourceType = req.body?.sourceType;
        const cardToken = req.body?.cardToken;

        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0) * 100));
        const returnUri = buildFrontendUrl(
            `/${locale}/payment/omise/return?bookingNumber=${bookingNumber}`
        );

        const authHeader = `Basic ${Buffer.from(`${omiseSecret}:`).toString("base64")}`;

        let chargePayload = {
            amount,
            currency: "thb",
            return_uri: returnUri,
            "metadata[bookingNumber]": bookingNumber,
        };

        if (cardToken) {
            chargePayload.card = cardToken;
        } else if (sourceType) {
            const sourceParams = serializeParams({
                amount,
                currency: "thb",
                type: sourceType,
            });
            const sourceResult = await requestOmise({
                method: "POST",
                path: "/sources",
                authHeader,
                body: sourceParams.toString(),
            });
            const source = sourceResult.data;
            if (!sourceResult.ok) {
                console.error("[payments] Omise source error:", source);
                return res.status(400).json({ error: source.message || "Failed to create source" });
            }
            chargePayload.source = source.id;
        } else {
            return res.status(400).json({ error: "Payment method is required" });
        }

        const chargeParams = serializeParams(chargePayload);
        const chargeResult = await requestOmise({
            method: "POST",
            path: "/charges",
            authHeader,
            body: chargeParams.toString(),
        });
        const charge = chargeResult.data;
        if (!chargeResult.ok) {
            console.error("[payments] Omise charge error:", charge);
            return res.status(400).json({ error: charge.message || "Failed to create charge" });
        }

        const methodLabel = cardToken
            ? "omise_card"
            : `omise_${sourceType}`;

        booking.paymentProvider = "omise";
        booking.paymentMethod = methodLabel;
        booking.paymentReference = charge.id || "";
        await booking.save();

        console.log("[payments] Omise charge created", {
            bookingNumber,
            chargeId: charge.id,
            status: charge.status,
        });
        res.json({
            chargeId: charge.id,
            authorizeUri: charge.authorize_uri || null,
            status: charge.status,
        });
    } catch (error) {
        console.error("[payments] Failed to create Omise charge:", error);
        res.status(500).json({ error: "Failed to create Omise charge" });
    }
});

router.post("/payments/omise/promptpay", async (req, res) => {
    try {
        console.log("[payments] POST /payments/omise/promptpay", {
            bookingNumber: req.body?.bookingNumber,
        });
        const omiseSecret = process.env.OMISE_SECRET_KEY;
        if (!omiseSecret) {
            return res.status(400).json({ error: "Omise secret key missing" });
        }

        const bookingNumber = req.body?.bookingNumber;
        if (!bookingNumber) {
            return res.status(400).json({ error: "Booking number is required" });
        }

        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0) * 100));
        const authHeader = `Basic ${Buffer.from(`${omiseSecret}:`).toString("base64")}`;

        const sourceParams = serializeParams({
            amount,
            currency: "thb",
            type: "promptpay",
        });
        const sourceResult = await requestOmise({
            method: "POST",
            path: "/sources",
            authHeader,
            body: sourceParams.toString(),
        });
        const source = sourceResult.data;
        if (!sourceResult.ok) {
            console.error("[payments] Omise promptpay source error:", source);
            return res.status(400).json({ error: source.message || "Failed to create source" });
        }

        const chargeParams = serializeParams({
            amount,
            currency: "thb",
            source: source.id,
            "metadata[bookingNumber]": bookingNumber,
        });
        const chargeResult = await requestOmise({
            method: "POST",
            path: "/charges",
            authHeader,
            body: chargeParams.toString(),
        });
        const charge = chargeResult.data;
        if (!chargeResult.ok) {
            console.error("[payments] Omise promptpay charge error:", charge);
            return res.status(400).json({ error: charge.message || "Failed to create charge" });
        }

        booking.paymentProvider = "omise";
        booking.paymentMethod = "omise_promptpay";
        booking.paymentReference = charge.id || "";
        await booking.save();

        res.json({
            chargeId: charge.id,
            qrImageUrl: charge.source?.scannable_code?.image?.download_uri || "",
            status: charge.status,
        });
    } catch (error) {
        console.error("[payments] Failed to create PromptPay charge:", error);
        res.status(500).json({ error: "Failed to create PromptPay charge" });
    }
});

router.post("/payments/omise/mobile-banking", async (req, res) => {
    try {
        console.log("[payments] POST /payments/omise/mobile-banking", {
            bookingNumber: req.body?.bookingNumber,
            sourceType: req.body?.sourceType,
        });
        const omiseSecret = process.env.OMISE_SECRET_KEY;
        if (!omiseSecret) {
            return res.status(400).json({ error: "Omise secret key missing" });
        }

        const bookingNumber = req.body?.bookingNumber;
        const sourceType = req.body?.sourceType;
        if (!bookingNumber || !sourceType) {
            return res.status(400).json({ error: "Booking number and source type are required" });
        }

        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0) * 100));
        const authHeader = `Basic ${Buffer.from(`${omiseSecret}:`).toString("base64")}`;

        const sourceParams = serializeParams({
            amount,
            currency: "thb",
            type: sourceType,
        });
        const sourceResult = await requestOmise({
            method: "POST",
            path: "/sources",
            authHeader,
            body: sourceParams.toString(),
        });
        const source = sourceResult.data;
        if (!sourceResult.ok) {
            console.error("[payments] Omise mobile banking source error:", source);
            return res.status(400).json({ error: source.message || "Failed to create source" });
        }

        const chargeParams = serializeParams({
            amount,
            currency: "thb",
            source: source.id,
            "metadata[bookingNumber]": bookingNumber,
        });
        const chargeResult = await requestOmise({
            method: "POST",
            path: "/charges",
            authHeader,
            body: chargeParams.toString(),
        });
        const charge = chargeResult.data;
        if (!chargeResult.ok) {
            console.error("[payments] Omise mobile banking charge error:", charge);
            return res.status(400).json({ error: charge.message || "Failed to create charge" });
        }

        booking.paymentProvider = "omise";
        booking.paymentMethod = `omise_${sourceType}`;
        booking.paymentReference = charge.id || "";
        await booking.save();

        res.json({
            chargeId: charge.id,
            authorizeUri: charge.authorize_uri || null,
            status: charge.status,
        });
    } catch (error) {
        console.error("[payments] Failed to create mobile banking charge:", error);
        res.status(500).json({ error: "Failed to create mobile banking charge" });
    }
});

router.get("/payments/omise/status/:chargeId", async (req, res) => {
    try {
        console.log("[payments] GET /payments/omise/status", {
            chargeId: req.params.chargeId,
        });
        const omiseSecret = process.env.OMISE_SECRET_KEY;
        if (!omiseSecret) {
            return res.status(400).json({ error: "Omise secret key missing" });
        }

        const chargeId = req.params.chargeId;
        const authHeader = `Basic ${Buffer.from(`${omiseSecret}:`).toString("base64")}`;
        const chargeResult = await requestOmise({
            method: "GET",
            path: `/charges/${chargeId}`,
            authHeader,
        });
        if (!chargeResult.ok) {
            console.error("[payments] Omise status error:", chargeResult.data);
            return res.status(400).json({ error: chargeResult.data?.message || "Failed to fetch charge" });
        }

        res.json({ charge: chargeResult.data });
    } catch (error) {
        console.error("[payments] Failed to fetch charge status:", error);
        res.status(500).json({ error: "Failed to fetch charge status" });
    }
});

router.post("/payments/omise/confirm", async (req, res) => {
    try {
        console.log("[payments] POST /payments/omise/confirm", {
            bookingNumber: req.body?.bookingNumber,
            chargeId: req.body?.chargeId,
        });
        const omiseSecret = process.env.OMISE_SECRET_KEY;
        if (!omiseSecret) {
            return res.status(400).json({ error: "Omise secret key missing" });
        }

        const bookingNumber = req.body?.bookingNumber;
        if (!bookingNumber) {
            return res.status(400).json({ error: "Booking number is required" });
        }

        const booking = await Booking.findOne({ bookingNumber });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const chargeId = req.body?.chargeId || booking.paymentReference;
        if (!chargeId) {
            return res.status(400).json({ error: "Charge ID is required" });
        }

        const authHeader = `Basic ${Buffer.from(`${omiseSecret}:`).toString("base64")}`;
        const chargeResult = await requestOmise({
            method: "GET",
            path: `/charges/${chargeId}`,
            authHeader,
        });
        const charge = chargeResult.data;
        if (!chargeResult.ok) {
            console.error("[payments] Omise fetch charge error:", charge);
            return res.status(400).json({ error: charge.message || "Failed to fetch charge" });
        }

        if (!charge.paid && charge.status !== "successful") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        await finalizeBookingPayment(booking, {
            provider: "omise",
            method: booking.paymentMethod || "omise",
            reference: chargeId,
        });

        console.log("[payments] Omise payment confirmed", {
            bookingNumber,
            chargeId,
        });
        res.json({ ok: true, bookingNumber });
    } catch (error) {
        console.error("[payments] Failed to confirm Omise payment:", error);
        res.status(500).json({ error: "Failed to confirm Omise payment" });
    }
});

module.exports = router;

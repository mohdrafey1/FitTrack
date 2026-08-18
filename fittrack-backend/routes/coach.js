const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { rateLimitPerUser } = require("../middleware/rateLimit");
const { isConfigured, GeminiError } = require("../services/gemini");
const { askCoach, RANGES, MAX_MESSAGE_LENGTH } = require("../services/coach");

const router = express.Router();

// @route   GET /api/coach/status
// @desc    Whether the coach is available on this deployment
// @access  Private
router.get("/status", authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            available: isConfigured(),
            ranges: Object.keys(RANGES),
        },
    });
});

// @route   POST /api/coach/chat
// @desc    Ask FitAI a question grounded in the user's own logged data
// @access  Private
router.post(
    "/chat",
    authenticateToken,
    rateLimitPerUser({
        max: 40,
        windowMs: 60 * 60 * 1000,
        message:
            "You have asked FitAI a lot of questions in the last hour. Try again a little later.",
    }),
    async (req, res) => {
        try {
            const { message, range = "week", history = [] } = req.body;

            if (typeof message !== "string" || message.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Ask a question of at least 2 characters",
                });
            }

            if (message.length > MAX_MESSAGE_LENGTH * 2) {
                return res.status(400).json({
                    success: false,
                    message: `Keep questions under ${MAX_MESSAGE_LENGTH} characters`,
                });
            }

            if (!RANGES[range]) {
                return res.status(400).json({
                    success: false,
                    message: "Unknown data range",
                });
            }

            if (!isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: "FitAI is not enabled on this server",
                });
            }

            const result = await askCoach(req.user, message, range, history);

            res.json({
                success: true,
                data: {
                    answer: result.answer,
                    range: result.range,
                },
                meta: { model: result.model },
            });
        } catch (error) {
            if (error instanceof GeminiError) {
                return res.status(error.status).json({
                    success: false,
                    message: error.message,
                });
            }
            console.error("Error answering coach question:", error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
);

module.exports = router;

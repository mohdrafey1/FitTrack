/**
 * Shared Gemini transport.
 *
 * One place that knows the endpoint, the auth header, the pinned API revision
 * and how to turn a failure into an HTTP status. Callers supply a prompt and
 * (optionally) a response schema, and get text back.
 *
 * No SDK — Node's global fetch is enough. The API key is read from the
 * environment on every call and never leaves this process.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

// Pinned so a future breaking revision can't silently change the payload shape.
const GEMINI_API_REVISION = "2026-05-20";

/** Cheapest current model that handles these tasks well. */
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const DEFAULT_TIMEOUT_MS = 20000;

class GeminiError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.name = "GeminiError";
        this.status = status;
    }
}

/** True when the server has an API key and AI features can be offered. */
function isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}

function getModel() {
    return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Pull the generated text out of an Interactions API response.
 *
 * `output_text` is the documented convenience field; the fallback walks the
 * step/content shapes so a payload tweak degrades into a clear error rather
 * than an undefined read.
 */
function extractText(payload) {
    if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
        return payload.output_text;
    }

    const collected = [];
    const visit = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        if (typeof node.text === "string" && node.text.trim()) collected.push(node.text);
        for (const key of ["steps", "content", "parts", "outputs"]) {
            if (node[key]) visit(node[key]);
        }
    };
    visit(payload?.steps ?? payload?.outputs);

    return collected.length ? collected.join("") : null;
}

/**
 * Run one prompt.
 *
 * @param {object}  options
 * @param {string}  options.systemInstruction
 * @param {string}  options.input
 * @param {object}  [options.schema]            JSON schema; forces a JSON reply
 * @param {number}  [options.maxOutputTokens]
 * @param {number}  [options.temperature]
 * @param {string}  [options.thinkingLevel]     minimal | low | medium | high
 * @param {number}  [options.timeoutMs]
 * @returns {Promise<{ text: string, model: string }>}
 */
async function generate({
    systemInstruction,
    input,
    schema,
    maxOutputTokens = 700,
    temperature = 0.2,
    thinkingLevel = "minimal",
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
    if (!isConfigured()) {
        throw new GeminiError("AI features are not configured on this server.", 503);
    }

    const model = getModel();

    const body = {
        model,
        system_instruction: systemInstruction,
        input,
        generation_config: {
            thinking_level: thinkingLevel,
            temperature,
            max_output_tokens: maxOutputTokens,
        },
    };

    if (schema) {
        body.response_format = {
            type: "text",
            mime_type: "application/json",
            schema,
        };
    }

    let response;
    try {
        response = await fetch(GEMINI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY,
                "Api-Revision": GEMINI_API_REVISION,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            throw new GeminiError("The AI request timed out. Try again.", 504);
        }
        throw new GeminiError("Could not reach the AI service.", 502);
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`Gemini request failed: ${response.status} ${detail.slice(0, 500)}`);
        if (response.status === 429) {
            throw new GeminiError("The AI service is rate limited. Try again shortly.", 429);
        }
        if (response.status === 401 || response.status === 403) {
            throw new GeminiError("AI features are misconfigured on this server.", 503);
        }
        throw new GeminiError("The AI service returned an error.", 502);
    }

    const payload = await response.json().catch(() => null);

    if (payload?.status === "failed" || payload?.errors?.length) {
        const detail = payload?.errors?.[0]?.message || "unknown error";
        console.error(`Gemini interaction failed: ${detail}`);
        throw new GeminiError("The AI service could not complete the request.", 502);
    }

    const text = extractText(payload);
    if (!text) {
        console.error(`Gemini response had no text: ${JSON.stringify(payload).slice(0, 500)}`);
        throw new GeminiError("The AI service returned an empty response.", 502);
    }

    return { text, model };
}

module.exports = {
    generate,
    isConfigured,
    getModel,
    GeminiError,
    DEFAULT_MODEL,
};

const { generate, isConfigured, GeminiError } = require("./gemini");

/**
 * AI nutrition lookup.
 *
 * Given a food name (and optionally a short description) this asks Gemini for
 * per-100g nutrition values, then reconciles them against the same rules the
 * CustomFood model enforces, so a suggestion can always be saved.
 *
 * The API key never leaves the server: the mobile app calls our route, we call
 * Google. Transport lives in services/gemini.js.
 *
 * Configure with:
 *   GEMINI_API_KEY   required; without it the feature reports itself unavailable
 *   GEMINI_MODEL     optional; defaults to the cheapest current flash-lite
 */

/** Mirrors the enum on the CustomFood schema. */
const CATEGORIES = [
    "protein",
    "carbs",
    "fruit",
    "vegetable",
    "dairy",
    "nuts",
    "snack",
    "beverage",
    "grain",
    "fat",
    "other",
];

/**
 * Ceilings copied from models/CustomFood.js. Anything the model returns is
 * clamped into these before it is sent back, so the client can never be handed
 * a value that would fail validation on save.
 */
const LIMITS = {
    calories: { min: 0, max: 1000 },
    protein: { min: 0, max: 100 },
    carbs: { min: 0, max: 100 },
    fat: { min: 0, max: 100 },
    fiber: { min: 0, max: 50 },
    sugar: { min: 0, max: 100 },
    serving: { min: 1, max: 1000 },
};

/**
 * CustomFood's pre-save hook rejects a food when the Atwater energy of its
 * macros differs from `calories` by more than 10%. We reconcile at 8% so a
 * suggestion always clears that check with room to spare.
 */
const CALORIE_TOLERANCE = 0.08;

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        recognized: {
            type: "boolean",
            description:
                "true if the input names a real, identifiable food or drink; false if it is nonsense, an object that is not edible, or too vague to estimate.",
        },
        category: {
            type: "string",
            enum: CATEGORIES,
            description: "The single best-fitting category for this food.",
        },
        calories: {
            type: "number",
            description: "Energy in kcal per 100 g of the edible portion.",
        },
        protein: { type: "number", description: "Grams of protein per 100 g." },
        carbs: {
            type: "number",
            description: "Grams of total carbohydrate per 100 g, including sugar and fiber.",
        },
        fat: { type: "number", description: "Grams of total fat per 100 g." },
        fiber: { type: "number", description: "Grams of dietary fiber per 100 g." },
        sugar: { type: "number", description: "Grams of total sugars per 100 g." },
        brand: {
            type: "string",
            description:
                "The brand name if the food is clearly a branded product, otherwise an empty string.",
        },
        servingSizes: {
            type: "object",
            description: "Realistic portion weights in grams for this specific food.",
            properties: {
                small: { type: "number" },
                medium: { type: "number" },
                large: { type: "number" },
            },
            required: ["small", "medium", "large"],
        },
        confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description:
                "high for staple foods with well-known values, low when the food is regional, homemade, or the description is thin.",
        },
        note: {
            type: "string",
            description:
                "One short sentence naming what was assumed (preparation, cut, fat content). Empty string if nothing notable was assumed.",
        },
    },
    required: [
        "recognized",
        "category",
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "brand",
        "servingSizes",
        "confidence",
        "note",
    ],
};

const SYSTEM_INSTRUCTION = [
    "You are a nutrition database. You return per-100g nutrition facts for foods.",
    "",
    "Rules you must follow:",
    "- All nutrition values are per 100 g of the edible portion, as normally eaten.",
    "- Energy must agree with the macros: protein*4 + carbs*4 + fat*9 must land within 5% of the calories you report. Adjust the values until it does.",
    "- sugar must not exceed carbs. fiber must not exceed carbs.",
    "- protein + carbs + fat must not exceed 100.",
    "- servingSizes are gram weights of realistic portions of this food, small < medium < large. Use the weight of one natural unit for countable foods (one egg, one slice, one banana).",
    "- If a preparation is not specified, assume the most common one and say so in note.",
    "- If the input is not a food, or is far too vague to estimate, set recognized to false and return zeros.",
    "- Report the values you are most confident are typical. Do not round everything to multiples of 5.",
].join("\n");


function clamp(value, { min, max }) {
    if (typeof value !== "number" || !Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
}

function round(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/**
 * Round down to one decimal. Used when scaling macros to fit 100 g: rounding to
 * nearest can push the sum back over the ceiling it was just scaled under,
 * whereas flooring can only ever undershoot.
 */
function floorTenth(value) {
    return Math.floor(value * 10) / 10;
}

/**
 * Force a raw model response into something CustomFood will accept.
 *
 * Returns the cleaned food plus the list of corrections that were applied, so
 * the caller can tell the user their numbers were nudged.
 */
function reconcile(raw) {
    const adjustments = [];

    let protein = round(clamp(raw.protein, LIMITS.protein));
    let carbs = round(clamp(raw.carbs, LIMITS.carbs));
    let fat = round(clamp(raw.fat, LIMITS.fat));
    let fiber = round(clamp(raw.fiber, LIMITS.fiber));
    let sugar = round(clamp(raw.sugar, LIMITS.sugar));
    let calories = clamp(raw.calories, LIMITS.calories);

    // Sub-components of carbohydrate cannot exceed it.
    if (sugar > carbs) {
        sugar = carbs;
        adjustments.push("sugar capped at total carbs");
    }
    if (fiber > carbs) {
        fiber = carbs;
        adjustments.push("fiber capped at total carbs");
    }

    // 100 g of food cannot hold more than 100 g of macros.
    const macroMass = protein + carbs + fat;
    if (macroMass > 100) {
        const scale = 100 / macroMass;
        protein = floorTenth(protein * scale);
        carbs = floorTenth(carbs * scale);
        fat = floorTenth(fat * scale);
        sugar = floorTenth(Math.min(sugar * scale, carbs));
        fiber = floorTenth(Math.min(fiber * scale, carbs));
        adjustments.push("macros scaled to fit 100 g");
    }

    // The macros are the more reliable signal, so energy is derived from them
    // rather than the other way round.
    const derived = protein * 4 + carbs * 4 + fat * 9;
    if (calories <= 0 || Math.abs(derived - calories) > calories * CALORIE_TOLERANCE) {
        calories = clamp(Math.round(derived), LIMITS.calories);
        adjustments.push("calories recalculated from macros");
    } else {
        calories = Math.round(calories);
    }

    const servings = raw.servingSizes || {};
    const servingSizes = {
        small: Math.round(clamp(servings.small, LIMITS.serving)),
        medium: Math.round(clamp(servings.medium, LIMITS.serving)),
        large: Math.round(clamp(servings.large, LIMITS.serving)),
    };
    if (
        !(servingSizes.small < servingSizes.medium && servingSizes.medium < servingSizes.large)
    ) {
        servingSizes.small = 50;
        servingSizes.medium = 100;
        servingSizes.large = 150;
        adjustments.push("serving sizes reset to defaults");
    }

    const category = CATEGORIES.includes(raw.category) ? raw.category : "other";
    const confidence = ["high", "medium", "low"].includes(raw.confidence)
        ? raw.confidence
        : "low";

    return {
        food: {
            category,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            brand: typeof raw.brand === "string" ? raw.brand.trim().slice(0, 50) : "",
            servingSizes,
        },
        confidence,
        note: typeof raw.note === "string" ? raw.note.trim().slice(0, 200) : "",
        adjustments,
    };
}

/**
 * Ask the model for nutrition facts.
 *
 * @param {string} name        food name as typed by the user
 * @param {string} description optional extra context (preparation, brand…)
 */
async function suggestNutrition(name, description = "") {
    const input = [
        `Food name: ${name.trim()}`,
        description.trim() ? `Description: ${description.trim()}` : null,
    ]
        .filter(Boolean)
        .join("\n");

    const { text, model } = await generate({
        systemInstruction: SYSTEM_INSTRUCTION,
        input,
        schema: RESPONSE_SCHEMA,
        // Nutrition lookup is recall, not reasoning — keep it fast and cheap,
        // and keep the numbers stable between runs.
        thinkingLevel: "minimal",
        temperature: 0.2,
        maxOutputTokens: 700,
    });

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        console.error(`Gemini returned non-JSON: ${text.slice(0, 300)}`);
        throw new NutritionAIError("The AI service returned an unreadable response.", 502);
    }
    if (parsed.recognized === false) {
        throw new NutritionAIError(
            "That doesn't look like a food we can estimate. Try a more specific name.",
            422
        );
    }

    return {
        ...reconcile(parsed),
        model,
    };
}

/**
 * Kept as a distinct name so route handlers can catch nutrition failures
 * specifically; transport failures arrive as GeminiError and carry a status too.
 */
const NutritionAIError = GeminiError;

module.exports = {
    suggestNutrition,
    isConfigured,
    reconcile,
    NutritionAIError,
    CATEGORIES,
    LIMITS,
    CALORIE_TOLERANCE,
};

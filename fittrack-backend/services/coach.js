/**
 * FitAI — a coaching chat grounded in the user's own logged data.
 *
 * The client sends a question, a range and the recent turns of the thread. The
 * *data* is assembled here from Mongo rather than being posted up by the app:
 * the server already has it, it cannot be tampered with, and it keeps the
 * request small.
 *
 * Everything is read-only. This service never writes to the database.
 */

const FoodEntry = require("../models/FoodEntry");
const { generate, GeminiError } = require("./gemini");

/** Ranges the client may ask for, mapped to a day count. */
const RANGES = {
    today: 1,
    week: 7,
    month: 28,
};

const RANGE_LABELS = {
    today: "today",
    week: "the last 7 days",
    month: "the last 28 days",
};

/** Turns of prior conversation accepted from the client. */
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 1000;

/** Foods listed by name in the summary, most frequent first. */
const TOP_FOODS = 8;

const SYSTEM_INSTRUCTION = [
    "You are FitAI, the coach inside the FitTrack app. You answer questions about the user's nutrition and progress using the data you are given.",
    "",
    "How to answer:",
    "- Lead with the number that answers the question. Be concrete: cite their actual averages, totals and targets rather than talking in generalities.",
    "- Keep it short. Three to six sentences, or a few bullets. This is read on a phone.",
    "- When they ask what to improve, name the single biggest gap first and say what to do about it in practical food terms.",
    "- Suggest foods that fit what they already log. If they log paneer and rice, do not tell them to eat cottage cheese and quinoa.",
    "- If a day has no data, say the data is missing rather than treating it as a zero-calorie day.",
    "- Use the units in the data: kcal, grams, millilitres, kilograms.",
    "- You may use short markdown: **bold** for numbers you want to stand out, and - bullets. No headings, no tables.",
    "",
    "Boundaries:",
    "- You are not a doctor or a dietitian. For anything medical — illness, medication, eating disorders, pregnancy, injuries, supplements beyond ordinary food — say plainly that it needs a professional, and do not give a clinical recommendation.",
    "- Never suggest eating under 1200 kcal a day, an extreme restriction, or a fast, whatever the user asks for.",
    "- If the question has nothing to do with fitness, nutrition or their data, say that is outside what you cover and offer something you can help with instead.",
    "- If the data does not support an answer, say so. Do not invent numbers that are not in the summary.",
].join("\n");

function round(value, decimals = 0) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function percentOf(value, target) {
    if (!target) return null;
    return Math.round((value / target) * 100);
}

/** UTC midnight, matching how FoodEntry stores its days. */
function normalizeToUTC(date) {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
}

function isoDay(date) {
    return new Date(date).toISOString().split("T")[0];
}

/**
 * Snapshot of who the user is and what they are aiming at. Always included:
 * every answer should be able to reason about their body and goals.
 */
function buildProfile(user) {
    const lines = [
        `Name: ${user.username}`,
        `Current weight: ${user.currentWeight} kg`,
        `Target weight: ${user.targetWeight} kg`,
    ];

    const difference = round(user.targetWeight - user.currentWeight, 1);
    if (difference !== 0) {
        lines.push(
            `Weight goal: ${Math.abs(difference)} kg to ${difference < 0 ? "lose" : "gain"}`
        );
    } else {
        lines.push("Weight goal: maintain current weight");
    }

    if (user.age) lines.push(`Age: ${user.age}`);
    if (user.gender) lines.push(`Gender: ${user.gender}`);
    if (user.height) lines.push(`Height: ${user.height} cm`);
    if (user.bmi) lines.push(`BMI: ${user.bmi}`);
    if (user.activityLevel) lines.push(`Activity level: ${user.activityLevel.replace(/_/g, " ")}`);
    if (user.fitnessGoal) lines.push(`Fitness goal: ${user.fitnessGoal.replace(/_/g, " ")}`);

    lines.push(
        `Daily targets: ${user.targetDailyCalories} kcal, ${user.targetDailyProteins} g protein, ${user.targetDailyWater} ml water`
    );

    return lines.join("\n");
}

/**
 * Per-day totals plus the aggregates a coaching answer actually needs.
 *
 * Only daily totals go in for multi-day ranges — 28 days of individual food
 * rows would dominate the prompt for very little extra signal. Today's range
 * gets the full meal list, because that is what "how was today" means.
 */
function summariseEntries(entries, user, rangeKey) {
    const days = RANGES[rangeKey];
    const targets = {
        calories: user.targetDailyCalories,
        protein: user.targetDailyProteins,
        water: user.targetDailyWater,
    };

    const logged = entries.filter((entry) => entry.foods.length > 0 || entry.water > 0);

    if (logged.length === 0) {
        return `No food or water was logged in ${RANGE_LABELS[rangeKey]}.`;
    }

    const sum = logged.reduce(
        (acc, entry) => ({
            calories: acc.calories + entry.totalCalories,
            protein: acc.protein + entry.totalProtein,
            carbs: acc.carbs + (entry.totalCarbs || 0),
            fat: acc.fat + (entry.totalFat || 0),
            water: acc.water + entry.water,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );

    const avg = {
        calories: round(sum.calories / logged.length),
        protein: round(sum.protein / logged.length, 1),
        carbs: round(sum.carbs / logged.length, 1),
        fat: round(sum.fat / logged.length, 1),
        water: round(sum.water / logged.length),
    };

    const sections = [];

    sections.push(
        [
            `Range: ${RANGE_LABELS[rangeKey]} (${days} day${days === 1 ? "" : "s"})`,
            `Days with data: ${logged.length} of ${days}`,
            `Daily average: ${avg.calories} kcal (${percentOf(avg.calories, targets.calories)}% of target), ` +
                `${avg.protein} g protein (${percentOf(avg.protein, targets.protein)}% of target), ` +
                `${avg.water} ml water (${percentOf(avg.water, targets.water)}% of target)`,
            `Average carbs: ${avg.carbs} g, average fat: ${avg.fat} g`,
        ].join("\n")
    );

    // How often each target was actually met — the thing "how am I doing"
    // really asks, and an average alone hides it.
    const hits = logged.reduce(
        (acc, entry) => ({
            calories: acc.calories + (entry.totalCalories >= targets.calories ? 1 : 0),
            protein: acc.protein + (entry.totalProtein >= targets.protein ? 1 : 0),
            water: acc.water + (entry.water >= targets.water ? 1 : 0),
        }),
        { calories: 0, protein: 0, water: 0 }
    );
    sections.push(
        `Targets met: calories on ${hits.calories}/${logged.length} logged days, ` +
            `protein on ${hits.protein}/${logged.length}, water on ${hits.water}/${logged.length}`
    );

    const dayLines = logged.map((entry) => {
        const parts = [
            `${isoDay(entry.date)}: ${entry.totalCalories} kcal`,
            `${round(entry.totalProtein, 1)} g protein`,
            `${entry.water} ml water`,
            `${entry.foods.length} item${entry.foods.length === 1 ? "" : "s"}`,
        ];
        return `- ${parts.join(", ")}`;
    });
    sections.push(`Daily log:\n${dayLines.join("\n")}`);

    if (rangeKey === "today") {
        const foods = logged.flatMap((entry) => entry.foods);
        if (foods.length > 0) {
            const meals = foods.map(
                (food) =>
                    `- ${food.foodName} (${food.servingSize || `${food.quantity}g`}): ` +
                    `${food.calories} kcal, ${food.protein} g protein, ${food.carbs} g carbs, ${food.fat} g fat`
            );
            sections.push(`Today's meals:\n${meals.join("\n")}`);
        }
    } else {
        const counts = new Map();
        for (const entry of logged) {
            for (const food of entry.foods) {
                counts.set(food.foodName, (counts.get(food.foodName) || 0) + 1);
            }
        }
        const top = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_FOODS)
            .map(([name, count]) => `- ${name} (${count}x)`);
        if (top.length > 0) {
            sections.push(`Most logged foods:\n${top.join("\n")}`);
        }
    }

    return sections.join("\n\n");
}

/** Fetches the range and renders the whole grounding block. */
async function buildContext(user, rangeKey) {
    const days = RANGES[rangeKey];
    const endDate = normalizeToUTC(new Date());
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const entries = await FoodEntry.getEntriesInRange(user.id, startDate, endDate);
    // Oldest first reads more naturally as a timeline.
    const chronological = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

    return [
        "=== USER PROFILE ===",
        buildProfile(user),
        "",
        "=== LOGGED DATA ===",
        summariseEntries(chronological, user, rangeKey),
    ].join("\n");
}

/** Trims client-supplied history to something safe to echo back to the model. */
function normaliseHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
        .filter(
            (turn) =>
                turn &&
                (turn.role === "user" || turn.role === "assistant") &&
                typeof turn.content === "string" &&
                turn.content.trim()
        )
        .slice(-MAX_HISTORY_TURNS)
        .map((turn) => ({
            role: turn.role,
            content: turn.content.trim().slice(0, MAX_MESSAGE_LENGTH),
        }));
}

/**
 * Answer one question.
 *
 * @param {object} user      the authenticated mongoose user document
 * @param {string} message   the question
 * @param {string} rangeKey  today | week | month
 * @param {Array}  history   prior turns as { role, content }
 */
async function askCoach(user, message, rangeKey, history) {
    if (!RANGES[rangeKey]) {
        throw new GeminiError("Unknown data range.", 400);
    }

    const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    const context = await buildContext(user, rangeKey);
    const priorTurns = normaliseHistory(history);

    const conversation = priorTurns
        .map((turn) => `${turn.role === "user" ? "User" : "FitAI"}: ${turn.content}`)
        .join("\n");

    const input = [
        context,
        "",
        conversation ? `=== CONVERSATION SO FAR ===\n${conversation}\n` : "",
        "=== QUESTION ===",
        trimmed,
    ]
        .filter((part) => part !== "")
        .join("\n");

    const { text, model } = await generate({
        systemInstruction: SYSTEM_INSTRUCTION,
        input,
        // Coaching benefits from a little reasoning over the numbers, and a
        // touch more warmth than a database lookup.
        thinkingLevel: "low",
        temperature: 0.6,
        maxOutputTokens: 800,
        timeoutMs: 30000,
    });

    return { answer: text.trim(), model, range: rangeKey };
}

module.exports = {
    askCoach,
    buildContext,
    buildProfile,
    summariseEntries,
    normaliseHistory,
    RANGES,
    RANGE_LABELS,
    MAX_HISTORY_TURNS,
    MAX_MESSAGE_LENGTH,
};

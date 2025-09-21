const mongoose = require("mongoose");

const foodEntrySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: () => {
                // Always use UTC midnight
                const now = new Date();
                return new Date(
                    Date.UTC(
                        now.getUTCFullYear(),
                        now.getUTCMonth(),
                        now.getUTCDate()
                    )
                );
            },
        },
        foods: [
            {
                foodId: { type: Number, required: true },
                foodName: { type: String, required: true },
                quantity: {
                    type: Number,
                    required: true,
                    min: [0.1, "Quantity must be at least 0.1"],
                },
                unit: {
                    type: String,
                    required: true,
                    enum: ["g", "ml"],
                    default: "g",
                },
                calories: { type: Number, required: true, min: 0 },
                protein: { type: Number, required: true, min: 0 },
                carbs: { type: Number, required: true, min: 0 },
                fat: { type: Number, required: true, min: 0 },
                servingSize: { type: String },
                timestamp: {
                    type: Date,
                    default: Date.now, // Keep as UTC automatically
                },
            },
        ],
        water: { type: Number, default: 0, min: 0, max: 10000 },
        totalCalories: { type: Number, default: 0, min: 0 },
        totalProtein: { type: Number, default: 0, min: 0 },
        totalCarbs: { type: Number, default: 0, min: 0 },
        totalFat: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

// Compound index for user and date for efficient queries
foodEntrySchema.index({ user: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate totals
foodEntrySchema.pre("save", function (next) {
    if (this.foods && this.foods.length > 0) {
        this.totalCalories = this.foods.reduce(
            (sum, food) => sum + food.calories,
            0
        );
        this.totalProtein =
            Math.round(
                this.foods.reduce((sum, food) => sum + food.protein, 0) * 10
            ) / 10;
        this.totalCarbs =
            Math.round(
                this.foods.reduce((sum, food) => sum + food.carbs, 0) * 10
            ) / 10;
        this.totalFat =
            Math.round(
                this.foods.reduce((sum, food) => sum + food.fat, 0) * 10
            ) / 10;
    } else {
        this.totalCalories = 0;
        this.totalProtein = 0;
        this.totalCarbs = 0;
        this.totalFat = 0;
    }
    next();
});
// Instance method to add a food entry
foodEntrySchema.methods.addFood = function (foodData) {
    this.foods.push(foodData);
    return this.save();
};

// Instance method to remove a food entry
foodEntrySchema.methods.removeFood = function (foodEntryId) {
    this.foods.pull({ _id: foodEntryId });
    return this.save();
};

// Instance method to update water intake
foodEntrySchema.methods.updateWater = function (waterAmount) {
    this.water = Math.max(0, this.water + waterAmount);
    return this.save();
};

// Static methods
foodEntrySchema.statics.getOrCreateEntry = async function (userId, date) {
    const utcMidnight = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );

    let entry = await this.findOne({ user: userId, date: utcMidnight });
    if (!entry) {
        entry = new this({
            user: userId,
            date: utcMidnight,
            foods: [],
            water: 0,
        });
        await entry.save();
    }
    return entry;
};

foodEntrySchema.statics.getEntriesInRange = async function (
    userId,
    startDate,
    endDate
) {
    const start = new Date(
        Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate()
        )
    );
    const end = new Date(
        Date.UTC(
            endDate.getUTCFullYear(),
            endDate.getUTCMonth(),
            endDate.getUTCDate(),
            23,
            59,
            59,
            999
        )
    );

    return this.find({ user: userId, date: { $gte: start, $lte: end } }).sort({
        date: -1,
    });
};

// Virtual for progress calculation
foodEntrySchema.virtual("progress").get(function () {
    if (!this.populated("user")) return null;

    const user = this.user;
    return {
        calories: {
            consumed: this.totalCalories,
            target: user.targetDailyCalories || 2000,
            percentage: Math.round(
                (this.totalCalories / (user.targetDailyCalories || 2000)) * 100
            ),
        },
        protein: {
            consumed: this.totalProtein,
            target: user.targetDailyProteins || 150,
            percentage: Math.round(
                (this.totalProtein / (user.targetDailyProteins || 150)) * 100
            ),
        },
        water: {
            consumed: this.water,
            target: user.targetDailyWater || 2000,
            percentage: Math.round(
                (this.water / (user.targetDailyWater || 2000)) * 100
            ),
        },
    };
});

// Ensure virtual fields are serialized
foodEntrySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("FoodEntry", foodEntrySchema);

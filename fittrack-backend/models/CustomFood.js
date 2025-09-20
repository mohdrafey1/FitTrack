const mongoose = require("mongoose");

const customFoodSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Food name is required"],
            trim: true,
            minlength: [2, "Food name must be at least 2 characters long"],
            maxlength: [100, "Food name cannot exceed 100 characters"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: [
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
            ],
            default: "other",
        },
        // Nutrition per 100g
        calories: {
            type: Number,
            required: [true, "Calories per 100g is required"],
            min: [0, "Calories cannot be negative"],
            max: [1000, "Calories per 100g seems too high"],
        },
        protein: {
            type: Number,
            required: [true, "Protein content is required"],
            min: [0, "Protein cannot be negative"],
            max: [100, "Protein per 100g cannot exceed 100g"],
        },
        carbs: {
            type: Number,
            required: [true, "Carbohydrate content is required"],
            min: [0, "Carbohydrates cannot be negative"],
            max: [100, "Carbohydrates per 100g cannot exceed 100g"],
        },
        fat: {
            type: Number,
            required: [true, "Fat content is required"],
            min: [0, "Fat cannot be negative"],
            max: [100, "Fat per 100g cannot exceed 100g"],
        },
        fiber: {
            type: Number,
            default: 0,
            min: [0, "Fiber cannot be negative"],
            max: [50, "Fiber per 100g seems too high"],
        },
        sugar: {
            type: Number,
            default: 0,
            min: [0, "Sugar cannot be negative"],
            max: [100, "Sugar per 100g cannot exceed 100g"],
        },
        // Serving size options in grams
        servingSizes: {
            small: {
                type: Number,
                default: 50,
                min: [1, "Serving size must be at least 1g"],
                max: [1000, "Serving size seems too large"],
            },
            medium: {
                type: Number,
                default: 100,
                min: [1, "Serving size must be at least 1g"],
                max: [1000, "Serving size seems too large"],
            },
            large: {
                type: Number,
                default: 150,
                min: [1, "Serving size must be at least 1g"],
                max: [1000, "Serving size seems too large"],
            },
        },
        // Optional brand information
        brand: {
            type: String,
            trim: true,
            maxlength: [50, "Brand name cannot exceed 50 characters"],
        },
        // Optional description
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        // Whether this food is verified or user-created
        isVerified: {
            type: Boolean,
            default: false,
        },
        // Usage count for popularity sorting
        usageCount: {
            type: Number,
            default: 0,
            min: [0, "Usage count cannot be negative"],
        },
        // Whether this food is active/visible
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for user and name for efficient queries
customFoodSchema.index({ user: 1, name: 1 });
customFoodSchema.index({ user: 1, category: 1 });
customFoodSchema.index({ user: 1, usageCount: -1 });

// Text search index
customFoodSchema.index({ name: "text", brand: "text", description: "text" });

// Validation for total macronutrients
customFoodSchema.pre("save", function (next) {
    const totalMacros = this.protein * 4 + this.carbs * 4 + this.fat * 9;
    const calorieTolerance = this.calories * 0.1; // 10% tolerance

    if (Math.abs(totalMacros - this.calories) > calorieTolerance) {
        const suggestedCalories = Math.round(totalMacros);
        return next(
            new Error(
                `Calories (${this.calories}) don't match macronutrients. Suggested: ${suggestedCalories} calories`
            )
        );
    }

    next();
});

// Instance method to increment usage count
customFoodSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

// Static method to search foods for a user
customFoodSchema.statics.searchUserFoods = async function (
    userId,
    searchTerm,
    category = null,
    limit = 20
) {
    const query = {
        user: userId,
        isActive: true,
    };

    if (category && category !== "all") {
        query.category = category;
    }

    if (searchTerm) {
        query.$text = { $search: searchTerm };
    }

    return this.find(query)
        .sort(
            searchTerm
                ? { score: { $meta: "textScore" }, usageCount: -1 }
                : { usageCount: -1, createdAt: -1 }
        )
        .limit(limit);
};

// Static method to get popular foods for a user
customFoodSchema.statics.getPopularFoods = async function (userId, limit = 10) {
    return this.find({
        user: userId,
        isActive: true,
        usageCount: { $gt: 0 },
    })
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(limit);
};

// Virtual for formatted nutrition info
customFoodSchema.virtual("nutritionSummary").get(function () {
    return {
        per100g: {
            calories: this.calories,
            protein: this.protein,
            carbs: this.carbs,
            fat: this.fat,
            fiber: this.fiber,
            sugar: this.sugar,
        },
        servings: {
            small: this.calculateNutrition(this.servingSizes.small),
            medium: this.calculateNutrition(this.servingSizes.medium),
            large: this.calculateNutrition(this.servingSizes.large),
        },
    };
});

// Instance method to calculate nutrition for a specific amount
customFoodSchema.methods.calculateNutrition = function (grams) {
    const multiplier = grams / 100;
    return {
        amount: grams,
        calories: Math.round(this.calories * multiplier),
        protein: Math.round(this.protein * multiplier * 10) / 10,
        carbs: Math.round(this.carbs * multiplier * 10) / 10,
        fat: Math.round(this.fat * multiplier * 10) / 10,
        fiber: Math.round(this.fiber * multiplier * 10) / 10,
        sugar: Math.round(this.sugar * multiplier * 10) / 10,
    };
};

// Ensure virtual fields are serialized
customFoodSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("CustomFood", customFoodSchema);

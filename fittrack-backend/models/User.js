const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username cannot exceed 30 characters"],
            match: [
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores",
            ],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // Don't include password in queries by default
        },
        // Fitness tracking fields
        currentWeight: {
            type: Number,
            required: [true, "Current weight is required"],
            min: [20, "Weight must be at least 20 kg"],
            max: [300, "Weight cannot exceed 300 kg"],
        },
        targetWeight: {
            type: Number,
            required: [true, "Target weight is required"],
            min: [20, "Target weight must be at least 20 kg"],
            max: [300, "Target weight cannot exceed 300 kg"],
        },
        targetDailyCalories: {
            type: Number,
            required: [true, "Target daily calories is required"],
            min: [800, "Target daily calories must be at least 800"],
            max: [5000, "Target daily calories cannot exceed 5000"],
        },
        targetDailyProteins: {
            type: Number,
            required: [true, "Target daily proteins is required"],
            min: [20, "Target daily proteins must be at least 20g"],
            max: [500, "Target daily proteins cannot exceed 500g"],
        },
        targetDailyWater: {
            type: Number,
            required: [true, "Target daily water is required"],
            min: [500, "Target daily water must be at least 500ml"],
            max: [10000, "Target daily water cannot exceed 10000ml"],
        },
        // Additional profile fields
        age: {
            type: Number,
            min: [13, "Age must be at least 13"],
            max: [120, "Age cannot exceed 120"],
        },
        height: {
            type: Number,
            min: [100, "Height must be at least 100 cm"],
            max: [250, "Height cannot exceed 250 cm"],
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other",
        },
        activityLevel: {
            type: String,
            enum: [
                "sedentary",
                "lightly_active",
                "moderately_active",
                "very_active",
                "extremely_active",
            ],
            default: "moderately_active",
        },
        fitnessGoal: {
            type: String,
            enum: [
                "weight_loss",
                "muscle_gain",
                "endurance",
                "strength",
                "general_fitness",
            ],
            default: "general_fitness",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for BMI calculation
userSchema.virtual("bmi").get(function () {
    if (this.height && this.currentWeight) {
        const heightInMeters = this.height / 100;
        return (this.currentWeight / (heightInMeters * heightInMeters)).toFixed(
            1
        );
    }
    return null;
});

// Virtual for weight difference
userSchema.virtual("weightDifference").get(function () {
    if (this.currentWeight && this.targetWeight) {
        return this.targetWeight - this.currentWeight;
    }
    return null;
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);

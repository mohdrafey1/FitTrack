// Common foods database with nutritional values per 100g
export const foodDatabase = [
    // Proteins
    {
        id: 1,
        name: "Chicken Breast (Cooked)",
        category: "protein",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        unit: "g",
        servingSizes: [
            { name: "Small piece", grams: 85 },
            { name: "Medium piece", grams: 120 },
            { name: "Large piece", grams: 150 },
        ],
    },
    {
        id: 2,
        name: "Eggs (Whole)",
        category: "protein",
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        unit: "g",
        servingSizes: [
            { name: "1 egg", grams: 50 },
            { name: "2 eggs", grams: 100 },
            { name: "3 eggs", grams: 150 },
        ],
    },
    {
        id: 3,
        name: "Paneer",
        category: "protein",
        calories: 265,
        protein: 18,
        carbs: 1.2,
        fat: 20,
        unit: "g",
        servingSizes: [
            { name: "Small cube", grams: 25 },
            { name: "Medium serving", grams: 50 },
            { name: "Large serving", grams: 100 },
        ],
    },
    {
        id: 4,
        name: "Dal (Cooked)",
        category: "protein",
        calories: 116,
        protein: 9,
        carbs: 20,
        fat: 0.4,
        unit: "g",
        servingSizes: [
            { name: "Small bowl", grams: 100 },
            { name: "Medium bowl", grams: 150 },
            { name: "Large bowl", grams: 200 },
        ],
    },
    {
        id: 5,
        name: "Fish (Cooked)",
        category: "protein",
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        unit: "g",
        servingSizes: [
            { name: "Small piece", grams: 80 },
            { name: "Medium piece", grams: 120 },
            { name: "Large piece", grams: 160 },
        ],
    },

    // Carbohydrates
    {
        id: 6,
        name: "Rice (Cooked)",
        category: "carbs",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        unit: "g",
        servingSizes: [
            { name: "Small bowl", grams: 100 },
            { name: "Medium bowl", grams: 150 },
            { name: "Large bowl", grams: 200 },
        ],
    },
    {
        id: 7,
        name: "Roti/Chapati",
        category: "carbs",
        calories: 297,
        protein: 12,
        carbs: 56,
        fat: 4,
        unit: "g",
        servingSizes: [
            { name: "1 small roti", grams: 25 },
            { name: "1 medium roti", grams: 35 },
            { name: "1 large roti", grams: 45 },
        ],
    },
    {
        id: 8,
        name: "Bread (White)",
        category: "carbs",
        calories: 265,
        protein: 9,
        carbs: 49,
        fat: 3.2,
        unit: "g",
        servingSizes: [
            { name: "1 slice", grams: 25 },
            { name: "2 slices", grams: 50 },
            { name: "3 slices", grams: 75 },
        ],
    },
    {
        id: 9,
        name: "Oats (Cooked)",
        category: "carbs",
        calories: 68,
        protein: 2.4,
        carbs: 12,
        fat: 1.4,
        unit: "g",
        servingSizes: [
            { name: "Small bowl", grams: 100 },
            { name: "Medium bowl", grams: 150 },
            { name: "Large bowl", grams: 200 },
        ],
    },

    // Fruits
    {
        id: 10,
        name: "Banana",
        category: "fruits",
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
        unit: "g",
        servingSizes: [
            { name: "Small banana", grams: 80 },
            { name: "Medium banana", grams: 120 },
            { name: "Large banana", grams: 150 },
        ],
    },
    {
        id: 11,
        name: "Apple",
        category: "fruits",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        unit: "g",
        servingSizes: [
            { name: "Small apple", grams: 120 },
            { name: "Medium apple", grams: 180 },
            { name: "Large apple", grams: 220 },
        ],
    },
    {
        id: 12,
        name: "Orange",
        category: "fruits",
        calories: 47,
        protein: 0.9,
        carbs: 12,
        fat: 0.1,
        unit: "g",
        servingSizes: [
            { name: "Small orange", grams: 100 },
            { name: "Medium orange", grams: 150 },
            { name: "Large orange", grams: 200 },
        ],
    },

    // Vegetables
    {
        id: 13,
        name: "Potato (Cooked)",
        category: "vegetables",
        calories: 77,
        protein: 2,
        carbs: 17,
        fat: 0.1,
        unit: "g",
        servingSizes: [
            { name: "Small potato", grams: 100 },
            { name: "Medium potato", grams: 150 },
            { name: "Large potato", grams: 200 },
        ],
    },
    {
        id: 14,
        name: "Mixed Vegetables (Cooked)",
        category: "vegetables",
        calories: 35,
        protein: 2,
        carbs: 7,
        fat: 0.2,
        unit: "g",
        servingSizes: [
            { name: "Small serving", grams: 100 },
            { name: "Medium serving", grams: 150 },
            { name: "Large serving", grams: 200 },
        ],
    },

    // Dairy
    {
        id: 15,
        name: "Milk (Full Fat)",
        category: "dairy",
        calories: 61,
        protein: 3.2,
        carbs: 4.8,
        fat: 3.3,
        unit: "ml",
        servingSizes: [
            { name: "Small glass", grams: 150 },
            { name: "Medium glass", grams: 200 },
            { name: "Large glass", grams: 250 },
        ],
    },
    {
        id: 16,
        name: "Yogurt (Plain)",
        category: "dairy",
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fat: 0.4,
        unit: "g",
        servingSizes: [
            { name: "Small bowl", grams: 100 },
            { name: "Medium bowl", grams: 150 },
            { name: "Large bowl", grams: 200 },
        ],
    },

    // Nuts & Seeds
    {
        id: 17,
        name: "Almonds",
        category: "nuts",
        calories: 579,
        protein: 21,
        carbs: 22,
        fat: 50,
        unit: "g",
        servingSizes: [
            { name: "Small handful", grams: 15 },
            { name: "Medium handful", grams: 25 },
            { name: "Large handful", grams: 35 },
        ],
    },
    {
        id: 18,
        name: "Peanuts",
        category: "nuts",
        calories: 567,
        protein: 26,
        carbs: 16,
        fat: 49,
        unit: "g",
        servingSizes: [
            { name: "Small handful", grams: 15 },
            { name: "Medium handful", grams: 25 },
            { name: "Large handful", grams: 35 },
        ],
    },

    // Snacks
    {
        id: 19,
        name: "Biscuits (Plain)",
        category: "snacks",
        calories: 502,
        protein: 6,
        carbs: 65,
        fat: 23,
        unit: "g",
        servingSizes: [
            { name: "1 biscuit", grams: 8 },
            { name: "2 biscuits", grams: 16 },
            { name: "3 biscuits", grams: 24 },
        ],
    },
    {
        id: 20,
        name: "Namkeen/Mixture",
        category: "snacks",
        calories: 518,
        protein: 15,
        carbs: 45,
        fat: 30,
        unit: "g",
        servingSizes: [
            { name: "Small bowl", grams: 25 },
            { name: "Medium bowl", grams: 50 },
            { name: "Large bowl", grams: 75 },
        ],
    },
];

// Food categories for filtering
export const foodCategories = [
    { id: "all", name: "All Foods", icon: "🍽️" },
    { id: "protein", name: "Proteins", icon: "🥩" },
    { id: "carbs", name: "Carbohydrates", icon: "🍚" },
    { id: "fruits", name: "Fruits", icon: "🍎" },
    { id: "vegetables", name: "Vegetables", icon: "🥬" },
    { id: "dairy", name: "Dairy", icon: "🥛" },
    { id: "nuts", name: "Nuts & Seeds", icon: "🥜" },
    { id: "snacks", name: "Snacks", icon: "🍪" },
];

// Helper function to calculate macros based on quantity
export const calculateMacros = (food, quantity) => {
    const multiplier = quantity / 100;
    return {
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fat: Math.round(food.fat * multiplier * 10) / 10,
    };
};

// Helper function to search foods
export const searchFoods = (query, category = "all") => {
    let filteredFoods = foodDatabase;

    if (category !== "all") {
        filteredFoods = foodDatabase.filter(
            (food) => food.category === category
        );
    }

    if (query) {
        filteredFoods = filteredFoods.filter((food) =>
            food.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    return filteredFoods;
};

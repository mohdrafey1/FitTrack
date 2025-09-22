# FitTrack 🏃‍♂️💪

A comprehensive nutrition and fitness tracking application built with React and Node.js. FitTrack helps users monitor their daily food intake, track calories, protein, and water consumption with detailed analytics and insights.

![FitTrack](https://img.shields.io/badge/FitTrack-Nutrition%20Tracker-brightgreen)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-blue)

## ✨ Features

### 🥗 Food Tracking

-   **Daily Food Logging**: Add and track food items with detailed nutritional information
-   **Custom Food Database**: Create and manage custom food entries with nutritional values
-   **Smart Search**: Search through food database with real-time suggestions
-   **Portion Control**: Flexible serving size management

### 📊 Analytics & Insights

-   **Interactive Charts**: Visual representation of calories, protein, and water intake trends
-   **Period Analysis**: View analytics for 7, 14, or 30-day periods
-   **Goal Tracking**: Set and monitor daily targets for calories, protein, and water
-   **Best Performance**: Track your best days and achievement streaks
-   **Progress Insights**: Comprehensive nutrition summaries and goal achievement percentages

### 💧 Hydration Tracking

-   **Water Intake Monitoring**: Track daily water consumption
-   **Visual Progress**: Intuitive water level indicators
-   **Goal Achievement**: Set and track daily hydration targets

### 📱 User Experience

-   **Responsive Design**: Mobile-first design with Tailwind CSS
-   **Progressive Web App (PWA)**: Installable app experience
-   **Dark/Light Mode**: Adaptive interface design
-   **Real-time Updates**: Instant feedback and notifications
-   **UTC Consistency**: Timezone-aware date handling for global users

### 🔐 Authentication & Security

-   **Secure Authentication**: JWT-based user authentication
-   **Password Encryption**: bcrypt password hashing
-   **User Profiles**: Personalized user settings and targets
-   **Data Privacy**: Secure user data management

## 🚀 Tech Stack

### Frontend

-   **React 19.1.1** - Modern React with hooks and context
-   **Vite** - Fast build tool and development server
-   **Tailwind CSS 4.1.13** - Utility-first CSS framework
-   **Lucide React** - Beautiful icon library
-   **React Router DOM** - Client-side routing
-   **Axios** - HTTP client for API requests
-   **React Hot Toast** - Elegant notifications
-   **PWA Support** - Service workers and offline functionality

### Backend

-   **Node.js** - JavaScript runtime
-   **Express.js 4.18.2** - Web application framework
-   **MongoDB** - NoSQL database with Mongoose ODM
-   **JWT** - JSON Web Token authentication
-   **bcryptjs** - Password hashing
-   **CORS** - Cross-origin resource sharing
-   **Express Validator** - Input validation middleware

## 📁 Project Structure

```
FitTrack/
├── fittrack-frontend/                 # React frontend application
│   ├── public/                        # Static assets
│   │   ├── icons/                     # PWA icons
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/                # Reusable components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignupForm.jsx
│   │   ├── contexts/                  # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                     # Page components
│   │   │   ├── Analytics.jsx          # Analytics dashboard
│   │   │   ├── DashboardPage.jsx      # Main dashboard
│   │   │   ├── FoodHistory.jsx        # Food history viewer
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── services/                  # API services
│   │   │   └── api.js
│   │   ├── App.jsx                    # Main app component
│   │   ├── main.jsx                   # Entry point
│   │   ├── index.css                  # Global styles
│   │   └── pwa.js                     # PWA configuration
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
├── fittrack-backend/                  # Node.js backend API
│   ├── models/                        # Database models
│   │   ├── User.js                    # User schema
│   │   └── FoodEntry.js               # Food entry schema
│   ├── routes/                        # API routes
│   │   ├── auth.js                    # Authentication routes
│   │   ├── food.js                    # Food tracking routes
│   │   └── customFoods.js             # Custom food management
│   ├── middleware/                    # Custom middleware
│   │   └── auth.js                    # Authentication middleware
│   ├── scripts/                       # Utility scripts
│   ├── index.js                       # Server entry point
│   └── package.json
└── README.md                          # This file
```

## 🛠️ Installation & Setup

### Prerequisites

-   **Node.js** (v16 or higher)
-   **MongoDB** (local installation or MongoDB Atlas)
-   **npm** or **yarn** package manager

### Backend Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/mohdrafey1/FitTrack.git
    cd FitTrack/fittrack-backend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:

    ```env
    # Database
    MONGODB_URI=mongodb://localhost:27017/fittrack
    # or for MongoDB Atlas:
    # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fittrack

    # Server
    PORT=6001

    # JWT Secret
    JWT_SECRET=your_super_secure_jwt_secret_key_here

    # Environment
    NODE_ENV=development
    ```

4. **Start the development server**

    ```bash
    npm run dev
    ```

    The backend will be available at `http://localhost:6001`

### Frontend Setup

1. **Navigate to frontend directory**

    ```bash
    cd ../fittrack-frontend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Environment Configuration** (optional)
   Create a `.env` file in the frontend directory:

    ```env
    VITE_API_URL=http://localhost:6001
    ```

4. **Start the development server**

    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:6173`

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

-   `POST /api/auth/register` - User registration
-   `POST /api/auth/login` - User login
-   `GET /api/auth/profile` - Get user profile
-   `PUT /api/auth/profile` - Update user profile

### Food Tracking Routes (`/api/food`)

-   `GET /api/food/today` - Get today's food entry
-   `GET /api/food/date/:date` - Get food entry for specific date
-   `GET /api/food/history` - Get food history with date range
-   `GET /api/food/analytics` - Get nutrition analytics
-   `POST /api/food/add` - Add food item to entry
-   `DELETE /api/food/remove/:foodId` - Remove food item
-   `PUT /api/food/water` - Update daily water intake

### Custom Foods Routes (`/api/custom-foods`)

-   `GET /api/custom-foods` - Get user's custom foods
-   `POST /api/custom-foods` - Create custom food
-   `PUT /api/custom-foods/:id` - Update custom food
-   `DELETE /api/custom-foods/:id` - Delete custom food

### System Routes

-   `GET /` - API information
-   `GET /health` - Health check endpoint

## 🎯 Usage Guide

### Getting Started

1. **Sign Up**: Create a new account with email and password
2. **Set Goals**: Configure daily targets for calories, protein, and water
3. **Track Food**: Start logging your daily food intake
4. **Monitor Progress**: View analytics and track your nutrition journey

### Daily Workflow

1. **Morning**: Set your daily goals and plan meals
2. **Throughout Day**: Log food items as you consume them
3. **Track Hydration**: Update water intake regularly
4. **Evening**: Review daily progress and achievements

### Analytics Features

-   **Trend Charts**: Visual representation of your nutrition patterns
-   **Goal Tracking**: Monitor progress toward daily targets
-   **Best Days**: Celebrate your highest achievement days
-   **Streaks**: Track consecutive days of logging
-   **Period Comparison**: Compare different time periods

## 🏗️ Development

### Available Scripts

#### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

#### Backend

```bash
npm start        # Start production server
npm run dev      # Start development server with nodemon
npm test         # Run tests (to be implemented)
```

### Code Style

-   **ESLint** configuration for consistent code style
-   **Prettier** for code formatting
-   **Tailwind CSS** for utility-first styling
-   **UTC timestamps** for consistent date handling

### Database Schema

#### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  targetDailyCalories: Number,
  targetDailyProteins: Number,
  targetDailyWater: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### FoodEntry Model

```javascript
{
  userId: ObjectId,
  date: Date (UTC midnight),
  foods: [{
    name: String,
    calories: Number,
    protein: Number,
    servings: Number,
    createdAt: Date
  }],
  water: Number,
  totalCalories: Number,
  totalProtein: Number,
  foodCount: Number
}
```

## 🚀 Deployment

### Backend Deployment

1. **Environment Variables**: Set production environment variables
2. **Database**: Configure MongoDB Atlas for production
3. **Server**: Deploy to platforms like Heroku, Railway, or DigitalOcean
4. **Security**: Enable security headers and rate limiting

### Frontend Deployment

1. **Build**: Run `npm run build` to create production build
2. **Static Hosting**: Deploy to Vercel, Netlify, or GitHub Pages
3. **Environment**: Update API URLs for production
4. **PWA**: Ensure service workers are properly configured

### Production Checklist

-   [ ] Environment variables configured
-   [ ] Database connections secured
-   [ ] CORS properly configured
-   [ ] JWT secrets are secure
-   [ ] Error handling implemented
-   [ ] Logging configured
-   [ ] Performance optimized
-   [ ] Security headers enabled

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

-   Follow existing code style and conventions
-   Add tests for new features
-   Update documentation as needed
-   Ensure responsive design compatibility
-   Test across different devices and browsers

## 🙏 Acknowledgments

-   **React Team** for the amazing frontend framework
-   **Express.js** for the robust backend framework
-   **MongoDB** for the flexible database solution
-   **Tailwind CSS** for the utility-first styling approach
-   **Lucide** for the beautiful icon library

## 📞 Support

For support, questions, or suggestions:

-   **GitHub Issues**: [Create an issue](https://github.com/mohdrafey1/FitTrack/issues)
-   **Email**: mohdrafey600@gmail.com
-   **Documentation**: Check this README and inline code comments

---

**Happy Tracking! 🎯💪**

Built with ❤️ by [mohdrafey1](https://github.com/mohdrafey1)

# 🌍 Vandreren MVP

> **AI-Powered Travel Planning Assistant**

Vandreren is an intelligent travel planning application that leverages Google's Gemini AI to create personalized travel itineraries. Built with a modern React frontend and FastAPI backend, it provides users with detailed day-by-day travel plans, interactive chat functionality, and comprehensive travel management tools.

## ✨ Features

### 🤖 AI-Powered Itinerary Generation
- **Intelligent Planning**: Generate detailed travel itineraries using Google Gemini AI
- **Personalized Recommendations**: Tailored suggestions based on user preferences and travel style
- **Structured Day-by-Day Plans**: Organized activities with timing, locations, and estimated costs
- **Dynamic Updates**: Modify existing itineraries through natural language chat

### 💬 Interactive Chat Interface
- **Real-time Conversations**: Chat with AI for travel advice and itinerary modifications
- **Conversation History**: Persistent chat sessions with full message history
- **Context-Aware Responses**: AI maintains conversation context for better assistance

### 👤 User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Preferences**: Customizable travel preferences (interests, style, budget, accommodation)
- **Profile Management**: Complete user profile system with preference tracking

### 🗺️ Location Services
- **Place Search**: Find restaurants, attractions, and points of interest
- **Geocoding**: Convert addresses to coordinates for mapping
- **Weather Integration**: Weather information for travel destinations (extensible)

### 📱 Modern User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Dashboard**: Clean, modern interface for managing itineraries and conversations
- **Real-time Updates**: Instant feedback and loading states throughout the application

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM for database operations
- **SQLite**: Lightweight database for development (easily upgradeable to PostgreSQL)
- **Google Gemini AI**: Advanced AI model for itinerary generation and chat
- **JWT Authentication**: Secure token-based authentication
- **Geopy**: Geocoding and location services
- **Uvicorn**: ASGI server for production deployment

### Frontend
- **React 19**: Latest React with modern features and hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Router**: Client-side routing for single-page application
- **Axios**: HTTP client for API communication
- **Context API**: State management for authentication and user data

### Development Tools
- **ESLint**: Code linting and style enforcement
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic vendor prefix addition

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vandreren_mvp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   # venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   
   # Install dependencies
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_for_jwt_here
```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python main.py
   ```
   The API will be available at `http://localhost:8000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

3. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **API Documentation**: http://localhost:8000/docs (Swagger UI)
   - **Alternative API Docs**: http://localhost:8000/redoc

## 📖 Usage Guide

### Getting Started

1. **Register an Account**
   - Visit the application and click "Register"
   - Fill in your details and travel preferences
   - Your preferences help the AI create personalized recommendations

2. **Create Your First Itinerary**
   - Click "Create New Itinerary" on the dashboard
   - Specify destination, dates, budget, and special requests
   - The AI will generate a detailed day-by-day plan

3. **Chat with AI**
   - Use the chat interface to ask questions or modify itineraries
   - Ask for restaurant recommendations, activity suggestions, or itinerary changes
   - The AI maintains context throughout your conversation

### Key Features Explained

#### User Preferences
Configure your travel style to get better recommendations:
- **Interests**: Museums, food, nature, adventure, etc.
- **Travel Style**: Relaxed, balanced, or packed schedules
- **Budget Preference**: Budget, mid-range, or luxury
- **Accommodation Type**: Hotel, hostel, Airbnb, or resort

#### Itinerary Structure
Each generated itinerary includes:
- **Destination Overview**: Summary of the trip
- **Daily Plans**: Detailed activities with timing and locations
- **Cost Estimates**: Budget breakdown for activities and meals
- **Coordinates**: GPS coordinates for mapping integration

## 🔧 API Documentation

The application includes comprehensive API documentation:

- **Interactive Swagger UI**: http://localhost:8000/docs
- **Detailed API Guide**: See [api_guide.md](./api_guide.md) for complete endpoint documentation
- **Authentication**: JWT-based with Bearer token authentication
- **Response Formats**: Consistent JSON responses with proper error handling

### Key API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /itinerary/create` - Generate new itinerary
- `POST /chat` - AI chat interface
- `GET /itineraries` - Get user's itineraries
- `PUT /itinerary/{id}` - Update existing itinerary

## 🏗️ Project Structure

```
vandreren_mvp/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   ├── vandreren.db       # SQLite database
│   └── venv/              # Virtual environment
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── context/       # React context providers
│   │   └── assets/        # Static assets
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── api_guide.md           # Detailed API documentation
└── README.md             # This file
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with 12 rounds for secure password storage
- **JWT Authentication**: Secure token-based authentication with 7-day expiration
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic models for request/response validation
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection attacks

## 🚀 Deployment

### Development
The current setup is optimized for development with SQLite database and local file storage.

### Production Considerations

For production deployment, consider:

1. **Database Migration**
   ```bash
   # Replace SQLite with PostgreSQL
   pip install psycopg2-binary
   # Update DATABASE_URL in environment variables
   ```

2. **Environment Configuration**
   ```env
   DATABASE_URL=postgresql://user:password@localhost/vandreren
   SECRET_KEY=your_production_secret_key
   GEMINI_API_KEY=your_production_api_key
   ```

3. **Static File Serving**
   ```bash
   # Build frontend for production
   cd frontend
   npm run build
   ```

4. **Server Configuration**
   - Use a production ASGI server like Gunicorn with Uvicorn workers
   - Configure reverse proxy with Nginx
   - Enable HTTPS with SSL certificates
   - Set up proper CORS origins for production domains

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the API Documentation**: http://localhost:8000/docs
2. **Review the API Guide**: [api_guide.md](./api_guide.md)
3. **Open an Issue**: Create a GitHub issue with detailed description
4. **Check Logs**: Review backend logs for error details

## 🔮 Future Enhancements

- **Map Integration**: Interactive maps with itinerary visualization
- **Booking Integration**: Direct booking links for hotels and activities
- **Social Features**: Share itineraries and collaborate with travel companions
- **Offline Support**: Download itineraries for offline access
- **Mobile App**: Native mobile applications for iOS and Android
- **Advanced AI**: Enhanced personalization with machine learning
- **Real-time Updates**: Live weather and event information
- **Multi-language Support**: Internationalization for global users

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Core AI itinerary generation
- [x] User authentication and preferences
- [x] Chat interface
- [x] Basic dashboard

### Phase 2 (Next)
- [ ] Map integration and visualization
- [ ] Enhanced UI/UX improvements
- [ ] Advanced search and filtering
- [ ] Export functionality (PDF, calendar)

### Phase 3 (Future)
- [ ] Mobile applications
- [ ] Social features and sharing
- [ ] Booking integration
- [ ] Advanced analytics and insights

---

**Built with ❤️ for travelers who want to explore the world with confidence.**

*Vandreren - Your AI travel companion for unforgettable adventures.*
=======
Vandreren is an AI powered travel app for all your touring needs!

# 🌍 Vandreren - AI-Powered Travel Planning Platform

<div align="center">

![Vandreren Logo](https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=Vandreren)

**Plan Your Perfect Journey with AI-Powered Itineraries**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Vandreren** (Norwegian for "The Wanderer") is an intelligent travel planning platform that leverages Google's Gemini AI to create personalized travel itineraries for Indian travelers. Whether you're planning a solo adventure, a family vacation, or coordinating group travel, Vandreren provides comprehensive day-by-day plans with route optimization, budget estimation in Indian Rupees, and real-time collaboration features.

### ✨ What Makes Vandreren Special?

- 🤖 **AI-Powered Planning**: Uses Google Gemini 2.0 Flash for intelligent itinerary generation
- 🗺️ **Smart Route Optimization**: Automatically optimizes activity sequences to minimize travel time
- 💰 **Indian Rupee Pricing**: All costs and budgets displayed in INR for Indian travelers
- 👥 **Group Travel**: Collaborate with friends and family on shared itineraries
- 💬 **Interactive Chat**: Refine your itinerary through natural conversation
- 📊 **Progress Tracking**: Mark activities as completed and track your journey
- 🔔 **Real-time Notifications**: Get notified about group invitations and updates

---

## 🎯 Features

### Core Features

#### 🧠 AI-Powered Itinerary Generation

- Generate complete day-by-day travel itineraries
- Personalized based on user preferences (interests, travel style, dietary restrictions)
- Validates travel queries to ensure relevant responses
- Includes time slots, locations, costs, and detailed descriptions
- Automatic coordinate extraction for map integration

#### 🗺️ Route Optimization

- Uses geopy for accurate distance calculations
- Nearest neighbor algorithm to optimize daily activity sequences
- Reduces backtracking and travel time
- Preserves meal times and fixed-time activities

#### 💬 Intelligent Chat Interface

- Natural language conversation with AI travel assistant
- Modify itineraries through chat ("change first day activities", "add dinner recommendations")
- Maintains conversation history and context
- Auto-saves itinerary updates to database

#### 👥 Group Travel Management

- Create travel groups with friends and family
- Role-based access (creator, admin, member)
- Invite users via email
- Share itineraries with groups
- Per-user activity progress tracking
- Group notifications system

#### 📊 Progress Tracking

- Mark activities as completed during your trip
- Add personal notes to each activity
- Track overall itinerary completion percentage
- View progress across group members

#### 🔐 Secure Authentication

- JWT-based authentication with 7-day expiry
- Bcrypt password hashing (12 rounds)
- Protected API endpoints
- User preference management

---

## 🏗️ Architecture

### Technology Stack

#### Backend

- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLAlchemy with SQLite (easily upgradable to PostgreSQL)
- **AI**: Google Generative AI (Gemini 2.0 Flash Exp)
- **Authentication**: JWT + Bcrypt
- **Route Optimization**: Geopy + custom algorithms
- **API Documentation**: Automatic OpenAPI (Swagger) docs

#### Frontend

- **Framework**: React 18 with Vite
- **UI Library**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

### Project Structure

```
vandreren_mvp/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Main application file
│   ├── models/                # Database models
│   │   ├── database.py        # DB configuration
│   │   ├── user.py           # User model
│   │   ├── conversation.py   # Chat models
│   │   ├── itinerary.py      # Itinerary model
│   │   ├── group.py          # Group models
│   │   ├── progress.py       # Progress tracking
│   │   ├── notification.py   # Notifications
│   │   └── schemas.py        # Pydantic schemas
│   ├── services/              # Business logic
│   │   └── gemini_service.py # AI integration
│   ├── utils/                 # Utilities
│   │   ├── auth.py           # Authentication
│   │   ├── config.py         # Configuration
│   │   └── route_optimizer.py # Route optimization
│   ├── routes/                # API endpoints
│   │   ├── auth.py           # Auth endpoints
│   │   ├── chat.py           # Chat endpoints
│   │   ├── itinerary.py      # Itinerary endpoints
│   │   ├── groups.py         # Group endpoints
│   │   ├── notifications.py  # Notification endpoints
│   │   └── progress.py       # Progress endpoints
│   └── requirements.txt       # Python dependencies
│
└── frontend/                   # React Frontend
    ├── src/
    │   ├── components/        # Reusable components
    │   │   ├── Header.jsx
    │   │   ├── NotificationBell.jsx
    │   │   └── CreateItineraryModal.jsx
    │   ├── pages/             # Page components
    │   │   ├── AuthPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ChatPage.jsx
    │   │   ├── ItineraryPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── GroupsPage.jsx
    │   │   └── GroupDetailPage.jsx
    │   ├── context/           # Context providers
    │   │   └── AuthContext.jsx
    │   ├── services/          # API services
    │   │   └── api.js
    │   └── App.jsx            # Main app component
    ├── package.json           # npm dependencies
    └── vite.config.js         # Vite configuration
```

---

## 🚀 Installation

### Prerequisites

- **Python 3.9+** installed
- **Node.js 16+** and npm installed
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Backend Setup

1. **Clone the repository**

```bash
git clone https://github.com/UdayrajJhala/vandreren_mvp.git
cd vandreren_mvp/backend
```

2. **Create virtual environment**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Create `.env` file**

```bash
# Create .env in backend directory
echo GEMINI_API_KEY=your_gemini_api_key_here > .env
echo SECRET_KEY=your_secret_key_for_jwt >> .env
```

`.env` example:

```env
GEMINI_API_KEY=AIzaSyC...your_actual_key
SECRET_KEY=your-super-secret-jwt-key-change-in-production
```

5. **Run the backend**

```bash
python main.py
```

Backend will start at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**

```bash
cd ../frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

Frontend will start at: `http://localhost:5173`

---

## 📱 Usage

### Getting Started

1. **Register an Account**

   - Navigate to `http://localhost:5173`
   - Click "Register" and create your account
   - Set your travel preferences (interests, travel style, dietary restrictions)

2. **Create Your First Itinerary**

   - Click "Create New Trip" on the Dashboard
   - Enter destination, dates, budget, and preferences
   - AI generates a complete day-by-day itinerary
   - View optimized routes and estimated costs in INR

3. **Refine with Chat**

   - Open the Chat page
   - Ask questions like:
     - "Add more cultural activities on day 2"
     - "Find budget-friendly restaurants"
     - "What are the best photo spots in Jaipur?"
   - Itinerary updates automatically

4. **Track Your Progress**

   - During your trip, mark activities as completed
   - Add personal notes and photos
   - View completion percentage

5. **Plan Group Travel**
   - Create a travel group
   - Invite friends via email
   - Share itineraries with the group
   - Track individual progress

### Example Queries

**Creating Itineraries:**

- "Plan a 5-day trip to Goa with beach activities"
- "Create a family-friendly itinerary for Rajasthan"
- "Budget backpacking trip to Himachal Pradesh"

**Modifying Itineraries:**

- "Add vegetarian restaurants to day 3"
- "Replace museum visits with adventure activities"
- "Find cheaper accommodation options"

**Travel Advice:**

- "Best time to visit Kerala?"
- "What should I pack for a Ladakh trip?"
- "Local customs I should know about in Varanasi"

---

## 🔌 API Documentation

### Authentication Endpoints

```http
POST /auth/register
POST /auth/login
GET /auth/me
PUT /user/preferences
```

### Itinerary Endpoints

```http
POST /itinerary/create      # Create new itinerary
GET /itineraries            # List all itineraries
GET /itinerary/{id}         # Get specific itinerary
PUT /itinerary/{id}         # Update itinerary
```

### Chat Endpoints

```http
POST /chat                  # Send message to AI
GET /conversations          # List conversations
GET /conversation/{id}/messages  # Get chat history
```

### Group Endpoints

```http
POST /groups                # Create group
GET /groups                 # List user's groups
GET /groups/{id}            # Get group details
POST /groups/{id}/invite    # Invite user to group
POST /groups/{id}/itinerary # Create group itinerary
```

### Notification Endpoints

```http
GET /notifications          # Get all notifications
GET /notifications/unread-count  # Unread count
POST /notifications/{id}/accept  # Accept invitation
POST /notifications/{id}/reject  # Reject invitation
```

### Progress Endpoints

```http
POST /activity/progress     # Update activity progress
GET /activity/progress/{id} # Get itinerary progress
```

**Full API Documentation**: Visit `http://localhost:8000/docs` when backend is running

---

## 🎨 Screenshots

### Dashboard

![Dashboard](https://via.placeholder.com/800x450/4F46E5/FFFFFF?text=Dashboard+View)

### AI Chat Interface

![Chat](https://via.placeholder.com/800x450/10B981/FFFFFF?text=AI+Chat+Interface)

### Itinerary View

![Itinerary](https://via.placeholder.com/800x450/F59E0B/FFFFFF?text=Itinerary+View)

### Group Management

![Groups](https://via.placeholder.com/800x450/8B5CF6/FFFFFF?text=Group+Management)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🔐 Security Features

- ✅ JWT authentication with 7-day token expiry
- ✅ Bcrypt password hashing (12 rounds)
- ✅ HTTPBearer security scheme
- ✅ CORS configuration for production
- ✅ SQL injection protection via SQLAlchemy ORM
- ✅ Input validation with Pydantic
- ✅ Rate limiting ready (can be added)

---

## 🌟 Key Highlights

### AI Integration

- **Query Validation**: Ensures users only receive travel-related responses
- **Retry Logic**: 3 attempts for itinerary generation, 2 for chat
- **Context Awareness**: Maintains conversation history
- **Structured Output**: JSON format for easy parsing and display

### Route Optimization Algorithm

```python
# Uses nearest neighbor algorithm
# Calculates geodesic distances
# Optimizes activity order per day
# Preserves meal times and special events
```

### Modular Architecture

- ✅ 96% reduction in main file size (1862 → 68 lines)
- ✅ Separation of concerns (models, services, routes, utils)
- ✅ Easy to test and maintain
- ✅ Scalable for team development

---

## 📊 Database Schema

### Users

- id, email, username, hashed_password, full_name
- preferences (JSON: interests, travel_style, dietary_restrictions)

### Conversations & Messages

- Conversation: id, user_id, title, timestamps
- Message: id, conversation_id, content, role (user/assistant)

### Itineraries

- id, user_id, conversation_id
- title, destination, start_date, end_date, budget
- itinerary_data (JSON), is_group, group_id

### Groups

- TravelGroup: id, name, description, creator_id
- GroupMember: id, group_id, user_id, role

### Notifications

- id, user_id, type, title, message
- status (pending/accepted/rejected), related_id, inviter_id

### Activity Progress

- id, itinerary_id, user_id
- day, activity_index, completed, notes

---

## 🛠️ Configuration

### Backend Configuration (`backend/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key
DATABASE_URL=sqlite:///./vandreren.db  # Optional
```

### Frontend Configuration (`frontend/src/services/api.js`)

```javascript
const API_BASE_URL = "http://localhost:8000";
```

---

## 🚢 Deployment

### Backend (FastAPI)

**Option 1: Docker**

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Option 2: Cloud Platforms**

- Railway
- Render
- Heroku
- AWS EC2/ECS
- Google Cloud Run

### Frontend (React)

**Build for production:**

```bash
cd frontend
npm run build
```

**Deploy to:**

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Database Migration (SQLite → PostgreSQL)

```python
# Update backend/models/database.py
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/vandreren"
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful natural language processing
- **FastAPI** for the excellent web framework
- **React** community for amazing frontend tools
- **Geopy** for geocoding and distance calculations
- **Tailwind CSS** for beautiful UI components

---

## 📧 Contact & Support

- **Developer**: Udayraj Jhala
- **GitHub**: [@UdayrajJhala](https://github.com/UdayrajJhala)
- **Project Link**: [https://github.com/UdayrajJhala/vandreren_mvp](https://github.com/UdayrajJhala/vandreren_mvp)

### Issues & Feature Requests

Found a bug or have a feature request? Please [open an issue](https://github.com/UdayrajJhala/vandreren_mvp/issues).

---

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)

- [ ] Map integration with Google Maps
- [ ] Weather forecasts for destinations
- [ ] Flight and hotel booking integration
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### Version 1.2

- [ ] Collaborative planning (real-time editing)
- [ ] Photo sharing within groups
- [ ] Budget tracking during trip
- [ ] Expense splitting
- [ ] Travel blog generation

### Version 2.0

- [ ] AI-powered photo recognition
- [ ] Voice assistant integration
- [ ] Offline mode
- [ ] AR navigation
- [ ] Social features (follow travelers)

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Google Gemini AI](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

<div align="center">

**Made with ❤️ by Udayraj Jhala**

⭐ Star this repo if you find it helpful!

</div>

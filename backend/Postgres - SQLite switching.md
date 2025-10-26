## 🔄 Switching Between SQLite and PostgreSQL

The system automatically detects which database to use based on the `DATABASE_URL`:

- **SQLite**: `DATABASE_URL=sqlite:///./vandreren.db`
- **PostgreSQL**: `DATABASE_URL=postgresql://user:pass@host/db`

No code changes needed - just update the `.env` file

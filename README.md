# 🍲 Intelligent Cooking Recommendation System

An intelligent recipe recommendation system that helps users discover cooking ideas based on what they like. It uses real-world data scraped from Hebbar's Kitchen, vectorized for similarity search, and served through a clean Next.js interface.

## 🚀 Tech Stack

- **Frontend**: Next.js
- **Backend API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **Scraping**: Python (requests, BeautifulSoup)
- **ETL Workflow**: Apache Airflow
- **Embedding**: Sentence Transformers + TF-IDF
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
intelligent-cooking-app/
│
├── airflow/                # Airflow DAGs for ETL
│   └── dags/recipe_etl.py
│
├── backend/                # Next.js API Routes
│   └── pages/api/recommend.js
│
├── frontend/               # Next.js Frontend Pages
│   └── pages/index.js
│   └── pages/recipe/[id].js
│
├── scripts/                # Python scripts
│   └── scrape.py
│   └── vectorize.py
│
├── supabase/               # DB schema, SQL setup
│   └── schema.sql
│
├── .env                    # Env vars (Supabase, API keys)
├── docker-compose.yml      # For local Airflow orchestration
└── README.md
```

## 🧠 Hybrid Recommendation System

The system uses a multi-layered approach to provide accurate recipe recommendations:

1. **Semantic Understanding**
   - Uses Sentence Transformers (all-MiniLM-L6-v2)
   - Converts recipe text into embeddings
   - Understands context and cooking methods

2. **Ingredient Matching**
   - Uses TF-IDF vectorization
   - Matches similar ingredients
   - Considers ingredient combinations

3. **Rule-based Filtering**
   - Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
   - Maximum cooking time
   - Nutritional information

## 🎯 Features

- **Recipe Browsing**
  - Modern, responsive UI
  - Recipe cards with images
  - Quick view of cooking time and difficulty

- **Smart Recommendations**
  - Hybrid matching algorithm
  - Dietary restriction filters
  - Cooking time constraints
  - Ingredient-based matching

- **Recipe Details**
  - Full recipe instructions
  - Ingredient lists
  - Nutritional information
  - Similar recipe suggestions

- **User Preferences**
  - Save favorite recipes
  - Set dietary restrictions
  - Track cooking history

## 🛠️ Setup Instructions

1. Clone the repository
2. Set up Supabase project & run schema.sql
3. Configure .env with Supabase URL + API keys
4. Run Airflow using Docker Compose to populate DB
5. Start the app with Next.js (npm run dev)

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run Airflow locally:
   ```bash
   docker-compose up
   ```

## 📊 Database Schema

The system uses the following main tables:

- **recipes**: Stores recipe details including title, description, ingredients, etc.
- **recipe_embeddings**: Stores vector embeddings for semantic and ingredient matching
- **user_preferences**: Stores user preferences and ratings

## 🔍 Recommendation Algorithm

The hybrid recommendation system combines:

1. **Semantic Similarity** (70% weight)
   - Uses Sentence Transformers
   - Understands cooking methods and techniques
   - Matches similar recipe styles

2. **Ingredient Similarity** (30% weight)
   - Uses TF-IDF vectorization
   - Matches similar ingredients
   - Considers ingredient combinations

3. **Filtering**
   - Dietary restrictions
   - Maximum cooking time
   - Nutritional constraints

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Made with 🍅 by Tejanmayi


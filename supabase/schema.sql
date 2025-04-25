-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    ingredients TEXT[],
    instructions TEXT[],
    cooking_time INTEGER,
    difficulty TEXT,
    image_url TEXT,
    source_url TEXT,
    dietary_restrictions TEXT[],  -- e.g., ['vegetarian', 'gluten-free', 'vegan']
    calories INTEGER,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recipe_embeddings table for vector search
CREATE TABLE recipe_embeddings (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    embedding vector(384),  -- Using Sentence Transformers default dimension
    ingredient_tfidf vector(1000),  -- TF-IDF vector for ingredients
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    dietary_restrictions TEXT[],
    max_cooking_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX recipe_embeddings_idx ON recipe_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for ingredient TF-IDF search
CREATE INDEX recipe_ingredient_tfidf_idx ON recipe_embeddings 
USING ivfflat (ingredient_tfidf vector_cosine_ops)
WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for recipes table
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for hybrid recipe matching
CREATE OR REPLACE FUNCTION match_recipes_hybrid(
    query_embedding vector(384),
    query_ingredient_tfidf vector(1000),
    dietary_restrictions TEXT[] DEFAULT NULL,
    max_cooking_time INTEGER DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id INTEGER,
    similarity FLOAT,
    ingredient_similarity FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_matches AS (
        SELECT 
            r.id,
            (r.embedding <=> query_embedding) as similarity,
            (r.ingredient_tfidf <=> query_ingredient_tfidf) as ingredient_similarity,
            CASE 
                WHEN r.ingredient_tfidf <=> query_ingredient_tfidf < 0.5 THEN 0.8
                ELSE 0.2
            END as ingredient_weight
        FROM recipe_embeddings r
        JOIN recipes rec ON r.recipe_id = rec.id
        WHERE 
            (dietary_restrictions IS NULL OR rec.dietary_restrictions && dietary_restrictions)
            AND (max_cooking_time IS NULL OR rec.cooking_time <= max_cooking_time)
    )
    SELECT 
        id,
        similarity,
        ingredient_similarity,
        (similarity * (1 - ingredient_weight) + ingredient_similarity * ingredient_weight) as combined_score
    FROM semantic_matches
    WHERE similarity < match_threshold
    ORDER BY combined_score ASC
    LIMIT match_count;
END;
$$; 
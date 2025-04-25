import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    id, 
    limit = 5,
    dietary_restrictions = null,
    max_cooking_time = null
  } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    // Get the recipe details
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, title, description, ingredients, instructions, cooking_time, difficulty, image_url, dietary_restrictions')
      .eq('id', id)
      .single();

    if (recipeError) {
      throw recipeError;
    }

    // Get the embeddings for the input recipe
    const { data: embeddings, error: embeddingError } = await supabase
      .from('recipe_embeddings')
      .select('embedding, ingredient_tfidf')
      .eq('recipe_id', id)
      .single();

    if (embeddingError) {
      throw embeddingError;
    }

    // Parse dietary restrictions if provided
    let parsedDietaryRestrictions = null;
    if (dietary_restrictions) {
      parsedDietaryRestrictions = dietary_restrictions.split(',');
    }

    // Parse max cooking time if provided
    let parsedMaxCookingTime = null;
    if (max_cooking_time) {
      parsedMaxCookingTime = parseInt(max_cooking_time);
    }

    // Find similar recipes using hybrid matching
    const { data: similarRecipes, error: similarError } = await supabase
      .rpc('match_recipes_hybrid', {
        query_embedding: embeddings.embedding,
        query_ingredient_tfidf: embeddings.ingredient_tfidf,
        dietary_restrictions: parsedDietaryRestrictions,
        max_cooking_time: parsedMaxCookingTime,
        match_threshold: 0.7,
        match_count: parseInt(limit)
      });

    if (similarError) {
      throw similarError;
    }

    // Get full recipe details for similar recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, description, ingredients, instructions, cooking_time, difficulty, image_url, dietary_restrictions')
      .in('id', similarRecipes.map(r => r.id));

    if (recipesError) {
      throw recipesError;
    }

    // Combine recipe details with similarity scores
    const recipesWithScores = recipes.map(recipe => {
      const match = similarRecipes.find(r => r.id === recipe.id);
      return {
        ...recipe,
        similarity_score: match.combined_score,
        semantic_similarity: match.similarity,
        ingredient_similarity: match.ingredient_similarity
      };
    });

    return res.status(200).json({
      input_recipe: recipe,
      recommendations: recipesWithScores
    });

  } catch (error) {
    console.error('Error in recommendation API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
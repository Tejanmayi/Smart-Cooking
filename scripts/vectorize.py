import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
import logging
from typing import List, Dict, Any
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecipeVectorizer:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """Initialize the vectorizer with pre-trained models."""
        self.model = SentenceTransformer(model_name)
        self.tfidf = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)  # Include both single words and pairs
        )
        logger.info(f"Loaded model: {model_name}")
    
    def prepare_text(self, recipe: Dict[str, Any]) -> str:
        """Prepare text for vectorization by combining relevant fields."""
        text_parts = [
            recipe['title'],
            recipe['description'],
            ' '.join(recipe['ingredients']),
            ' '.join(recipe['instructions'])
        ]
        return ' '.join(text_parts)
    
    def prepare_ingredients(self, recipe: Dict[str, Any]) -> str:
        """Prepare ingredients text for TF-IDF vectorization."""
        # Clean and normalize ingredients
        ingredients = [
            ingredient.lower().strip()
            for ingredient in recipe['ingredients']
        ]
        return ' '.join(ingredients)
    
    def vectorize_recipes(self, recipes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Vectorize a list of recipes using both semantic and TF-IDF approaches."""
        # Prepare texts for vectorization
        texts = [self.prepare_text(recipe) for recipe in recipes]
        ingredient_texts = [self.prepare_ingredients(recipe) for recipe in recipes]
        
        # Generate semantic embeddings
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        # Generate TF-IDF vectors for ingredients
        tfidf_matrix = self.tfidf.fit_transform(ingredient_texts)
        tfidf_vectors = tfidf_matrix.toarray()
        
        # Combine recipes with their embeddings
        vectorized_recipes = []
        for recipe, embedding, tfidf_vector in zip(recipes, embeddings, tfidf_vectors):
            vectorized_recipe = {
                **recipe,
                'embedding': embedding.tolist(),
                'ingredient_tfidf': tfidf_vector.tolist()
            }
            vectorized_recipes.append(vectorized_recipe)
        
        return vectorized_recipes

def main():
    # Load recipes from JSON file
    input_file = 'recipes.json'
    if not os.path.exists(input_file):
        logger.error(f"Input file {input_file} not found")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        recipes = json.load(f)
    
    # Initialize vectorizer
    vectorizer = RecipeVectorizer()
    
    # Vectorize recipes
    vectorized_recipes = vectorizer.vectorize_recipes(recipes)
    
    # Save vectorized recipes
    output_file = 'vectorized_recipes.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(vectorized_recipes, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Vectorized {len(vectorized_recipes)} recipes successfully")

if __name__ == "__main__":
    main() 
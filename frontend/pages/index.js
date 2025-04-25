import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Available dietary restrictions
const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'low-carb',
  'keto',
  'paleo'
];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState([]);
  const [maxCookingTime, setMaxCookingTime] = useState(60); // Default 60 minutes

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .limit(12);

      if (error) throw error;
      setRecipes(data);
    } catch (error) {
      setError('Error fetching recipes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (recipeId) => {
    try {
      const queryParams = new URLSearchParams({
        id: recipeId,
        limit: 5
      });

      if (selectedDietaryRestrictions.length > 0) {
        queryParams.append('dietary_restrictions', selectedDietaryRestrictions.join(','));
      }

      if (maxCookingTime) {
        queryParams.append('max_cooking_time', maxCookingTime);
      }

      const response = await fetch(`/api/recommend?${queryParams}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setSelectedRecipe(data.input_recipe);
      setRecommendations(data.recommendations);
    } catch (error) {
      setError('Error fetching recommendations');
      console.error('Error:', error);
    }
  };

  const toggleDietaryRestriction = (restriction) => {
    setSelectedDietaryRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Smart Cooking - Recipe Recommendations</title>
        <meta name="description" content="Discover new recipes based on what you like" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Smart Cooking 🍳
        </h1>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
          
          {/* Dietary Restrictions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-gray-700">Dietary Restrictions</h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_RESTRICTIONS.map(restriction => (
                <button
                  key={restriction}
                  onClick={() => toggleDietaryRestriction(restriction)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedDietaryRestrictions.includes(restriction)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Time */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700">Maximum Cooking Time</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={maxCookingTime}
                onChange={(e) => setMaxCookingTime(parseInt(e.target.value))}
                className="w-64"
              />
              <span className="text-gray-600">{maxCookingTime} minutes</span>
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {recipe.image_url && (
                <div className="relative h-48">
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {recipe.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {recipe.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.dietary_restrictions?.map(restriction => (
                    <span
                      key={restriction}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {recipe.cooking_time} mins
                  </span>
                  <button
                    onClick={() => getRecommendations(recipe.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
                  >
                    Get Similar Recipes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations Section */}
        {selectedRecipe && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Similar Recipes to {selectedRecipe.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {recipe.image_url && (
                    <div className="relative h-48">
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      {recipe.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {recipe.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recipe.dietary_restrictions?.map(restriction => (
                        <span
                          key={restriction}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {recipe.cooking_time} mins
                      </span>
                      <Link href={`/recipe/${recipe.id}`}>
                        <a className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300">
                          View Recipe
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>Made with ❤️ by Tejanmayi</p>
        </div>
      </footer>
    </div>
  );
} 
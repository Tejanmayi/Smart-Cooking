import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RecipePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [recipe, setRecipe] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      // Fetch recipe details
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;
      setRecipe(recipeData);

      // Fetch recommendations
      const response = await fetch(`/api/recommend?id=${id}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setRecommendations(data.recommendations);
    } catch (error) {
      setError('Error fetching recipe details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Recipe not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{recipe.title} - Smart Cooking</title>
        <meta name="description" content={recipe.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Link href="/">
          <a className="text-blue-500 hover:text-blue-600 mb-4 inline-block">
            ← Back to Recipes
          </a>
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {recipe.image_url && (
            <div className="relative h-96">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              {recipe.title}
            </h1>

            <div className="flex items-center mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-4">
                {recipe.cooking_time} mins
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {recipe.difficulty}
              </span>
            </div>

            <p className="text-gray-600 mb-8">
              {recipe.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Ingredients
                </h2>
                <ul className="list-disc list-inside space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-gray-600">
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Instructions
                </h2>
                <ol className="list-decimal list-inside space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="text-gray-600">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Similar Recipes You Might Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {rec.image_url && (
                    <div className="relative h-48">
                      <Image
                        src={rec.image_url}
                        alt={rec.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      {rec.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {rec.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {rec.cooking_time} mins
                      </span>
                      <Link href={`/recipe/${rec.id}`}>
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
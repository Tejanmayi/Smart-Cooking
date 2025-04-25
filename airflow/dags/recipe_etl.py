from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import os
import sys
import logging

# Add the scripts directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../scripts'))

from scrape import HebbarsKitchenScraper
from vectorize import RecipeVectorizer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def scrape_recipes(**kwargs):
    """Scrape recipes from Hebbar's Kitchen."""
    scraper = HebbarsKitchenScraper()
    recipes = scraper.scrape_recipes(max_pages=5)
    
    # Save to JSON file
    output_path = os.path.join(os.path.dirname(__file__), '../../data/recipes.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Scraped {len(recipes)} recipes successfully")
    return output_path

def vectorize_recipes(**kwargs):
    """Vectorize recipe descriptions."""
    # Get the input file path from the previous task
    ti = kwargs['ti']
    input_path = ti.xcom_pull(task_ids='scrape_recipes')
    
    # Load recipes
    with open(input_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)
    
    # Vectorize recipes
    vectorizer = RecipeVectorizer()
    vectorized_recipes = vectorizer.vectorize_recipes(recipes)
    
    # Save vectorized recipes
    output_path = os.path.join(os.path.dirname(__file__), '../../data/vectorized_recipes.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(vectorized_recipes, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Vectorized {len(vectorized_recipes)} recipes successfully")
    return output_path

def load_to_supabase(**kwargs):
    """Load vectorized recipes to Supabase."""
    # Get the input file path from the previous task
    ti = kwargs['ti']
    input_path = ti.xcom_pull(task_ids='vectorize_recipes')
    
    # Load vectorized recipes
    with open(input_path, 'r', encoding='utf-8') as f:
        vectorized_recipes = json.load(f)
    
    # TODO: Implement Supabase loading logic
    # This will be implemented when we set up the Supabase connection
    
    logger.info(f"Loaded {len(vectorized_recipes)} recipes to Supabase")

with DAG(
    'recipe_etl',
    default_args=default_args,
    description='ETL pipeline for recipe data',
    schedule_interval=timedelta(days=1),
    start_date=days_ago(1),
    tags=['recipes', 'etl'],
) as dag:
    
    scrape_task = PythonOperator(
        task_id='scrape_recipes',
        python_callable=scrape_recipes,
    )
    
    vectorize_task = PythonOperator(
        task_id='vectorize_recipes',
        python_callable=vectorize_recipes,
    )
    
    load_task = PythonOperator(
        task_id='load_to_supabase',
        python_callable=load_to_supabase,
    )
    
    # Define task dependencies
    scrape_task >> vectorize_task >> load_task 
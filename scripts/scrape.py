import requests
from bs4 import BeautifulSoup
import json
import time
import random
from typing import List, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HebbarsKitchenScraper:
    BASE_URL = "https://hebbarskitchen.com"
    
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def get_recipe_links(self, max_pages: int = 10) -> List[str]:
        """Get recipe links from the main page."""
        recipe_links = []
        
        for page in range(1, max_pages + 1):
            try:
                url = f"{self.BASE_URL}/page/{page}/"
                response = self.session.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                articles = soup.find_all('article', class_='post')
                
                for article in articles:
                    link = article.find('a')['href']
                    recipe_links.append(link)
                
                logger.info(f"Scraped page {page}, found {len(articles)} recipes")
                time.sleep(random.uniform(1, 3))  # Be nice to the server
                
            except Exception as e:
                logger.error(f"Error scraping page {page}: {str(e)}")
                continue
        
        return recipe_links
    
    def parse_recipe(self, url: str) -> Dict[str, Any]:
        """Parse a single recipe page."""
        try:
            response = self.session.get(url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract recipe details
            title = soup.find('h1', class_='entry-title').text.strip()
            description = soup.find('div', class_='entry-content').find('p').text.strip()
            
            # Extract ingredients
            ingredients = []
            ingredients_section = soup.find('div', class_='wprm-recipe-ingredients-container')
            if ingredients_section:
                for li in ingredients_section.find_all('li'):
                    ingredients.append(li.text.strip())
            
            # Extract instructions
            instructions = []
            instructions_section = soup.find('div', class_='wprm-recipe-instructions-container')
            if instructions_section:
                for li in instructions_section.find_all('li'):
                    instructions.append(li.text.strip())
            
            # Extract cooking time
            cooking_time = None
            time_section = soup.find('div', class_='wprm-recipe-time-container')
            if time_section:
                cooking_time = int(time_section.find('span', class_='wprm-recipe-time').text.strip().split()[0])
            
            # Extract image URL
            image_url = None
            image = soup.find('div', class_='entry-content').find('img')
            if image:
                image_url = image.get('src')
            
            return {
                'title': title,
                'description': description,
                'ingredients': ingredients,
                'instructions': instructions,
                'cooking_time': cooking_time,
                'difficulty': 'Medium',  # Default value
                'image_url': image_url,
                'source_url': url
            }
            
        except Exception as e:
            logger.error(f"Error parsing recipe {url}: {str(e)}")
            return None
    
    def scrape_recipes(self, max_pages: int = 10) -> List[Dict[str, Any]]:
        """Scrape multiple recipes."""
        recipe_links = self.get_recipe_links(max_pages)
        recipes = []
        
        for link in recipe_links:
            recipe = self.parse_recipe(link)
            if recipe:
                recipes.append(recipe)
                logger.info(f"Successfully scraped recipe: {recipe['title']}")
            time.sleep(random.uniform(1, 3))  # Be nice to the server
        
        return recipes

def main():
    scraper = HebbarsKitchenScraper()
    recipes = scraper.scrape_recipes(max_pages=5)  # Start with 5 pages
    
    # Save to JSON file
    with open('recipes.json', 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Scraped {len(recipes)} recipes successfully")

if __name__ == "__main__":
    main() 
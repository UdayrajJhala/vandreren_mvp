"""
Place Review Crawler with Semantic Search
Single-file implementation using Selenium, BeautifulSoup, and Sentence Transformers
"""

import time
import re
from typing import List, Dict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer, util
import torch
import numpy as np

class PlaceReviewCrawler:
    def __init__(self, headless: bool = True):
        """Initialize crawler with Selenium WebDriver"""
        self.options = Options()
        if headless:
            self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--disable-blink-features=AutomationControlled')
        self.driver = None
        self.reviews = []
        
        # Initialize semantic search model
        print("Loading semantic search model...")
        self.model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
        self.review_embeddings = None
        
    def start_driver(self):
        """Start the WebDriver"""
        self.driver = webdriver.Chrome(options=self.options)
        
    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            
    def scrape_google_maps_reviews(self, place_name: str, location: str, max_reviews: int = 20) -> List[Dict]:
        """
        Scrape reviews from Google Maps
        """
        try:
            self.start_driver()
            
            # Construct search query
            query = f"{place_name} {location}"
            search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            
            print(f"Searching for: {query}")
            self.driver.get(search_url)
            time.sleep(3)
            
            # Click on first result
            try:
                first_result = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/maps/place/']"))
                )
                first_result.click()
                time.sleep(2)
            except Exception as e:
                print(f"Error clicking first result: {e}")
                return []
            
            # Click on reviews tab
            try:
                reviews_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(@aria-label, 'Reviews')]"))
                )
                reviews_button.click()
                time.sleep(2)
            except Exception as e:
                print(f"Could not find reviews button: {e}")
            
            # Scroll to load reviews
            scrollable_div = self.driver.find_element(By.CSS_SELECTOR, "div[role='main']")
            for _ in range(5):
                self.driver.execute_script('arguments[0].scrollTop = arguments[0].scrollHeight', scrollable_div)
                time.sleep(1)
            
            # Parse reviews
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            review_elements = soup.find_all('div', {'data-review-id': True})
            
            reviews_data = []
            for idx, review in enumerate(review_elements[:max_reviews]):
                try:
                    # Extract reviewer name
                    author_elem = review.find('div', class_=re.compile('d4r55'))
                    author = author_elem.text if author_elem else "Anonymous"
                    
                    # Extract rating
                    rating_elem = review.find('span', {'role': 'img', 'aria-label': re.compile('stars')})
                    rating = rating_elem['aria-label'].split()[0] if rating_elem else "N/A"
                    
                    # Extract review text
                    text_elem = review.find('span', class_=re.compile('wiI7pd'))
                    review_text = text_elem.text if text_elem else ""
                    
                    # Extract date
                    date_elem = review.find('span', class_=re.compile('rsqaWe'))
                    date = date_elem.text if date_elem else "N/A"
                    
                    if review_text:
                        reviews_data.append({
                            'id': idx,
                            'author': author,
                            'rating': rating,
                            'date': date,
                            'text': review_text,
                            'place': place_name,
                            'location': location
                        })
                        
                except Exception as e:
                    print(f"Error parsing review: {e}")
                    continue
            
            self.reviews.extend(reviews_data)
            print(f"Scraped {len(reviews_data)} reviews")
            return reviews_data
            
        except Exception as e:
            print(f"Error during scraping: {e}")
            return []
        finally:
            self.close_driver()
    
    def scrape_tripadvisor_reviews(self, place_url: str, max_reviews: int = 20) -> List[Dict]:
        """
        Scrape reviews from TripAdvisor
        """
        try:
            self.start_driver()
            self.driver.get(place_url)
            time.sleep(3)
            
            # Scroll to load reviews
            for _ in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            review_elements = soup.find_all('div', {'data-automation': 'reviewCard'})
            
            reviews_data = []
            for idx, review in enumerate(review_elements[:max_reviews]):
                try:
                    # Extract reviewer name
                    author_elem = review.find('a', class_=re.compile('BMQDV'))
                    author = author_elem.text if author_elem else "Anonymous"
                    
                    # Extract rating
                    rating_elem = review.find('svg', class_=re.compile('UctUV'))
                    rating = rating_elem['aria-label'].split()[0] if rating_elem else "N/A"
                    
                    # Extract review text
                    text_elem = review.find('span', class_=re.compile('QewHA'))
                    review_text = text_elem.text if text_elem else ""
                    
                    # Extract date
                    date_elem = review.find('div', class_=re.compile('biGQs'))
                    date = date_elem.text if date_elem else "N/A"
                    
                    if review_text:
                        reviews_data.append({
                            'id': idx,
                            'author': author,
                            'rating': rating,
                            'date': date,
                            'text': review_text,
                            'source': 'TripAdvisor'
                        })
                        
                except Exception as e:
                    print(f"Error parsing review: {e}")
                    continue
            
            self.reviews.extend(reviews_data)
            print(f"Scraped {len(reviews_data)} reviews from TripAdvisor")
            return reviews_data
            
        except Exception as e:
            print(f"Error during TripAdvisor scraping: {e}")
            return []
        finally:
            self.close_driver()
    
    def build_semantic_index(self):
        """
        Build semantic search index from scraped reviews
        """
        if not self.reviews:
            print("No reviews to index!")
            return
        
        print("Building semantic search index...")
        review_texts = [r['text'] for r in self.reviews]
        self.review_embeddings = self.model.encode(review_texts, convert_to_tensor=True)
        print(f"Indexed {len(self.reviews)} reviews")
    
    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Perform semantic search on reviews
        """
        if self.review_embeddings is None:
            print("Index not built! Call build_semantic_index() first.")
            return []
        
        print(f"\nSearching for: '{query}'")
        
        # Encode query
        query_embedding = self.model.encode(query, convert_to_tensor=True)
        
        # Calculate cosine similarity
        cos_scores = util.cos_sim(query_embedding, self.review_embeddings)[0]
        
        # Get top k results
        top_results = torch.topk(cos_scores, k=min(top_k, len(self.reviews)))
        
        results = []
        for score, idx in zip(top_results[0], top_results[1]):
            review = self.reviews[idx]
            results.append({
                'score': float(score),
                'review': review
            })
        
        return results
    
    def print_search_results(self, results: List[Dict]):
        """Pretty print search results"""
        print(f"\n{'='*80}")
        print(f"Found {len(results)} relevant reviews:")
        print(f"{'='*80}\n")
        
        for i, result in enumerate(results, 1):
            review = result['review']
            score = result['score']
            
            print(f"{i}. [Similarity: {score:.3f}] - Rating: {review['rating']}")
            print(f"   Author: {review['author']} | Date: {review['date']}")
            print(f"   Review: {review['text'][:200]}...")
            print(f"   Place: {review.get('place', 'N/A')} - {review.get('location', 'N/A')}")
            print(f"{'-'*80}\n")


def main():
    """
    Example usage of the PlaceReviewCrawler
    """
    # Initialize crawler
    crawler = PlaceReviewCrawler(headless=False)
    
    # Example 1: Scrape Google Maps reviews
    print("Starting Google Maps scraping...")
    crawler.scrape_google_maps_reviews(
        place_name="restaurants",
        location="Mumbai India",
        max_reviews=15
    )
    
    # You can scrape multiple places
    crawler.scrape_google_maps_reviews(
        place_name="hotels",
        location="Pune India",
        max_reviews=15
    )
    
    # Example 2: Scrape TripAdvisor (uncomment to use)
    # crawler.scrape_tripadvisor_reviews(
    #     place_url="https://www.tripadvisor.com/Restaurant_Review-...",
    #     max_reviews=20
    # )
    
    # Build semantic search index
    crawler.build_semantic_index()
    
    # Perform semantic searches
    search_queries = [
        "great food and ambiance",
        "poor service and long wait times",
        "family friendly atmosphere",
        "clean and hygienic",
        "expensive but worth it"
    ]
    
    for query in search_queries:
        results = crawler.semantic_search(query, top_k=3)
        crawler.print_search_results(results)
        time.sleep(1)
    
    # Interactive search mode
    print("\n" + "="*80)
    print("Interactive Search Mode (type 'exit' to quit)")
    print("="*80)
    
    while True:
        user_query = input("\nEnter your search query: ").strip()
        if user_query.lower() == 'exit':
            break
        
        if user_query:
            results = crawler.semantic_search(user_query, top_k=5)
            crawler.print_search_results(results)


if __name__ == "__main__":
    main()

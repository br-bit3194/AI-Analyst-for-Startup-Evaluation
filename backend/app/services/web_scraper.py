import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional, Set, Tuple
import logging
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

def async_retry(max_retries=3, delay=1):
    """Decorator for async functions to retry on exception."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(delay * (attempt + 1))
                        logger.warning(f"Retry {attempt + 1}/{max_retries} for {func.__name__} after error: {str(e)}")
                    continue
            raise last_exception
        return wrapper
    return decorator

class WebScraper:
    def __init__(self, max_pages: int = 10, max_depth: int = 2):
        self.visited_urls: Set[str] = set()
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
        self.timeout = aiohttp.ClientTimeout(total=30)

    def is_valid_url(self, url: str, base_domain: str) -> bool:
        """Check if URL belongs to the same domain and is not already visited."""
        if not url or url in self.visited_urls:
            return False
        
        # Skip non-http(s) URLs and different domains
        parsed = urlparse(url)
        if not parsed.netloc or parsed.netloc != base_domain:
            return False
            
        # Skip non-html resources
        if any(ext in url.lower() for ext in ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip']):
            return False
            
        return True

    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        # Remove extra whitespace and newlines
        return ' '.join(text.split())

    @async_retry(max_retries=3, delay=1)
    async def extract_content(self, url: str, base_domain: str, depth: int = 0) -> List[Dict[str, str]]:
        """Extract content from a webpage and its links asynchronously."""
        if depth > self.max_depth or len(self.visited_urls) >= self.max_pages:
            return []
            
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            try:
                async with session.get(url, headers=self.headers) as response:
                    response.raise_for_status()
                    html = await response.text()
                    
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract main content
                    content = self.clean_text(soup.get_text())
                    
                    # Store the page content
                    self.visited_urls.add(url)
                    pages = [{
                        'url': url,
                        'content': content,
                        'depth': depth
                    }]
                    
                    # If we've reached max pages, return
                    if len(self.visited_urls) >= self.max_pages:
                        return pages
                        
                    # Find and follow internal links
                    if depth < self.max_depth:
                        links = []
                        for link in soup.find_all('a', href=True):
                            next_url = urljoin(url, link['href'])
                            if self.is_valid_url(next_url, base_domain):
                                links.append(next_url)
                        
                        # Process links concurrently
                        tasks = []
                        for next_url in links:
                            if len(self.visited_urls) >= self.max_pages:
                                break
                            tasks.append(self.extract_content(next_url, base_domain, depth + 1))
                        
                        if tasks:
                            results = await asyncio.gather(*tasks, return_exceptions=True)
                            for result in results:
                                if isinstance(result, list):
                                    pages.extend(result)
                                    
                    return pages
                    
            except Exception as e:
                logger.error(f"Error extracting content from {url}: {str(e)}", exc_info=True)
                return []

    @async_retry(max_retries=3, delay=1)
    async def get_website_content(self, url: str) -> str:
        """Get clean text content from a website asynchronously."""
        try:
            # Reset visited URLs for each new website
            self.visited_urls = set()
            
            # Extract base domain
            parsed = urlparse(url)
            base_domain = parsed.netloc
            
            # Start scraping from the homepage
            content = await self.extract_content(url, base_domain)
            
            # Combine all content
            full_text = "\n\n".join(page['content'] for page in content)
            return full_text
            
        except Exception as e:
            logger.error(f"Error scraping website {url}: {str(e)}", exc_info=True)
            return ""

    @async_retry(max_retries=3, delay=1)
    async def scrape_website(self, base_url: str) -> List[Dict[str, str]]:
        """Main method to scrape a website."""
        self.visited_urls = set()
        parsed_url = urlparse(base_url)
        base_domain = parsed_url.netloc
        
        if not base_domain:
            raise ValueError("Invalid URL provided")
            
        # Ensure URL has scheme
        if not parsed_url.scheme:
            base_url = f"https://{base_url}"
            
        return await self.extract_content(base_url, base_domain)

    @async_retry(max_retries=3, delay=1)
    async def get_website_content(self, url: str) -> str:
        """Get cleaned website content as a single string."""
        try:
            pages = await self.scrape_website(url)
            if not pages:
                logger.warning(f"No content found for URL: {url}")
                return ""
                
            content_parts = []
            for page in pages:
                if not isinstance(page, dict):
                    continue
                    
                if page.get('title'):
                    content_parts.append(f"# {page['title']}")
                if page.get('content'):
                    content_parts.append(str(page['content']))
                content_parts.append("\n" + "="*80 + "\n")
                
            return "\n".join(content_parts)
            
        except Exception as e:
            logger.error(f"Error in get_website_content for {url}: {str(e)}", exc_info=True)
            return ""

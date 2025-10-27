from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from ..models.analysis import AnalysisHistory, AnalysisInput, AnalysisResult, CommitteeMember, AnalysisSummary
from ..db.mongodb import get_database
from .web_scraper import WebScraper
from .vector_store import VectorStore
from .llm_service import LLMService
import re
import json

logger = logging.getLogger(__name__)

class AnalysisStorage:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.analysis_history
    
    async def create_analysis(self, analysis_data: dict) -> str:
        """Create a new analysis record in the database."""
        result = await self.collection.insert_one(analysis_data)
        return str(result.inserted_id)
    
    async def get_analysis(self, analysis_id: str, user_id: str) -> Optional[dict]:
        """Retrieve an analysis by ID, ensuring it belongs to the user."""
        try:
            analysis = await self.collection.find_one({
                "_id": ObjectId(analysis_id),
                "user_id": user_id
            })
            return analysis
        except:
            return None
    
    async def list_analyses(self, user_id: str, limit: int = 10, skip: int = 0) -> List[dict]:
        """List all analyses for a user, most recent first."""
        cursor = self.collection.find({"user_id": user_id})\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)
        return await cursor.to_list(length=limit)
    
    async def update_analysis(self, analysis_id: str, user_id: str, update_data: dict) -> bool:
        """Update an existing analysis."""
        result = await self.collection.update_one(
            {"_id": ObjectId(analysis_id), "user_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0

class AnalysisService:
    def __init__(self):
        self.web_scraper = WebScraper()
        self.vector_store = VectorStore()
        self.storage = AnalysisStorage()
        self.llm_service = LLMService()
        
    async def create_analysis_record(self, user_id: str, pitch: str, website_url: Optional[str] = None) -> str:
        """Create a new analysis record in the database and return its ID."""
        analysis_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "status": "processing",
            "input": {
                "pitch": pitch,
                "website_url": website_url,
                "additional_context": {}
            },
            "analysis": None,
            "committee_debate": None,
            "summary": None
        }
        
        return await self.storage.create_analysis(analysis_data)
    
    async def save_analysis_results(
        self, 
        analysis_id: str, 
        user_id: str,
        analysis_result: Optional[Dict] = None,
        committee_debate: Optional[List[Dict]] = None,
        summary: Optional[Dict] = None
    ) -> bool:
        """Save analysis results to the database."""
        update_data = {}
        
        if analysis_result:
            update_data["analysis"] = analysis_result
            update_data["status"] = "completed"
            
        if committee_debate:
            update_data["committee_debate"] = committee_debate
            
        if summary:
            update_data["summary"] = summary
            
        return await self.storage.update_analysis(analysis_id, user_id, update_data)
    
    async def get_analysis(self, analysis_id: str, user_id: str) -> Optional[Dict]:
        """Retrieve a specific analysis by ID."""
        return await self.storage.get_analysis(analysis_id, user_id)
    
    async def list_user_analyses(self, user_id: str, limit: int = 10, skip: int = 0) -> List[Dict]:
        """List all analyses for a specific user."""
        return await self.storage.list_analyses(user_id, limit, skip)

    def extract_domain(self, url: str) -> str:
        """Extract domain name from URL."""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        return domain.replace('www.', '').split('.')[0]

    async def analyze_startup(self, user_id: str, pitch: str, website_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze a startup pitch and optional website, combining data from both sources.
        
        Args:
            user_id: ID of the user requesting the analysis
            pitch: The startup pitch text
            website_url: Optional website URL to scrape and analyze
            
        Returns:
            Dict containing analysis ID and status
        """
        try:
            # Create analysis record in database
            analysis_id = await self.create_analysis_record(user_id, pitch, website_url)
            
            # Start analysis in background
            import asyncio
            asyncio.create_task(self._perform_analysis(analysis_id, user_id, pitch, website_url))
            
            return {
                'analysis_id': analysis_id,
                'status': 'processing',
                'message': 'Analysis started. Check back later for results.'
            }
            
        except Exception as e:
            logger.error(f"Error starting analysis: {str(e)}")
            # Update status if analysis was created but failed
            if 'analysis_id' in locals():
                await self.save_analysis_results(
                    analysis_id, 
                    user_id,
                    None,  # No analysis result
                    None,  # No committee debate
                    {
                        'error': str(e),
                        'status': 'failed'
                    }
                )
            raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")
    
    async def _perform_analysis(self, analysis_id: str, user_id: str, pitch: str, website_url: Optional[str] = None):
        """Perform the actual analysis and save results to database."""
        try:
            analysis = {}
            
            # Analyze pitch
            logger.info("Analyzing pitch...")
            pitch_analysis = await self._analyze_pitch(pitch)
            analysis['pitch_analysis'] = pitch_analysis
            
            # Analyze website if URL is provided
            if website_url:
                try:
                    logger.info(f"Scraping website: {website_url}")
                    website_pages = await self.web_scraper.scrape_website(website_url)
                    
                    if website_pages and isinstance(website_pages, list):
                        # Combine all pages into a single text with page separators
                        combined_text = "\n\n--- PAGE BREAK ---\n\n".join(
                            f"PAGE: {page.get('url', 'N/A')}\n{page.get('content', '')}"
                            for page in website_pages
                            if isinstance(page, dict) and page.get('content')
                        )
                        
                        if combined_text:
                            # Store website data in vector store
                            domain = self.extract_domain(website_url)
                            store_id = f"website_{domain}_{int(datetime.utcnow().timestamp())}"
                            
                            logger.info("Adding website content to vector store...")
                            await self.vector_store.add_document(
                                id=store_id,
                                text=combined_text,
                                metadata={
                                    'url': website_url,
                                    'domain': domain,
                                    'title': website_pages[0].get('title', '') if website_pages else '',
                                    'description': website_pages[0].get('description', '') if website_pages else '',
                                    'timestamp': datetime.utcnow().isoformat(),
                                    'num_pages': len(website_pages)
                                }
                            )
                            
                            # Create a website_data dict for further processing
                            website_data = {
                                'text': combined_text,
                                'url': website_url,
                                'title': website_pages[0].get('title', '') if website_pages else '',
                                'description': website_pages[0].get('description', '') if website_pages else '',
                                'num_pages': len(website_pages)
                            }
                        
                        # Get context from vector store
                        logger.info("Searching vector store for relevant context...")
                        vector_context = await self.vector_store.search_similar(website_url, pitch, k=5)
                        
                        # Analyze website content
                        logger.info("Analyzing website content...")
                        website_analysis = await self._analyze_website(vector_context)
                        if not isinstance(website_analysis, dict):
                            website_analysis = {}
                            
                        website_analysis.update({
                            'domain': domain,
                            'status': 'processed',
                            'store_id': store_id,
                            'content_length': len(website_data['text']),
                            'content_preview': (website_data['text'][:500] + '...') if len(website_data['text']) > 500 else website_data['text']
                        })
                        analysis['website_analysis'] = website_analysis
                        
                    else:
                        # Handle case where website content couldn't be scraped
                        logger.warning(f"No content was scraped from {website_url}")
                        analysis['website_analysis'] = {
                            'error': "Failed to scrape website content",
                            'status': 'error',
                            'domain': self.extract_domain(website_url)
                        }
                        
                except Exception as e:
                    logger.error(f"Error analyzing website {website_url}: {str(e)}", exc_info=True)
                    analysis['website_analysis'] = {
                        'error': f"Failed to analyze website: {str(e)}",
                        'status': 'error',
                        'domain': self.extract_domain(website_url) if website_url else 'unknown'
                    }
            
            # Combine analyses
            logger.info("Combining analyses...")
            analysis['combined_analysis'] = await self._combine_analyses(
                analysis['pitch_analysis'], 
                analysis['website_analysis']
            )
            
            # Generate recommendations
            logger.info("Generating recommendations...")
            analysis['recommendations'] = await self._generate_recommendations(analysis['combined_analysis'])
            
            logger.info("Analysis completed successfully")
            analysis['summary'] = 'Analysis complete'
            analysis['has_website_data'] = bool(website_url and analysis['website_analysis'].get('status') in ['processed', 'already_exists'])
            
            # Generate committee debate
            committee_debate = await self._generate_committee_debate(analysis['combined_analysis'])
            
            # Generate summary
            summary = await self._generate_summary(analysis['combined_analysis'], committee_debate)
            
            # Save results to database
            await self.save_analysis_results(
                analysis_id,
                user_id,
                analysis['combined_analysis'],
                committee_debate,
                summary
            )
            
            return analysis
            
        except Exception as e:
            error_msg = f"Error analyzing startup: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            # Update status to failed in database
            await self.save_analysis_results(
                analysis_id,
                user_id,
                None,
                None,
                {
                    'error': str(e),
                    'status': 'failed'
                }
            )
            
            # Add error to analysis if it exists
            if 'analysis' in locals():
                analysis['error'] = error_msg
                return analysis
                
            # If we don't have an analysis object, raise the exception
            raise ValueError(error_msg)

    async def _analyze_pitch(self, pitch: str) -> Dict[str, Any]:
        """Analyze the startup pitch text."""
        # Create a prompt for pitch analysis
        prompt = f"""Analyze the following startup pitch and provide a detailed analysis.
        Focus on the following aspects:
        - Business model
        - Target market
        - Value proposition
        - Competitive advantage
        - Potential risks

        Pitch: {pitch}

        Return a valid JSON object with the following structure:
        {{
            "business_model": "...",
            "target_market": "...",
            "value_proposition": "...",
            "competitive_advantage": "...",
            "potential_risks": "..."
        }}
        
        Ensure the response is valid JSON with double quotes for all strings and no trailing commas."""
        
        try:
            response = await self.llm_service.generate_text(prompt, response_format="json")
            return response
        except Exception as e:
            logger.error(f"Error analyzing pitch: {str(e)}")
            return {"error": f"Failed to analyze pitch: {str(e)}"}

    async def _analyze_website(self, vector_context: List[Dict]) -> Dict[str, Any]:
        """Analyze website content from vector store context."""
        if not vector_context:
            return {"error": "No website content available for analysis"}
            
        # Combine all context into a single text
        context_text = "\n\n".join([doc['content'] for doc in vector_context if 'content' in doc])
        
        # Create a prompt for website analysis
        prompt = f"""Analyze the following website content and extract key information:
        
        {context_text}
        
        Return a valid JSON object with the following structure:
        {{
            "company_overview": "Brief summary of the company",
            "products_services": ["List", "of", "main", "products", "or", "services"],
            "team_info": "Information about the team if available",
            "social_proof": ["Testimonials", "press", "mentions", "or", "customer", "logos"],
            "call_to_action": "What action does the website want visitors to take"
        }}
        
        Ensure all strings are properly escaped and the response is valid JSON."""
        
        try:
            analysis = await llm.generate_text(prompt, response_format="json")
            return analysis if isinstance(analysis, dict) else json.loads(analysis)
        except Exception as e:
            logger.error(f"Error analyzing website: {str(e)}", exc_info=True)
            return {"error": str(e)}

    async def _combine_analyses(self, pitch_analysis: Dict, website_analysis: Dict) -> Dict[str, Any]:
        """Combine pitch and website analysis into a comprehensive view."""
        llm = LLMService()
        
        prompt = f"""Combine the following startup analyses into a single comprehensive analysis:
        
        PITCH ANALYSIS:
        {json.dumps(pitch_analysis, indent=2)}
        
        WEBSITE ANALYSIS:
        {json.dumps(website_analysis, indent=2)}
        
        Create a comprehensive analysis and return a valid JSON object with the following structure:
        {{
            "business_overview": "Combined company overview",
            "market_opportunity": "Analysis of the target market",
            "competitive_landscape": ["Key", "competitors", "and", "differentiators"],
            "team_strength": "Evaluation of the team",
            "risk_assessment": ["Potential", "risks", "and", "mitigations"],
            "investment_potential": "Overall assessment of investment potential"
        }}
        
        Ensure the response is valid JSON with proper escaping and no trailing commas."""
        
        try:
            combined = await llm.generate_text(prompt, response_format="json")
            return combined if isinstance(combined, dict) else json.loads(combined)
        except Exception as e:
            logger.error(f"Error combining analyses: {str(e)}", exc_info=True)
            return {"error": str(e)}

    async def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate investment recommendations based on the analysis."""
        llm = LLMService()
        
        prompt = f"""Based on the following startup analysis, provide 3-5 specific, actionable recommendations for the investment committee.
        
        Analysis:
        {json.dumps(analysis, indent=2)}
        
        Return a valid JSON array of recommendation strings like this:
        [
            "First specific recommendation",
            "Second specific recommendation",
            "Third specific recommendation"
        ]
        
        Ensure the response is valid JSON with proper escaping and no trailing commas."""
        
        try:
            recommendations = await llm.generate_text(prompt, response_format="json")
            return recommendations if isinstance(recommendations, list) else json.loads(recommendations)
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
            return [f"Error generating recommendations: {str(e)}"]
    
    async def _generate_committee_debate(self, analysis: Dict) -> List[Dict]:
        """Generate simulated committee debate."""
        # This is a placeholder - in a real app, this would call an LLM
        # to generate different perspectives
        return [
            {
                'name': 'Alex Chen',
                'role': 'VC Partner - Fintech',
                'comment': 'The market opportunity is substantial, but I have concerns about the competitive landscape. We need to see more differentiation in their approach.',
                'sentiment': 'neutral'
            },
            {
                'name': 'Jamie Smith',
                'role': 'Investment Analyst',
                'comment': 'The team has strong domain expertise and the product addresses a clear pain point. The financial projections seem realistic.',
                'sentiment': 'positive'
            },
            {
                'name': 'Taylor Wong',
                'role': 'VC Partner - Enterprise Tech',
                'comment': 'The go-to-market strategy needs more clarity. The market is crowded, and I\'m not convinced they have a strong enough moat.',
                'sentiment': 'negative'
            }
        ]
    
    async def _generate_summary(self, analysis: Dict, committee_debate: List[Dict]) -> Dict:
        """Generate a summary of the analysis and committee debate."""
        # This is a placeholder - in a real app, this would call an LLM
        # to generate a summary based on the analysis and debate
        
        # Count sentiments
        sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
        for debate in committee_debate:
            sentiment = debate.get('sentiment', 'neutral')
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1
        
        # Determine overall sentiment
        if sentiment_counts['positive'] > sentiment_counts['negative']:
            overall_sentiment = 'positive'
        elif sentiment_counts['negative'] > sentiment_counts['positive']:
            overall_sentiment = 'negative'
        else:
            overall_sentiment = 'neutral'
        
        return {
            'status': 'completed',
            'verdict': overall_sentiment.upper(),
            'confidence': 0.85,  # Example confidence score
            'key_highlights': [
                analysis.get('business_overview', '')[:100] + '...',
                analysis.get('market_opportunity', '')[:100] + '...',
                f"Committee sentiment: {overall_sentiment} ({sentiment_counts['positive']} positive, {sentiment_counts['neutral']} neutral, {sentiment_counts['negative']} negative)"
            ],
            'recommendations': analysis.get('recommendations', [])
        }

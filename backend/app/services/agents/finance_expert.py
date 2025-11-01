from typing import Dict, Any, Optional, Union
import aiohttp
import json
from urllib.parse import quote_plus
from fastapi import UploadFile
import PyPDF2
from io import BytesIO
from ..llm_client import call_llm
from .base_agent import BaseAgent, AgentResponse

class FinanceExpert(BaseAgent):
    """Agent responsible for financial analysis and projections."""
    
    def __init__(self):
        super().__init__(name="FinanceExpert", role="Analyze financial health and projections")
    
    async def _scrape_valuation_data(self, company_name: str) -> Optional[Dict[str, Any]]:
        """Scrape valuation data from the web."""
        if not company_name:
            return None
            
        try:
            # Extract company name from pitch (simple implementation)
            # In a real implementation, you might want to use NER or ask the LLM to extract the company name
            search_query = f"{company_name} valuation site:crunchbase.com OR site:techcrunch.com OR site:wsj.com"
            search_url = f"https://www.google.com/search?q={quote_plus(search_query)}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, headers=headers) as response:
                    if response.status == 200:
                        text = await response.text()
                        # In a real implementation, you would parse the HTML to extract valuation data
                        # This is a simplified example
                        return {
                            'source': 'web_search',
                            'search_url': search_url,
                            'snippet': text[:500] + '...'  # Just get a preview
                        }
        except Exception as e:
            print(f"Error scraping valuation data: {str(e)}")
            return None
        
        return None

    async def extract_text_from_pdf(self, file: UploadFile) -> str:
        """Extract text from an uploaded PDF file."""
        try:
            contents = await file.read()
            pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")

    async def analyze(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Analyze the financial aspects of the pitch or PDF.
        
        Args:
            input_data: Can contain:
                - 'pitch': Text content to analyze
                - 'file': UploadFile object for PDF processing
                - 'company_name': Optional company name for additional context
        """
        try:
            # Handle both direct text and file uploads
            pitch = input_data.get('pitch', '')
            file = input_data.get('file')
            
            # If file is provided, extract text from it
            if file and hasattr(file, 'filename') and file.filename.lower().endswith('.pdf'):
                try:
                    pitch = await self.extract_text_from_pdf(file)
                    if not pitch.strip():
                        return self._format_response(
                            {"error": "The uploaded PDF appears to be empty or could not be read"},
                            success=False
                        )
                except Exception as e:
                    return self._format_response(
                        {"error": f"Error processing PDF: {str(e)}"},
                        success=False
                    )
            
            # Extract company name for web search (simple implementation)
            company_name = input_data.get('company_name')
            if not company_name:
                import re
                name_matches = re.findall(r'(?:[A-Z][a-z]+\s+){1,3}(?:Inc\.?|Ltd\.?|LLC|Corp\.?|Pty\s+Ltd\.?|GmbH)\b', pitch)
                if name_matches:
                    company_name = name_matches[0]
            
            # Scrape valuation data in parallel with LLM analysis
            valuation_data = {}
            if company_name:
                valuation_data = await self._scrape_valuation_data(company_name)
            
            system_prompt = """You are a Data-Driven Financial Expert evaluating a startup's financial health and projections. Your analysis must be NUMBERS-FIRST, with clear metrics and quantitative insights.
            
            For ALL analyses, follow these RULES:
            1. LEAD WITH NUMERICAL VALUES in your analysis
            2. Use clear, standardized units (USD, months, %)
            3. Include industry benchmarks for context
            4. Calculate implied metrics when possible
            5. Use data tables for multi-point comparisons
            
            If financial data is explicitly mentioned, analyze and QUANTIFY:
            1. Revenue Model:
               - Pricing structure (e.g., $X/month per user)
               - Customer segments and their contribution
               - Growth rate (MoM, QoQ, YoY)
               
            2. Unit Economics (show calculations):
               - CAC: $X per customer
               - LTV: $X per customer
               - LTV:CAC ratio: X:1 (benchmark: 3:1)
               - Payback period: X months
               
            3. Financial Health:
               - Burn rate: $X/month
               - Runway: X months
               - Gross margin: X%
               - Cash balance: $X
               
            4. Key Metrics:
               - MRR/ARR: $X (X% growth)
               - Churn: X% monthly
               - Gross Merchandise Value (if applicable): $X
               
            5. Valuation (show method):
               - Pre-money: $X
               - Post-money: $X
               - Multiple: Xx revenue/ARR
               - Method: [DCF/Revenue Multiple/Comparables]
            
            If data is missing, INFER using:
            - Industry benchmarks (cite sources)
            - Business model comps
            - Stage-appropriate metrics
            - Team size and hiring plans
            - Funding history
            
            Format response as JSON with the following structure:
            {
                "financial_summary": {
                    "key_metrics": [
                        {"name": "Valuation", "value": "$X", "benchmark": "$Y", "delta": "+X%"},
                        {"name": "MRR", "value": "$X", "growth": "X% MoM"},
                        {"name": "Burn Rate", "value": "$X/mo", "runway": "X months"},
                        {"name": "LTV:CAC", "value": "X:1", "benchmark": "3:1"}
                    ]
                },
                "revenue_analysis": {
                    "model": "SaaS/Marketplace/E-commerce",
                    "pricing_tiers": [
                        {"plan": "Basic", "price": "$X/mo", "features": []},
                        {"plan": "Pro", "price": "$Y/mo", "features": []}
                    ],
                    "customer_metrics": {
                        "arpu": "$X",
                        "growth_rate": "X% MoM",
                        "churn_rate": "X%"
                    },
                    "inferred": boolean
                },
                "unit_economics": {
                    "cac": {"value": X, "unit": "$", "benchmark": "$Y", "analysis": ""},
                    "ltv": {"value": X, "unit": "$", "ltv_cac_ratio": X},
                    "payback_period": {"value": X, "unit": "months", "benchmark": "<12mo"},
                    "gross_margin": {"value": X, "unit": "%", "benchmark": "X%"}
                },
                "financial_health": {
                    "burn_rate": {"monthly": X, "annual": X},
                    "runway": X,
                    "cash_balance": X,
                    "funding_rounds": [
                        {"date": "YYYY-MM-DD", "amount": X, "type": "Seed/Series A", "valuation": X}
                    ]
                },
                "projections": {
                    "next_12_months": {
                        "revenue": X,
                        "customers": X,
                        "employees": X,
                        "gross_margin": "X%"
                    },
                    "sensitivity_analysis": {
                        "best_case": {"revenue": X, "valuation": X},
                        "base_case": {"revenue": X, "valuation": X},
                        "worst_case": {"revenue": X, "valuation": X}
                    }
                },
                "valuation_analysis": {
                    "pre_money": X,
                    "post_money": X,
                    "method": "DCF/Revenue Multiple/Comparables",
                    "revenue_multiple": X,
                    "comparable_companies": [
                        {"name": "Company A", "multiple": X, "revenue": X},
                        {"name": "Company B", "multiple": X, "revenue": X}
                    ]
                },
                "data_quality": {
                    "has_explicit_financials": boolean,
                    "missing_metrics": ["metric1", "metric2"],
                    "confidence": 0.0-1.0
                },
                "executive_summary": "[1-2 paragraph summary with key numbers in **bold**]"
            }"""
            
            # Prepare the user prompt with clear instructions
            user_prompt = f"""Please analyze the following business information and provide financial insights. 
            If specific financial data is not available, make reasonable inferences based on the business model and industry standards.
            
            BUSINESS INFORMATION:
            {pitch}
            
            If the above doesn't contain financial data, please make reasonable assumptions based on:
            - Business model (B2B, B2C, SaaS, Marketplace, etc.)
            - Industry benchmarks
            - Company stage (pre-seed, seed, Series A, etc.)
            - Team size and hiring plans
            - Any metrics or numbers mentioned
            
            Be sure to mark any inferred data with "inferred": true and provide confidence levels."""
            
            # Add valuation data to the prompt if available
            if valuation_data:
                user_prompt += f"\n\nADDITIONAL VALUATION DATA FROM WEB SEARCH:\n{json.dumps(valuation_data, indent=2)}"
            
            response = await call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model="gemini-2.5-pro"
            )
            
            # Process the response
            try:
                # Try to parse the response as JSON
                import json
                if isinstance(response, str):
                    # Clean the response string first
                    response = response.strip()
                    if response.startswith('```json'):
                        response = response[7:].strip().rstrip('`')
                    
                    # First try to parse the entire response as JSON
                    try:
                        parsed_response = json.loads(response)
                        # Check for both 'financial_analysis' and direct structure
                        if 'financial_analysis' in parsed_response:
                            financial_analysis = parsed_response['financial_analysis']
                            confidence = parsed_response.get('confidence', 0.8)
                        elif all(key in parsed_response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                            financial_analysis = parsed_response
                            confidence = parsed_response.get('confidence', 0.8)
                        else:
                            # If structure doesn't match, use the entire response
                            financial_analysis = parsed_response
                            confidence = 0.8
                    except json.JSONDecodeError:
                        # If parsing fails, try to fix common JSON issues
                        try:
                            # Try to find JSON object in the response
                            start = response.find('{')
                            end = response.rfind('}') + 1
                            if start >= 0 and end > start:
                                json_str = response[start:end]
                                parsed_response = json.loads(json_str)
                                # Try both possible structures
                                if 'financial_analysis' in parsed_response:
                                    financial_analysis = parsed_response['financial_analysis']
                                elif all(key in parsed_response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                                    financial_analysis = parsed_response
                                else:
                                    financial_analysis = parsed_response
                                confidence = parsed_response.get('confidence', 0.8)
                            else:
                                raise ValueError("No valid JSON found in response")
                        except Exception as e:
                            # If all else fails, return the raw response with an error
                            financial_analysis = {
                                "error": f"Failed to parse financial analysis: {str(e)}",
                                "raw_response": response
                            }
                            confidence = 0.1
                elif isinstance(response, dict):
                    # If response is already a dict, use it directly
                    if 'financial_analysis' in response:
                        financial_analysis = response['financial_analysis']
                    elif all(key in response for key in ['revenue_analysis', 'unit_economics', 'financial_health', 'projections']):
                        financial_analysis = response
                    else:
                        financial_analysis = response
                    confidence = response.get('confidence', 0.8)
                else:
                    raise ValueError(f"Unexpected response type: {type(response)}")
                
                # Ensure financial_analysis is a dictionary
                if not isinstance(financial_analysis, dict):
                    financial_analysis = {
                        "error": f"Unexpected financial_analysis type: {type(financial_analysis).__name__}",
                        "raw_response": response
                    }
                
                # Ensure confidence is a float
                try:
                    confidence = float(confidence)
                except (TypeError, ValueError):
                    confidence = 0.5
                
                # Ensure we have all required sections with proper defaults
                default_section = {
                    "analysis": "Not available",
                    "strengths": [],
                    "concerns": []
                }
                
                # Ensure all required sections exist
                financial_analysis = {
                    "revenue_analysis": financial_analysis.get('revenue_analysis', default_section.copy()),
                    "unit_economics": financial_analysis.get('unit_economics', default_section.copy()),
                    "financial_health": financial_analysis.get('financial_health', default_section.copy()),
                    "projections": financial_analysis.get('projections', default_section.copy()),
                    "confidence": confidence
                }
                
                return self._format_response(
                    financial_analysis,
                    confidence=confidence
                )
                
            except Exception as e:
                # If parsing fails, wrap the response in a structured format
                error_msg = f"Failed to process financial analysis: {str(e)}"
                print(f"Error in FinanceExpert: {error_msg}")
                # Return a structured error response with all required sections
                error_response = {
                    "revenue_analysis": {
                        "analysis": f"Error: {error_msg}",
                        "strengths": [],
                        "concerns": ["Failed to analyze"]
                    },
                    "unit_economics": {
                        "analysis": "Analysis unavailable due to error",
                        "cac": None,
                        "ltv": None,
                        "payback_period": None
                    },
                    "financial_health": {
                        "analysis": "Analysis unavailable due to error",
                        "burn_rate": None,
                        "runway_months": None
                    },
                    "projections": {
                        "analysis": "Analysis unavailable due to error",
                        "assumptions": [],
                        "risks": []
                    },
                    "error": error_msg,
                    "raw_response": str(response)[:500]
                }
                
                return self._format_response(
                    error_response,
                    success=False,
                    error=error_msg,
                    confidence=0.0
                )
            
        except Exception as e:
            return self._format_response(
                {},
                success=False,
                error=f"Financial analysis failed: {str(e)}",
                confidence=0.0
            )

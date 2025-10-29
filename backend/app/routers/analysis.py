from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Depends, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import asyncio
import uuid
import httpx
from datetime import datetime

from app.services.committee_coordinator import CommitteeCoordinator
from app.utils.agent_logger import AgentLogger
from app.services.analysis_service import AnalysisService
from app.middleware.auth_middleware import get_current_user
from app.services.websocket_manager import websocket_manager
from typing import Optional

# Initialize router
router = APIRouter(prefix="/analysis", tags=["analysis"])

# Initialize committee
committee = CommitteeCoordinator()

# Initialize logger for the analysis router
router_logger = AgentLogger("analysis_router")

# In-memory storage for analysis results and callbacks (in production, use a database)
analysis_results = {}
analysis_callbacks = {}

# Models
class AnalysisRequest(BaseModel):
    pitch: str
    callback_url: Optional[str] = None  # For webhook notifications

class AnalysisResponse(BaseModel):
    analysisId: str  # Changed to match frontend expectation
    status: str
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# WebSocket endpoint
@router.websocket("/ws/status/{analysis_id}")
async def websocket_endpoint(websocket: WebSocket, analysis_id: str):
    """WebSocket endpoint for real-time progress updates"""
    await websocket_manager.connect(analysis_id, websocket)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(10)
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(analysis_id, websocket)

@router.post("", 
            response_model=AnalysisResponse,
            status_code=status.HTTP_202_ACCEPTED,
            summary="Start a new analysis",
            response_description="Analysis started successfully")
async def start_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Start a new analysis of a startup pitch (alias for /evaluate endpoint).
    Returns immediately with an analysis ID that can be used to check the status.
    """
    return await evaluate_pitch(request, background_tasks)

async def run_analysis(analysis_id: str, pitch: str):
    """
    Background task to run the analysis with comprehensive logging.
    
    Args:
        analysis_id: Unique ID for this analysis
        pitch: The startup pitch to analyze
    """
    return {}
    logger = AgentLogger("analysis_worker", analysis_id)
    
    async def update_progress(message: str, progress: int):
        """Helper to send progress updates to WebSocket clients"""
        await websocket_manager.send_progress_update(analysis_id, message, progress)
        logger.log_event("progress_update", message, {"progress": progress})
    
    try:
        # Log analysis start
        logger.log_event(
            "analysis_started",
            "Starting analysis of startup pitch",
            {"pitch_length": len(pitch) if pitch else 0}
        )
        
        # Run the committee analysis with progress updates
        start_time = datetime.utcnow()
        await update_progress("Starting analysis...", 10)
        
        # Run analysis with progress tracking
        result = await committee.analyze_pitch_with_progress(
            pitch,
            progress_callback=lambda msg, pct: update_progress(msg, 10 + int(pct * 0.8))  # 10-90% for analysis
        )
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        await update_progress("Finalizing results...", 95)
        
        # Log analysis completion
        try:
            # Safely get the summary, handling cases where it might not be a string
            summary = result.get("summary", "")
            if not isinstance(summary, str):
                summary = str(summary)
            summary_preview = summary[:500] if summary else ""
            
            logger.log_event(
                "analysis_completed",
                "Successfully completed pitch analysis",
                {
                    "duration_seconds": duration,
                    "result_summary": summary_preview
                }
            )
        except Exception as e:
            logger.log_event(
                "analysis_log_error",
                f"Error logging analysis completion: {str(e)}",
                {"error": str(e), "result_type": type(result).__name__},
                level="error"
            )
        
        # Format the result
        formatted_result = {
            "analysisId": analysis_id,
            "status": "completed",
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store the result
        analysis_results[analysis_id] = formatted_result
        await update_progress("Analysis complete!", 100)
        
        # If there's a webhook URL, notify it
        if analysis_callbacks.get(analysis_id):
            webhook_start = datetime.utcnow()
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=formatted_result,
                        timeout=10.0
                    )
                    logger.log_event(
                        "webhook_sent",
                        f"Successfully sent webhook to {analysis_callbacks[analysis_id]}",
                        {
                            "status_code": response.status_code,
                            "duration_seconds": (datetime.utcnow() - webhook_start).total_seconds()
                        }
                    )
            except Exception as e:
                logger.log_event(
                    "webhook_failed",
                    f"Failed to send webhook: {str(e)}",
                    level="error"
                )
    
    except Exception as e:
        # Log the error
        logger.log_event(
            "analysis_failed",
            f"Error during analysis: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        
        # Store the error
        error_result = {
            "analysisId": analysis_id,
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        analysis_results[analysis_id] = error_result
        
        # If there's a webhook URL, notify it about the error
        if analysis_callbacks.get(analysis_id):
            try:
                webhook_start = datetime.utcnow()
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        analysis_callbacks[analysis_id],
                        json=error_result,
                        timeout=10.0
                    )
                    logger.log_event(
                        "error_webhook_sent",
                        f"Sent error notification to webhook",
                        {
                            "status_code": response.status_code,
                            "duration_seconds": (datetime.utcnow() - webhook_start).total_seconds()
                        }
                    )
            except Exception as webhook_error:
                logger.log_event(
                    "error_webhook_failed",
                    f"Failed to send error webhook: {str(webhook_error)}",
                    level="error"
                )

@router.post("/evaluate", response_model=AnalysisResponse)
async def evaluate_pitch(
    request: AnalysisRequest, 
    background_tasks: BackgroundTasks
):
    """
    Start an analysis of a startup pitch.
    Returns immediately with an analysis ID that can be used to check the status.
    """
    # Generate a unique ID for this analysis
    analysis_id = str(uuid.uuid4())
    
    # Store initial status
    analysis_results[analysis_id] = {
        'status': 'processing',
        'started_at': str(asyncio.get_event_loop().time())
    }
    
    # Store callback URL if provided
    if request.callback_url:
        analysis_callbacks[analysis_id] = request.callback_url
    
    # Start the analysis in the background
    background_tasks.add_task(
        run_analysis,
        analysis_id=analysis_id,
        pitch=request.pitch
    )
    
    # Return immediately with the analysis ID
    return {
        "analysisId": analysis_id,
        "status": "processing",
        "message": "Analysis started. Use the analysis_id to check status."
    }
    # }

@router.get("/status/{analysis_id}", response_model=AnalysisResponse)
@router.get("/{analysis_id}", response_model=AnalysisResponse, include_in_schema=False)
async def get_analysis_status(analysis_id: str, request: Request):
    """
    Get the status of a previously started analysis.
    
    Args:
        analysis_id: The ID of the analysis to check
        request: The incoming request (for logging)
    """
    import time
    time.sleep(5)

    return {
            "analysisId": "19038f62-6e59-4eda-b50e-e02a6d8bb055",
            "status": "completed",
            "result": {
                "analysis_id": "3503771126763528393",
                "start_time": "2025-10-29T17:44:36.322466",
                "duration_seconds": 89.929936,
                "agents": {
                "RiskAnalyst": {
                    "success": True,
                    "data": {
                    "risk_analysis": {
                        "risk_factors": [
                        {
                            "category": "Execution",
                            "description": "The core value proposition relies on a complex and costly reverse logistics network for nationwide doorstep pickups. Achieving the promised convenience ('as easy as ordering food delivery') at scale, while maintaining positive unit economics, is a massive operational challenge.",
                            "impact": "High",
                            "likelihood": "High",
                            "confidence": 0.9,
                            "mitigation": "Implement a phased city-by-city rollout, focusing on high-density urban areas first. Utilize a hybrid logistics model (in-house fleet for core zones, 3PL partners for expansion) and invest heavily in route optimization technology."
                        },
                        {
                            "category": "Financial",
                            "description": "The 'free' B2C model is entirely dependent on revenue from Extended Producer Responsibility (EPR) partnerships. A failure to secure a sufficient volume of these partnerships, or pricing pressure from producers, could make the consumer-facing business financially unsustainable.",
                            "impact": "High",
                            "likelihood": "Medium",
                            "confidence": 0.85,
                            "mitigation": "Diversify revenue by aggressively expanding the paid B2B service for corporates. Secure multi-year contracts with large electronics brands to create a stable, predictable revenue base for the B2C operations."
                        },
                        {
                            "category": "Competitive",
                            "description": "The business faces significant competition from the entrenched, low-cost informal sector, which often pays consumers for their e-waste. Competing against a 'paid' model with a 'free' service may limit uptake for higher-value electronics.",
                            "impact": "Medium",
                            "likelihood": "High",
                            "confidence": 0.9,
                            "mitigation": "Focus marketing on trust, certified data destruction, and environmental impact, which are key differentiators from the informal sector. Implement a rewards or loyalty program to incentivize repeat usage."
                        },
                        {
                            "category": "Team",
                            "description": "The pitch provides no information about the founding team's background. A business with heavy operational, logistical, and B2B sales components requires a team with proven experience in these specific domains. The absence of this information is a major red flag.",
                            "impact": "High",
                            "likelihood": "Medium",
                            "confidence": 0.95,
                            "mitigation": "Clearly outline the core team's expertise and track record in logistics, waste management, enterprise sales, and technology. Highlight key advisory roles if direct experience is lacking."
                        },
                        {
                            "category": "Market",
                            "description": "Despite growing awareness, consumer inertia remains a significant barrier. The perceived effort of ordering a box, packing it, and scheduling a pickup may be too high for a large segment of the target market, leading to lower-than-projected adoption rates for the B2C service.",
                            "impact": "Medium",
                            "likelihood": "Medium",
                            "confidence": 0.75,
                            "mitigation": "Streamline the user onboarding and ordering process to be as frictionless as possible. Use targeted marketing campaigns to educate consumers on the ease and importance of the service."
                        },
                        {
                            "category": "Regulatory",
                            "description": "The business model's viability is linked to the strict enforcement of EPR regulations. If government enforcement is lax or inconsistent, producers will have less incentive to pay for certified recycling services, directly impacting a primary revenue stream.",
                            "impact": "High",
                            "likelihood": "Low",
                            "confidence": 0.7,
                            "mitigation": "Build relationships with policymakers and industry bodies to advocate for strong enforcement. Diversify services to include B2B ESG reporting and consulting, which are less dependent on specific waste regulations."
                        },
                        {
                            "category": "Technology",
                            "description": "The promise of 'guaranteed data destruction' carries significant liability. Any failure in the process, or inability to provide auditable proof, could result in severe reputational damage, loss of corporate clients, and potential legal action.",
                            "impact": "High",
                            "likelihood": "Low",
                            "confidence": 0.8,
                            "mitigation": "Partner with top-tier, certified recycling facilities that provide internationally recognized data destruction certificates. Implement a robust, blockchain-based tracking system to provide an immutable audit trail for each device."
                        }
                        ],
                        "overall_risk": {
                        "level": "High",
                        "explanation": "The startup targets a large, regulation-driven market with a compelling solution. However, the overall risk is high due to extreme operational complexity in reverse logistics, a critical financial dependency on securing EPR partnerships to fund the B2C model, and a lack of information on the team's ability to execute. While the B2B model shows promise, the B2C vision is fraught with execution and financial hurdles.",
                        "confidence": 0.8
                        },
                        "key_risks_summary": "The most critical risks are the immense challenge and cost of executing nationwide reverse logistics, the financial fragility of the 'free' consumer model which is dependent on EPR funding, and the unknown execution capability of the team.",
                        "recommendations": [
                        "Provide a detailed breakdown of unit economics for the B2C model, demonstrating a clear path to profitability funded by EPR partnerships.",
                        "Present a phased operational and geographical rollout plan to mitigate logistical risks and manage capital burn.",
                        "Detail the founding team's specific experience in logistics, waste management, and enterprise sales.",
                        "Showcase concrete traction metrics, such as the number of corporate clients, tons of e-waste processed, and the value of signed EPR contracts.",
                        "Develop a clear strategy to differentiate from and compete with the informal sector, which often pays users for their waste."
                        ],
                        "confidence": 0.85
                    }
                    },
                    "error": None,
                    "confidence": 0.85
                },
                "MarketExpert": {
                    "success": True,
                    "data": {
                    "market_analysis": {
                        "market_size_validation": {
                        "tam": {
                            "value": "2.5 - 3.5 Billion",
                            "currency": "USD",
                            "year": 2024,
                            "source": "Mordor Intelligence, Allied Market Research, and internal analysis based on EPR service fees.",
                            "confidence": 0.85,
                            "notes": "Total Addressable Market (TAM) is the overall e-waste management service market in India. The pitch's claim of a 'multi-billion-dollar market' is validated by external reports. This value is derived from service fees for collection, transportation, segregation, data destruction, and certified recycling, driven by the government's Extended Producer Responsibility (EPR) mandates, not just the commodity value of the waste."
                        },
                        "sam": {
                            "value": "1.2 - 1.8 Billion",
                            "currency": "USD",
                            "year": 2024,
                            "source": "Internal Estimation",
                            "confidence": 0.75,
                            "notes": "Serviceable Addressable Market (SAM) is the segment of the market Ecobox can currently target: B2C and B2B (SMEs, Corporates) e-waste collection services in major urban centers where logistics are feasible. This assumes urban areas account for ~60-70% of addressable e-waste value and that these customer segments are the primary targets."
                        },
                        "som": {
                            "value": "20 - 30 Million",
                            "currency": "USD",
                            "year": 2026,
                            "source": "Internal Projection",
                            "confidence": 0.65,
                            "notes": "Serviceable Obtainable Market (SOM) is a realistic 3-year target, aiming to capture 1-2% of the SAM. This reflects the intense competition from the unorganized sector and the operational challenges of scaling a reverse logistics network. Achieving this would still represent significant early-stage traction and revenue."
                        },
                        "validation_notes": "The market size is substantial and growing, primarily propelled by regulatory tailwinds (EPR). The key challenge is not the market's existence but the ability to convert it profitably, especially the B2C segment which relies on EPR subsidies. The B2B segment offers a more direct and reliable revenue stream.",
                        "confidence": 0.8
                        },
                        "growth_projections": [
                        {
                            "year": 2025,
                            "growth_rate": 16.5,
                            "market_size": "~3.5 Billion",
                            "currency": "USD",
                            "drivers": [
                            "Stricter enforcement of E-Waste (Management) Rules, 2022.",
                            "Increased corporate focus on ESG compliance and reporting.",
                            "Rising consumer awareness of environmental issues."
                            ],
                            "confidence": 0.85
                        },
                        {
                            "year": 2027,
                            "growth_rate": 16.5,
                            "market_size": "~4.7 Billion",
                            "currency": "USD",
                            "drivers": [
                            "Expansion of EPR framework to cover more products.",
                            "Digitization of compliance, creating demand for platforms like Ecobox.",
                            "Maturation of the circular economy ecosystem in India."
                            ],
                            "confidence": 0.8
                        }
                        ],
                        "competitive_positioning": {
                        "key_competitors": [
                            {
                            "name": "Unorganized Sector (Kabadiwalas)",
                            "market_share": ">85%",
                            "strengths": [
                                "Extremely low operational cost.",
                                "Deeply entrenched, hyper-local networks.",
                                "Often provide immediate cash payment for waste."
                            ],
                            "weaknesses": [
                                "Lack of environmental safety and certification.",
                                "No data security or destruction guarantees.",
                                "Cannot provide formal compliance/EPR certificates."
                            ]
                            },
                            {
                            "name": "Attero Recycling",
                            "market_share": "Leading in formal sector",
                            "strengths": [
                                "Large scale, established infrastructure and processing plants.",
                                "Strong B2B and OEM relationships.",
                                "Advanced metal extraction technology."
                            ],
                            "weaknesses": [
                                "Primarily focused on large-scale industrial and B2B contracts.",
                                "Less focus on user-friendly, small-scale B2C collection.",
                                "Model is more asset-heavy."
                            ]
                            },
                            {
                            "name": "Other Formal Recyclers (e.g., Cerebra, E-Parisaraa)",
                            "market_share": "Fragmented",
                            "strengths": [
                                "Hold necessary government certifications.",
                                "Established regional presence."
                            ],
                            "weaknesses": [
                                "Often lack a strong technology platform or user-friendly interface.",
                                "Limited brand recognition among consumers and SMEs."
                            ]
                            }
                        ],
                        "competitive_advantage": "Ecobox's key advantage is its asset-light, tech-first model focused on convenience and trust. The 'Ecobox' concept simplifies the user journey, while digital tracking, data destruction certificates, and a clean brand image directly address the weaknesses of the unorganized sector and the user-experience gap left by large industrial recyclers.",
                        "market_position": "Ecobox is positioned as a 'Challenger' and 'Niche Player', creating a new sub-category of 'Convenience-led E-waste Management'. It bridges the gap between the informal sector's accessibility and the formal sector's compliance, targeting a digitally native and eco-conscious user base.",
                        "confidence": 0.8
                        },
                        "market_entry_barriers": [
                        {
                            "barrier": "Reverse Logistics Complexity & Cost",
                            "severity": "high",
                            "mitigation": "Develop a phased city-by-city rollout plan. Utilize a hybrid model of own fleet and partnerships with 3rd-party logistics (3PL) providers to manage costs and scale efficiently. Route optimization software is critical."
                        },
                        {
                            "barrier": "Regulatory Licensing",
                            "severity": "high",
                            "mitigation": "Requires a dedicated legal/compliance team to navigate CPCB/SPCB approvals. Initially, partner with already-certified recyclers for downstream processing to reduce immediate compliance burden, focusing on perfecting the collection network."
                        },
                        {
                            "barrier": "Competition from the Unorganized Sector",
                            "severity": "medium",
                            "mitigation": "Cannot compete on price (especially cash payments). Must compete on value: convenience, data security, trust, and the 'feel-good' factor of responsible recycling. B2B and EPR partnerships are the primary defense, as the unorganized sector cannot offer compliance."
                        },
                        {
                            "barrier": "Customer Acquisition Cost",
                            "severity": "medium",
                            "mitigation": "Leverage EPR partnerships with electronics brands for co-branded marketing campaigns and point-of-sale take-back programs. Focus on content marketing around ESG and data security to attract inbound B2B leads."
                        }
                        ],
                        "go_to_market_strategy": {
                        "channels": [
                            "Digital Marketing (SEO, SEM, Social Media) for B2C and SME acquisition.",
                            "Direct Sales & Partnerships for large corporates and EPR clients.",
                            "Channel Partnerships with electronics retailers and brands for take-back programs.",
                            "Online platform and mobile app for service booking and tracking."
                        ],
                        "customer_segments": [
                            "Urban Consumers: Eco-conscious individuals seeking a convenient disposal method.",
                            "SMEs & Startups: Businesses needing hassle-free, compliant e-waste disposal and data destruction.",
                            "Large Corporates: Companies requiring auditable compliance, ESG reporting, and bulk disposal services.",
                            "Producers (OEMs/Brands): Electronics manufacturers needing a scalable partner to fulfill EPR obligations."
                        ],
                        "value_proposition": "For consumers and SMEs, Ecobox offers the simplest, most transparent, and trustworthy way to dispose of e-waste responsibly. For corporates and producers, it's a compliant, data-secure, and brand-enhancing ESG solution.",
                        "confidence": 0.9
                        },
                        "confidence": 0.8,
                        "summary": "Ecobox by Binbag is targeting a large and rapidly growing market, strongly supported by regulatory tailwinds from India's EPR policies. Its core strengths lie in a well-defined, convenience-focused value proposition and a scalable, tech-enabled model that effectively addresses the trust and transparency gap in the market. The primary risks are operational and financial, centered on the high cost and complexity of building a national reverse logistics network and the B2C model's dependency on EPR funding. The B2B and EPR partnership-driven revenue streams are more robust and should be the primary focus for sustainable growth. Overall, the market potential is very high, but success is critically dependent on flawless operational execution and securing strategic partnerships."
                    }
                    },
                    "error": None,
                    "confidence": 0.8
                },
                "FinanceExpert": {
                    "success": True,
                    "data": {
                    "revenue_analysis": {
                        "model": "Hybrid model combining B2B paid services, B2C free services subsidized by Extended Producer Responsibility (EPR) partnerships, and direct partnerships with electronics brands/producers.",
                        "strengths": [
                        "Diversified Revenue Streams: Not reliant on a single source (B2B, EPR). This hedges risk.",
                        "Compliance-Driven Market: The B2B and EPR models are driven by government regulations, creating a mandatory and potentially large market.",
                        "Scalable Acquisition Funnel: The free B2C service acts as a low-friction entry point to build a large user base and logistics network, which can then be leveraged for profitable B2B and EPR contracts."
                        ],
                        "concerns": [
                        "Undefined Pricing: The pitch lacks any detail on B2B pricing (per kg, subscription, per pickup?) or the value of EPR contracts. This makes revenue projection impossible.",
                        "B2C Model Sustainability: The 'free' B2C service is a cost center. Its financial viability is entirely dependent on the ability to secure sufficient and profitable EPR and B2B contracts to cover the costs of collection.",
                        "Margin Compression Risk: Heavy reliance on EPR payments could be risky if regulations change or if brand partners negotiate aggressively, squeezing margins."
                        ]
                    },
                    "unit_economics": {
                        "cac": None,
                        "ltv": None,
                        "payback_period": None,
                        "analysis": "No quantitative data is provided to calculate CAC, LTV, or payback period. Conceptually, the unit economics for B2C are challenging. The 'customer' provides no direct revenue. The value per B2C pickup is (Value of recovered materials + EPR subsidy) - (Cost of Ecobox + Logistics + Processing + Prorated CAC). If this is negative, the model relies on B2B clients to be profitable. For B2B, LTV would be the contract value over its lifetime, and CAC would be sales and marketing costs. The LTV/CAC ratio for B2B clients is the most critical metric for this business's success, and there is no data to assess it."
                    },
                    "financial_health": {
                        "burn_rate": None,
                        "runway_months": None,
                        "analysis": "The pitch provides zero information on the company's financial health (cash on hand, monthly revenue, monthly expenses). This is a critical omission. The business model implies a high burn rate initially due to significant operational costs (logistics, warehousing, staff for pickups), marketing expenses to drive B2C adoption, and a sales team for B2B/EPR. Without knowing the current cash position and burn rate, it's impossible to determine the company's runway or immediate need for capital."
                    },
                    "projections": {
                        "assumptions_analysis": "The document contains no financial projections or the assumptions behind them. Key assumptions for a viable model would include: 1) Cost of logistics per pickup (highly variable in India). 2) Average weight and material value per Ecobox. 3) Rate of B2C user growth and geographical density (to optimize logistics). 4) B2B client acquisition rate and average contract value. 5) Per-kg revenue/subsidy from EPR partners. The reasonableness of any projection would depend entirely on these inputs, which are currently unknown.",
                        "sensitivity_analysis": "The business model is highly sensitive to: 1) Fuel and transportation costs, which directly impact the margin on every pickup. 2) Commodity prices for recycled materials (e.g., copper, aluminum, gold). 3) Changes in government EPR regulations, which could alter the entire market dynamic. 4) The 'fill rate' and value of items in B2C boxes, as low-value items could make pickups unprofitable.",
                        "red_flags": [
                        "Complete Lack of Metrics: The pitch uses qualitative terms like 'growing customer adoption' but provides no numbers (e.g., users, pickups, revenue, partnerships signed). This makes it impossible to validate traction.",
                        "Asset-Heavy 'Free' Service: Offering free logistics-based services is cash-intensive. The risk of scaling costs faster than revenue from B2B/EPR is very high.",
                        "Unclear Monetization Path for B2C Data: While the B2C model builds a network, the direct path to monetizing it (beyond justifying the logistics network for B2B) is not detailed."
                        ]
                    },
                    "confidence": 0.2
                    },
                    "error": None,
                    "confidence": 0.2
                },
                "CompetitiveAnalyst": {
                    "success": True,
                    "data": {
                    "competitive_landscape": {
                        "direct_competitors": [
                        {
                            "name": "Attero Recycling",
                            "strengths": [
                            "India's largest integrated e-waste recycler.",
                            "Strong B2B relationships with major corporations.",
                            "Extensive processing infrastructure and patented extraction technology.",
                            "Well-established logistics and collection network."
                            ],
                            "weaknesses": [
                            "Primarily B2B focused with less emphasis on a consumer-friendly B2C interface.",
                            "Brand is not as well-known among individual consumers.",
                            "Service may be perceived as less accessible or convenient for small-scale household disposal."
                            ],
                            "differentiation": "Ecobox differentiates through a superior, tech-enabled user experience focused on convenience and transparency for the B2C segment, aiming to build a trusted consumer brand."
                        },
                        {
                            "name": "Cerebra Integrated Technologies",
                            "strengths": [
                            "One of the largest e-waste and IT refurbishment facilities in India.",
                            "Strong focus on corporate clients and bulk disposal.",
                            "Established presence and regulatory compliance."
                            ],
                            "weaknesses": [
                            "Lacks a strong B2C offering or brand.",
                            "The user journey for individuals or SMEs can be cumbersome.",
                            "Less focus on a modern, app-based, on-demand model."
                            ],
                            "differentiation": "Ecobox's model is asset-light and platform-centric, focusing on the customer experience ('as easy as ordering food delivery'), whereas Cerebra is more of a traditional, heavy-asset industrial processor."
                        },
                        {
                            "name": "Informal Sector (Kabadiwalas/Scrap Dealers)",
                            "strengths": [
                            "Hyper-local and extremely accessible.",
                            "Often provide immediate cash payment for waste, creating a direct financial incentive.",
                            "Deeply entrenched in the existing waste collection ecosystem."
                            ],
                            "weaknesses": [
                            "Unsafe and environmentally hazardous processing methods.",
                            "No guarantee of data destruction, posing a significant security risk.",
                            "Lack of transparency, certification, or compliance for businesses."
                            ],
                            "differentiation": "Ecobox's core value proposition is built on trust, security (data destruction), and environmental responsibility, which are the primary weaknesses of the informal sector."
                        }
                        ],
                        "market_position": {
                        "positioning": "Ecobox positions itself as the most convenient, trustworthy, and user-friendly e-waste recycling service for eco-conscious individuals and compliance-focused businesses in urban India.",
                        "unique_value_prop": "Making responsible e-waste recycling as simple, transparent, and secure as ordering food delivery, complete with doorstep pickup, live tracking, and certified data destruction.",
                        "moat": "A potential moat can be built through a combination of: 1) A strong consumer brand synonymous with trust and convenience. 2) A highly efficient, tech-optimized reverse logistics network that becomes more cost-effective at scale. 3) Exclusive, long-term EPR partnerships with major electronics brands."
                        },
                        "barriers_to_entry": {
                        "existing": [
                            "Regulatory Compliance: Obtaining licenses from the Central Pollution Control Board (CPCB) and state bodies is complex and time-consuming.",
                            "Logistics Network: Establishing a reliable and cost-effective nationwide reverse logistics network requires significant investment and operational expertise.",
                            "Capital for Processing Facilities: While Ecobox may partner, the industry requires heavy capital investment in certified dismantling and recycling plants, which incumbents own.",
                            "Established B2B Relationships: Incumbents have long-standing contracts with large enterprises, which are difficult to displace."
                        ],
                        "potential": [
                            "Brand Recognition: Building a household name for e-waste recycling can create a strong barrier against new, undifferentiated entrants.",
                            "Network Effects: As more users join the platform, collection routes become denser and more efficient, lowering marginal costs and making the service more attractive to EPR partners.",
                            "Proprietary Technology: A superior software platform for scheduling, tracking, and reporting can create a sticky ecosystem for both users and business partners."
                        ]
                        },
                        "threat_analysis": {
                        "incumbent_threats": [
                            "Model Imitation: Established players like Attero could launch a similar, user-friendly B2C front-end, leveraging their existing infrastructure to compete directly.",
                            "EPR Squeeze-out: Large recyclers could use their scale to secure exclusive, high-volume EPR contracts from major brands, cutting off a key revenue stream for Ecobox.",
                            "Price War in B2B: Incumbents could undercut Ecobox on pricing for corporate clients to stifle its growth in the more lucrative B2B segment."
                        ],
                        "new_entrant_risks": [
                            "Logistics Giants' Entry: Major logistics companies (e.g., Delhivery, Blue Dart) or e-commerce players (e.g., Amazon, Flipkart) could leverage their vast, existing reverse logistics networks to offer a similar service with unparalleled reach and efficiency.",
                            "Hyper-local Competitors: Niche, city-specific startups could emerge, offering faster or more specialized services and capturing market share in key metropolitan areas.",
                            "International Players: Established global e-waste management companies could enter the regulated Indian market."
                        ],
                        "substitute_products": [
                            "Manufacturer Take-Back Programs: Major brands (like Apple, Samsung, HP) enhancing their own exchange/recycling programs with better incentives (e.g., store credit, discounts), which could be more appealing to brand-loyal customers.",
                            "Municipal Collection Drives: Increased frequency and accessibility of government or city-run e-waste collection events could reduce the perceived need for a private service.",
                            "DIY Disposal/Donation: Users choosing to sell devices on secondary markets (e.g., OLX) or donate them, bypassing recycling services entirely."
                        ]
                        }
                    },
                    "confidence": 0.9
                    },
                    "error": None,
                    "confidence": 0.9
                },
                "TeamEvaluator": {
                    "success": True,
                    "data": {
                    "team_analysis": {
                        "team_composition": {
                        "strengths": [
                            "Analysis impossible: No information on the founding team members, their roles, or their backgrounds was provided in the business pitch."
                        ],
                        "gaps": [
                            "Based on the business model, potential gaps in an early-stage team would likely be in: 1) Deep regulatory expertise in EPR and environmental law. 2) Experience in hazardous waste logistics and certified recycling processes. 3) Established relationships with large electronics brands and corporate ESG departments."
                        ],
                        "completeness_score": 2
                        },
                        "experience_assessment": {
                        "relevant_experience": [
                            "Ideal candidates would have experience in reverse logistics, last-mile delivery operations (e.g., from e-commerce), B2B enterprise sales for compliance services, and scaling technology platforms. However, the actual team's experience is unknown."
                        ],
                        "past_performance": [
                            "Critical Information Gap: No data provided on the founders' past ventures, successes, or failures. This is a primary area for due diligence."
                        ],
                        "domain_expertise": "The business requires a unique blend of expertise in logistics, environmental policy (EPR), B2B compliance sales, and software. The presence and depth of this expertise within the current team cannot be assessed."
                        },
                        "execution_risk": {
                        "key_risks": [
                            "Logistical Scalability: Managing a nationwide, asset-light reverse logistics network is operationally complex and can have thin margins.",
                            "Regulatory Dependence: The business model is heavily tied to evolving and potentially complex EPR regulations. A change in policy could significantly impact the business.",
                            "B2B Sales Cycle: Securing large corporate and brand partnerships for compliance can involve long sales cycles, creating cash flow challenges.",
                            "Unit Economics: Profitability of the 'free' B2C service is entirely dependent on securing sufficient revenue from B2B and EPR partnerships."
                        ],
                        "mitigation_strategies": [
                            "A strong team would need to demonstrate a phased, city-by-city rollout plan to control logistical complexity.",
                            "Proactively engaging with policymakers and hiring for in-house compliance expertise.",
                            "Prioritizing securing a few large anchor B2B/EPR clients to ensure revenue stability before scaling the B2C acquisition funnel.",
                            "Building a robust technology backend for route optimization and partner management to improve efficiency."
                        ],
                        "risk_score": 8
                        },
                        "recommendations": {
                        "key_hires_needed": [
                            "Head of Policy & Compliance: A specialist to navigate EPR laws and liaise with government bodies.",
                            "Head of Operations: An expert with experience in scaling last-mile or reverse logistics networks in India.",
                            "Enterprise Sales Director: A senior salesperson with a track record in selling ESG/compliance solutions to large corporations."
                        ],
                        "advisors_suggested": [
                            "A former official from the Central Pollution Control Board (CPCB) or Ministry of Environment.",
                            "A senior logistics executive from a company like Delhivery, Blue Dart, or a major e-commerce player.",
                            "A founder of a successful B2B compliance-tech or circular economy startup."
                        ]
                        }
                    }
                    },
                    "error": None,
                    "confidence": 0.1
                }
                },
                "final_verdict": {
                "recommendation": "CONSIDER",
                "confidence": 0.48500000000000004,
                "confidence_label": "Medium",
                "reasons": [
                    "Committee confidence: 48%"
                ],
                "timestamp": "2025-10-29T17:46:06.252402",
                "committee_analysis": {
                    "members": [
                    {
                        "name": "RiskAnalyst",
                        "role": "Senior Riskanalyst",
                        "personality": "Analytical and data-driven",
                        "analysis": "Comprehensive analysis not available.",
                        "vote": "CONSIDER",
                        "confidence": 50,
                        "reasoning": "No detailed reasoning provided by the agent."
                    },
                    {
                        "name": "MarketExpert",
                        "role": "Senior Marketexpert",
                        "personality": "Analytical and data-driven",
                        "analysis": "Comprehensive analysis not available.",
                        "vote": "CONSIDER",
                        "confidence": 50,
                        "reasoning": "No detailed reasoning provided by the agent."
                    },
                    {
                        "name": "FinanceExpert",
                        "role": "Senior Financeexpert",
                        "personality": "Analytical and data-driven",
                        "analysis": "Comprehensive analysis not available.",
                        "vote": "RISKY",
                        "confidence": 20,
                        "reasoning": "No detailed reasoning provided by the agent."
                    },
                    {
                        "name": "CompetitiveAnalyst",
                        "role": "Senior Competitiveanalyst",
                        "personality": "Analytical and data-driven",
                        "analysis": "Comprehensive analysis not available.",
                        "vote": "STRONG_INVEST",
                        "confidence": 90,
                        "reasoning": "No detailed reasoning provided by the agent."
                    },
                    {
                        "name": "TeamEvaluator",
                        "role": "Senior Teamevaluator",
                        "personality": "Analytical and data-driven",
                        "analysis": "Comprehensive analysis not available.",
                        "vote": "CONSIDER",
                        "confidence": 50,
                        "reasoning": "No detailed reasoning provided by the agent."
                    }
                    ],
                    "final_verdict": "CONSIDER",
                    "consensus_score": 0.48500000000000004,
                    "majority_vote": "CONSIDER",
                    "dissenting_opinions": [
                    "FinanceExpert voted RISKY because: No detailed reasoning provided by the agent.",
                    "CompetitiveAnalyst voted STRONG_INVEST because: No detailed reasoning provided by the agent."
                    ],
                    "key_debate_points": []
                }
                },
                "status": "completed",
                "summary": {
                "keyInsights": [],
                "strengths": [],
                "concerns": [],
                "recommendations": []
                }
            },
            "message": ""
            }
    # Create a logger for this request
    request_id = request.state.request_id if hasattr(request.state, 'request_id') else str(uuid.uuid4())
    logger = AgentLogger("analysis_api", request_id)
    
    try:
        # Log the status check
        logger.log_event(
            "status_check",
            f"Checking status of analysis: {analysis_id}",
            {"analysis_id": analysis_id}
        )
        
        # Get the analysis result
        result = analysis_results.get(analysis_id)
        
        if not result:
            logger.log_event(
                "status_not_found",
                f"Analysis ID not found: {analysis_id}",
                level="warning"
            )
            raise HTTPException(
                status_code=404,
                detail=f"Analysis with ID {analysis_id} not found"
            )
        
        # Log the status being returned
        logger.log_event(
            "status_returned",
            f"Returning status for analysis: {analysis_id} - {result.get('status')}",
            {"status": result.get("status")}
        )
        
        # Format the response
        response = {
            "analysisId": analysis_id,
            "status": result.get("status", "unknown"),
            "result": result.get("result"),
            "message": str(result.get("message", ""))  # Ensure message is always a string
        }
        
        # If status is error, ensure we have a proper error message
        if response["status"] == "error":
            if not response["message"] and response["result"]:
                response["message"] = str(response["result"])
            elif not response["message"]:
                response["message"] = "An unknown error occurred"
        
        # Format the summary if it exists
        if response.get("result") and isinstance(response["result"], dict) and "summary" in response["result"]:
            summary = response["result"]["summary"]
            if isinstance(summary, dict):
                response["result"]["summary"] = {
                    'keyInsights': summary.get('key_insights', summary.get('keyInsights', [])),
                    'strengths': summary.get('strengths', []),
                    'concerns': summary.get('concerns', []),
                    'recommendations': summary.get('recommendations', [])
                }
        
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.log_event(
            "status_check_error",
            f"Error checking status of analysis {analysis_id}: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/list", response_model=List[Dict[str, Any]])
async def get_analysis_history(
    request: Request,
    skip: int = 0,
    limit: int = 10
):
    """
    Get the analysis history for the current user.
    Returns a paginated list of analyses, most recent first.
    """
    # Get the user ID from the request state
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Create a logger for this request
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    logger = AgentLogger("analysis_api", request_id)
    
    try:
        # Create analysis service instance
        analysis_service = AnalysisService()
        
        # Log the history request
        logger.log_event(
            "history_request",
            f"Fetching analysis history for user {user_id}",
            {"skip": skip, "limit": limit}
        )
        
        # Get analyses from the database
        analyses = await analysis_service.storage.list_analyses(
            user_id=user_id,
            skip=skip,
            limit=limit
        )
        
        # Format the response
        formatted_analyses = []
        for analysis in analyses:
            formatted = {
                "id": str(analysis.get("_id", "")),
                "createdAt": analysis.get("created_at"),
                "status": analysis.get("status", "unknown"),
                "pitch_preview": (analysis.get("input", {}).get("pitch", "")[:100] + "...") if analysis.get("input", {}).get("pitch") else "",
                "website_url": analysis.get("input", {}).get("website_url"),
                "summary": analysis.get("summary", {})
            }
            
            # Add analysis metrics if available
            if analysis.get("analysis"):
                formatted["metrics"] = {
                    "score": analysis["analysis"].get("score"),
                    "sentiment": analysis["analysis"].get("sentiment")
                }
            
            formatted_analyses.append(formatted)
        
        logger.log_event(
            "history_response",
            f"Returning {len(formatted_analyses)} analyses"
        )
        
        return formatted_analyses
        
    except Exception as e:
        logger.log_event(
            "history_error",
            f"Error fetching analysis history: {str(e)}",
            {"error_type": type(e).__name__},
            level="error"
        )
        raise HTTPException(status_code=500, detail=str(e))

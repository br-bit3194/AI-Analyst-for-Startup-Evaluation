"""
Financial Dashboard for visualizing and analyzing investment metrics.

This module provides a dashboard interface for displaying financial metrics,
performance indicators, and other key data points relevant to investment analysis.
"""

from typing import Dict, List, Optional, Any, Union
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class FinancialDashboard:
    """
    A dashboard for visualizing and analyzing financial metrics.
    
    This class provides methods to generate visualizations and reports
    for financial data relevant to investment decisions.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the FinancialDashboard.
        
        Args:
            config: Configuration dictionary for the dashboard
        """
        self.config = config or {}
        self.metrics = self._initialize_metrics()
        logger.info("Initialized FinancialDashboard")
    
    def _initialize_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Initialize the standard set of financial metrics."""
        return {
            'revenue': {
                'name': 'Revenue',
                'description': 'Total revenue over time',
                'unit': 'USD',
                'format': 'currency',
                'trend': None,
                'target': None
            },
            'burn_rate': {
                'name': 'Burn Rate',
                'description': 'Monthly cash burn rate',
                'unit': 'USD/month',
                'format': 'currency',
                'trend': 'lower',  # Lower is better
                'target': 0
            },
            'gross_margin': {
                'name': 'Gross Margin',
                'description': 'Gross profit as a percentage of revenue',
                'unit': '%',
                'format': 'percentage',
                'trend': 'higher',  # Higher is better
                'target': 70.0
            },
            'cac': {
                'name': 'Customer Acquisition Cost',
                'description': 'Cost to acquire a new customer',
                'unit': 'USD',
                'format': 'currency',
                'trend': 'lower',
                'target': None
            },
            'ltv': {
                'name': 'Lifetime Value',
                'description': 'Average customer lifetime value',
                'unit': 'USD',
                'format': 'currency',
                'trend': 'higher',
                'target': None
            },
            'ltv_cac_ratio': {
                'name': 'LTV:CAC Ratio',
                'description': 'Lifetime value to customer acquisition cost ratio',
                'unit': 'x',
                'format': 'number',
                'trend': 'higher',
                'target': 3.0
            },
            'runway': {
                'name': 'Runway',
                'description': 'Months of cash remaining',
                'unit': 'months',
                'format': 'number',
                'trend': 'higher',
                'target': 12.0
            },
            'arr': {
                'name': 'Annual Recurring Revenue',
                'description': 'Annualized recurring revenue',
                'unit': 'USD',
                'format': 'currency',
                'trend': 'higher',
                'target': None
            },
            'mrr': {
                'name': 'Monthly Recurring Revenue',
                'description': 'Monthly recurring revenue',
                'unit': 'USD',
                'format': 'currency',
                'trend': 'higher',
                'target': None
            },
            'churn_rate': {
                'name': 'Churn Rate',
                'description': 'Monthly customer churn rate',
                'unit': '%',
                'format': 'percentage',
                'trend': 'lower',
                'target': 5.0
            }
        }
    
    async def generate_dashboard(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate dashboard data for the provided financial metrics.
        
        Args:
            financial_data: Dictionary containing financial metrics and time series data
            
        Returns:
            Dictionary containing dashboard visualization data
        """
        # In a real implementation, this would process the data and generate visualizations
        # For now, return a basic dashboard structure with mock data
        
        # Process time series data if available
        time_series = {}
        if 'time_series' in financial_data:
            for metric, data in financial_data['time_series'].items():
                if metric in self.metrics:
                    time_series[metric] = {
                        'labels': [str(d['date']) for d in data],
                        'values': [d['value'] for d in data],
                        'unit': self.metrics[metric]['unit']
                    }
        
        # Calculate key metrics
        metrics_summary = {}
        for metric_id, metric_def in self.metrics.items():
            if metric_id in financial_data.get('metrics', {}):
                value = financial_data['metrics'][metric_id]
                metrics_summary[metric_id] = {
                    'name': metric_def['name'],
                    'value': value,
                    'unit': metric_def['unit'],
                    'format': metric_def['format'],
                    'status': self._get_metric_status(metric_id, value, metric_def)
                }
        
        # Generate visualizations
        visualizations = {
            'revenue_growth': self._generate_line_chart('Revenue', time_series.get('revenue')),
            'mrr_trend': self._generate_line_chart('MRR', time_series.get('mrr')),
            'gross_margin_trend': self._generate_line_chart('Gross Margin', time_series.get('gross_margin')),
            'burn_rate_trend': self._generate_line_chart('Burn Rate', time_series.get('burn_rate')),
            'customer_metrics': self._generate_bar_chart(['CAC', 'LTV'], 
                                                       [time_series.get('cac', {}).get('values', [0])[-1] if time_series.get('cac') else 0,
                                                        time_series.get('ltv', {}).get('values', [0])[-1] if time_series.get('ltv') else 0])
        }
        
        return {
            'metrics': metrics_summary,
            'visualizations': visualizations,
            'last_updated': datetime.utcnow().isoformat(),
            'time_range': {
                'start': financial_data.get('time_range', {}).get('start'),
                'end': financial_data.get('time_range', {}).get('end')
            }
        }
    
    def _get_metric_status(self, metric_id: str, value: float, metric_def: Dict[str, Any]) -> str:
        """Determine the status (good/warning/danger) of a metric."""
        if metric_def['trend'] is None or metric_def['target'] is None:
            return 'neutral'
            
        if metric_def['trend'] == 'higher':
            if value >= metric_def['target']:
                return 'good'
            elif value >= metric_def['target'] * 0.7:  # Within 30% of target
                return 'warning'
            else:
                return 'danger'
        else:  # 'lower' trend
            if value <= metric_def['target']:
                return 'good'
            elif value <= metric_def['target'] * 1.3:  # Within 30% of target
                return 'warning'
            else:
                return 'danger'
    
    def _generate_line_chart(self, title: str, data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate data for a line chart."""
        if not data:
            return {'type': 'line', 'title': title, 'data': None}
            
        return {
            'type': 'line',
            'title': title,
            'data': {
                'labels': data.get('labels', []),
                'datasets': [{
                    'label': title,
                    'data': data.get('values', []),
                    'borderColor': 'rgb(75, 192, 192)',
                    'tension': 0.1,
                    'fill': False
                }]
            },
            'options': {
                'responsive': True,
                'scales': {
                    'y': {
                        'beginAtZero': True
                    }
                }
            }
        }
    
    def _generate_bar_chart(self, labels: List[str], values: List[float]) -> Dict[str, Any]:
        """Generate data for a bar chart."""
        return {
            'type': 'bar',
            'data': {
                'labels': labels,
                'datasets': [{
                    'label': 'Value',
                    'data': values,
                    'backgroundColor': [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)'
                    ],
                    'borderColor': [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)'
                    ],
                    'borderWidth': 1
                }]
            },
            'options': {
                'responsive': True,
                'scales': {
                    'y': {
                        'beginAtZero': True
                    }
                }
            }
        }

# Create a default instance for easy importing
default_financial_dashboard = FinancialDashboard()

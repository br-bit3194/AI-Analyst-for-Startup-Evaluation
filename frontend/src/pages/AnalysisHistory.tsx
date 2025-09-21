import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from 'antd';
import { format } from 'date-fns';
import { LoadingOutlined, ArrowRightOutlined, FileTextOutlined, GlobalOutlined, BulbOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';

interface AnalysisHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: 'completed' | 'processing' | 'failed';
  type: 'pitch' | 'document' | 'website';
  summary?: string;
  metadata?: {
    wordCount?: number;
    url?: string;
    fileName?: string;
  };
}
export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalysisHistory = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/analyses/history');
        // const data = await response.json();
        
        // Mock data for now
        setTimeout(() => {
          setAnalyses([
            {
              id: '1',
              title: 'E-commerce Platform Analysis',
              timestamp: new Date().toISOString(),
              status: 'completed',
              type: 'pitch',
              summary: 'Analysis of the e-commerce platform pitch focusing on market potential and technical feasibility.',
              metadata: {
                wordCount: 1245
              }
            },
            {
              id: '2',
              title: 'Financial Report Q2 2023',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              status: 'completed',
              type: 'document',
              metadata: {
                fileName: 'financial_report_q2_2023.pdf'
              }
            },
            {
              id: '3',
              title: 'Startup Website Analysis',
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              status: 'completed',
              type: 'website',
              metadata: {
                url: 'https://example-startup.com'
              }
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch analysis history:', error);
        setIsLoading(false);
      }
    };

    fetchAnalysisHistory();
  }, []);

  const getTypeIcon = (type: string) => {
    const style = { fontSize: '20px' };
    switch (type) {
      case 'pitch':
        return <BulbOutlined style={{ ...style, color: '#faad14' }} />;
      case 'document':
        return <FileTextOutlined style={{ ...style, color: '#1890ff' }} />;
      case 'website':
        return <GlobalOutlined style={{ ...style, color: '#52c41a' }} />;
      default:
        return <FileTextOutlined style={style} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: 'Completed', status: 'success' as const },
      processing: { label: 'Processing', status: 'processing' as const },
      failed: { label: 'Failed', status: 'error' as const },
    };

    const { label, status: badgeStatus } = statusMap[status as keyof typeof statusMap] || { label: status, status: 'default' as const };

    return <Badge status={badgeStatus} text={label} />;
  };

  const handleViewAnalysis = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analysis History</h1>
          <p style={{ color: '#666' }}>View your past startup analyses and evaluations</p>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analysis History</h1>
        <p style={{ color: '#666' }}>View your past startup analyses and evaluations</p>
      </div>

      {analyses.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 0', 
          border: '2px dashed #e0e0e0', 
          borderRadius: '0.5rem',
          marginTop: '2rem'
        }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>No analysis history found</p>
          <Button type="primary" onClick={() => navigate('/')}>
            Analyze a new startup
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {analyses.map((analysis) => (
            <div 
              key={analysis.id} 
              onMouseEnter={() => setHoveredCard(analysis.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: hoveredCard === analysis.id 
                  ? '0 4px 6px rgba(0,0,0,0.1)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.3s',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '0.5rem', 
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getTypeIcon(analysis.type)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                      {analysis.title}
                    </h3>
                    <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                      {format(new Date(analysis.timestamp), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div>
                  {getStatusBadge(analysis.status)}
                </div>
              </div>
              
              {analysis.summary && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>{analysis.summary}</p>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                color: '#666',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {analysis.metadata?.wordCount && (
                  <span>{analysis.metadata.wordCount} words</span>
                )}
                {analysis.metadata?.fileName && (
                  <span>• {analysis.metadata.fileName}</span>
                )}
                {analysis.metadata?.url && (
                  <span>• {analysis.metadata.url}</span>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="default"
                  size="small"
                  onClick={() => handleViewAnalysis(analysis.id)}
                  icon={<ArrowRightOutlined />}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

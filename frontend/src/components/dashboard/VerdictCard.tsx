import React from 'react';
import { Card, Progress, Tag, Typography, Button, Space } from 'antd';
import { 
  CheckCircleFilled, 
  ExclamationCircleFilled, 
  StopFilled,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigation } from '@/hooks/useNavigation';

const { Title, Paragraph, Text } = Typography;

interface VerdictProps {
  verdict?: {
    recommendation: 'INVEST' | 'CONSIDER' | 'PASS' | 'STRONG_INVEST' | 'HIGH_RISK';
    confidence: number;
    summary: string;
    rationale: string;
    committee_analysis?: {
      final_verdict: string;
      consensus_score: number;
      key_debate_points?: string[];
    };
  };
  loading?: boolean;
  analysisId?: string;
  showViewReport?: boolean;
}

const mockVerdicts = {
  invest: {
    recommendation: 'INVEST' as const,
    confidence: 92.5,
    summary: 'Strong investment opportunity with experienced team and growing market.',
    rationale: 'The startup demonstrates a strong product-market fit with a clear value proposition. The founding team has relevant industry experience and a track record of success. Financial projections show a clear path to profitability with reasonable assumptions.',
    next_steps: [
      'Schedule a call with the founding team to discuss investment terms',
      'Review the full due diligence report',
      'Coordinate with legal for term sheet preparation',
      'Plan for board seat allocation'
    ]
  }
};

const VerdictCard: React.FC<VerdictProps> = ({ 
  verdict, 
  loading = false, 
  analysisId,
  showViewReport = true
}) => {
  const { navigate } = useNavigation();
  
  const handleViewReport = async () => {
    if (analysisId) {
      await navigate(`/analysis/${analysisId}`);
    }
  };

  const getVerdictConfig = () => {
    const rec = verdict?.recommendation || verdict?.committee_analysis?.final_verdict;
    
    switch (rec) {
      case 'STRONG_INVEST':
        return {
          color: '#52c41a',
          icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
          label: 'Strong Invest',
          description: 'Exceptional potential - Highly recommended for investment',
          bgColor: '#f6ffed'
        };
      case 'INVEST':
        return {
          color: '#52c41a',
          icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
          label: 'Invest',
          description: 'Strong potential - Recommended for investment',
          bgColor: '#f6ffed'
        };
      case 'CONSIDER':
        return {
          color: '#faad14',
          icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
          label: 'Consider',
          description: 'Potential with some concerns - Further review needed',
          bgColor: '#fffbe6'
        };
      case 'HIGH_RISK':
        return {
          color: '#fa8c16',
          icon: <ExclamationCircleFilled style={{ color: '#fa8c16' }} />,
          label: 'High Risk',
          description: 'High potential but with significant risks',
          bgColor: '#fff7e6'
        };
      case 'PASS':
        return {
          color: '#ff4d4f',
          icon: <StopFilled style={{ color: '#ff4d4f' }} />,
          label: 'Pass',
          description: 'Significant concerns - Not recommended',
          bgColor: '#fff1f0'
        };
      default:
        return {
          color: '#8c8c8c',
          icon: null,
          label: 'Pending',
          description: 'Analysis in progress',
          bgColor: '#f5f5f5'
        };
    }
  };

  const verdictConfig = getVerdictConfig();

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">Investment Verdict</span>
            {verdictConfig.icon}
          </div>
          {showViewReport && analysisId && (
            <Button 
              type="link" 
              icon={<ArrowRightOutlined />}
              onClick={handleViewReport}
            >
              View Full Report
            </Button>
          )}
        </div>
      }
      className="h-full"
      loading={loading}
      bodyStyle={{ 
        backgroundColor: verdictConfig.bgColor || 'transparent',
        borderRadius: '8px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {verdict ? (
        <div className="space-y-4">
          <div className="text-center">
            <Title 
              level={2} 
              style={{ 
                color: verdictConfig.color,
                margin: '16px 0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {verdictConfig.icon}
              {verdictConfig.label}
            </Title>
            <Paragraph type="secondary">
              {verdictConfig.description}
            </Paragraph>
          </div>

          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span>Confidence</span>
              <span>{verdict.confidence.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={verdict.confidence} 
              strokeColor={verdictConfig.color}
              showInfo={false}
              strokeLinecap="square"
            />
          </div>

          <div className="mt-6">
            <Title level={5} className="mb-2">Summary</Title>
            <Paragraph>{verdict.summary}</Paragraph>
          </div>

          {verdict.committee_analysis && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Title level={5} className="mb-2">Committee Consensus</Title>
                <Tag color={verdictConfig.color}>
                  {verdict.committee_analysis.final_verdict.replace('_', ' ')}
                </Tag>
              </div>
              <div className="mt-2">
                <Text type="secondary">
                  Consensus Score: {Math.round((verdict.committee_analysis.consensus_score || 0) * 100)}%
                </Text>
              </div>
            </div>
          )}

          {verdict.committee_analysis?.key_debate_points && (
            <div className="mt-6">
              <Title level={5} className="mb-2">Key Debate Points</Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {verdict.committee_analysis.key_debate_points.map((point, index) => (
                  <Card key={index} size="small">
                    <Text>{point}</Text>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          <div className="mt-4">
            <Title level={5} style={{ marginBottom: 12 }}>Rationale</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {verdict.rationale}
            </Paragraph>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">
          No verdict available. Submit analysis to get started.
        </div>
      )}
    </Card>
  );
};

export default VerdictCard;

import React from 'react';
import { Card, Progress, Tag, Typography } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled, StopFilled } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface VerdictProps {
  verdict?: {
    recommendation: 'INVEST' | 'CONSIDER' | 'PASS';
    confidence: number;
    summary: string;
    rationale: string;
    next_steps?: string[];
  };
  loading?: boolean;
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

const VerdictCard: React.FC<VerdictProps> = ({ verdict, loading = false }) => {
  const getVerdictConfig = () => {
    switch (verdict?.recommendation) {
      case 'INVEST':
        return {
          color: '#52c41a',
          icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
          label: 'Invest',
          description: 'Strong potential - Recommended for investment'
        };
      case 'CONSIDER':
        return {
          color: '#faad14',
          icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
          label: 'Consider',
          description: 'Potential with some concerns - Further review needed'
        };
      case 'PASS':
        return {
          color: '#ff4d4f',
          icon: <StopFilled style={{ color: '#ff4d4f' }} />,
          label: 'Pass',
          description: 'Significant concerns - Not recommended'
        };
      default:
        return {
          color: '#8c8c8c',
          icon: null,
          label: 'Pending',
          description: 'Analysis in progress'
        };
    }
  };

  const verdictConfig = getVerdictConfig();

  return (
    <Card 
      title={
        <div className="flex items-center">
          <span className="mr-2">Investment Verdict</span>
          {verdictConfig.icon}
        </div>
      }
      className="h-full"
      loading={loading}
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
            <Title level={5} style={{ marginBottom: 8 }}>Summary</Title>
            <Paragraph>
              {verdict.summary}
            </Paragraph>
          </div>

          <div className="mt-4">
            <Title level={5} style={{ marginBottom: 12 }}>Rationale</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {verdict.rationale}
            </Paragraph>
          </div>

          {verdict.next_steps && verdict.next_steps.length > 0 && (
            <div className="mt-6">
              <Title level={5} style={{ marginBottom: 12 }}>Next Steps</Title>
              <div className="space-y-3">
                {verdict.next_steps.map((step, index) => (
                  <div 
                    key={index} 
                    className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-800 m-0">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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

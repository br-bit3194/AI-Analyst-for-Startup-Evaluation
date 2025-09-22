import React from 'react';
import { Card, Typography, Tag, Progress, Divider, Space } from 'antd';
import { useVerdict } from '@/hooks/useVerdict';

const { Title, Text, Paragraph } = Typography;

interface AnalysisReportProps {
  analysisId?: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysisId }) => {
  const { verdict, loading } = useVerdict(analysisId);

  if (loading) {
    return (
      <Card loading={true}>
        <Title level={4}>Loading analysis report...</Title>
      </Card>
    );
  }

  if (!verdict) {
    return (
      <Card>
        <Title level={4}>Analysis Report</Title>
        <Text type="secondary">No analysis data available</Text>
      </Card>
    );
  }

  const getVerdictColor = (recommendation: string) => {
    switch (recommendation) {
      case 'INVEST':
        return 'success';
      case 'CONSIDER':
        return 'processing';
      case 'PASS':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 50) return '#faad14';
    return '#f5222d';
  };

  return (
    <Card>
      <div className="mb-6">
        <Title level={4}>Investment Analysis Report</Title>
        <Text type="secondary">
          Comprehensive analysis of the investment opportunity
        </Text>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={5} className="mb-0">Recommendation</Title>
          <Tag 
            color={getVerdictColor(verdict.recommendation)}
            style={{ fontSize: '14px', padding: '4px 12px' }}
          >
            {verdict.recommendation}
          </Tag>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <Text>Confidence Level</Text>
            <Text strong>{verdict.confidence}%</Text>
          </div>
          <Progress 
            percent={verdict.confidence} 
            strokeColor={getConfidenceColor(verdict.confidence)}
            showInfo={false}
          />
        </div>
      </div>

      <Divider>Summary</Divider>
      
      <div className="mb-6">
        <Paragraph>{verdict.summary}</Paragraph>
      </div>

      <Divider>Detailed Analysis</Divider>
      
      <div className="mb-6">
        <Paragraph>{verdict.rationale}</Paragraph>
      </div>

      {verdict.committee_analysis && (
        <>
          <Divider>Committee Consensus</Divider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <Text strong>Final Verdict</Text>
              <div>
                <Tag color={getVerdictColor(verdict.committee_analysis.final_verdict)}>
                  {verdict.committee_analysis.final_verdict.replace('_', ' ')}
                </Tag>
              </div>
            </div>
            <div className="text-center">
              <Text strong>Consensus Score</Text>
              <div>
                <Progress 
                  type="circle" 
                  percent={Math.round(verdict.committee_analysis.consensus_score * 100)} 
                  width={60}
                  format={(percent) => `${percent}%`}
                />
              </div>
            </div>
            <div className="text-center">
              <Text strong>Committee Members</Text>
              <div>
                <Text>{verdict.committee_analysis.members.length} perspectives</Text>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AnalysisReport;

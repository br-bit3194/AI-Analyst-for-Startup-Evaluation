import React, { useState } from 'react';
import { Button, Card, Space, Tabs, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import VerdictCard from '@/components/dashboard/VerdictCard';
import { useVerdict } from '@/hooks/useVerdict';

const { Title, Paragraph } = Typography;

const VerdictDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invest');
  
  // Mock data for demonstration
  const mockVerdicts = {
    invest: {
      recommendation: 'INVEST' as const,
      confidence: 92.5,
      summary: 'Strong investment opportunity with experienced team and growing market.',
      rationale: 'The startup demonstrates a strong product-market fit with a clear value proposition. The founding team has relevant industry experience and a track record of success. Financial projections show a clear path to profitability with reasonable assumptions.'
    },
    consider: {
      recommendation: 'CONSIDER' as const,
      confidence: 68.2,
      summary: 'Promising opportunity with some areas requiring further due diligence.',
      rationale: 'The company shows potential but has some risks that need to be carefully evaluated. The market opportunity is significant, but competition is intense. The team is capable but relatively inexperienced. Further investigation into the competitive landscape and unit economics is recommended.'
    },
    pass: {
      recommendation: 'PASS' as const,
      confidence: 78.9,
      summary: 'Significant concerns that currently outweigh the potential benefits.',
      rationale: 'The analysis indicates several red flags including unclear market differentiation, concerns about the financial projections, and key team gaps. The current risk/reward profile does not justify investment at this stage. We recommend passing on this opportunity unless significant changes are made.'
    },
    loading: null
  };

  // Real example using the hook
  const { verdict, loading, generateVerdict } = useVerdict();
  
  const handleGenerateVerdict = async () => {
    try {
      await generateVerdict({
        // Mock analysis data
        analysisId: 'demo-' + Date.now(),
        timestamp: new Date().toISOString(),
        // Add more mock data as needed
      });
    } catch (error) {
      console.error('Error generating verdict:', error);
    }
  };

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">Investment Verdict</Title>
      
      <Card className="mb-8">
        <Title level={4} className="mb-4">Interactive Demo</Title>
        <Paragraph className="mb-6">
          This is an interactive demo of the Investment Verdict component. Click the button below to generate a sample verdict.
        </Paragraph>
        
        <div className="mb-6">
          <Button 
            type="primary" 
            onClick={handleGenerateVerdict}
            loading={loading}
            icon={<ReloadOutlined />}
          >
            Generate Verdict
          </Button>
        </div>
        
        <VerdictCard 
          verdict={verdict} 
          loading={loading} 
        />
      </Card>
      
      <Card>
        <Title level={4} className="mb-6">Examples</Title>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'invest',
              label: 'Invest',
              children: <VerdictCard verdict={mockVerdicts.invest} />
            },
            {
              key: 'consider',
              label: 'Consider',
              children: <VerdictCard verdict={mockVerdicts.consider} />
            },
            {
              key: 'pass',
              label: 'Pass',
              children: <VerdictCard verdict={mockVerdicts.pass} />
            },
            {
              key: 'loading',
              label: 'Loading State',
              children: <VerdictCard verdict={null} loading={true} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default VerdictDemo;

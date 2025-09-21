import React from 'react';
import { Card, List, Typography, Tag, Space, Divider } from 'antd';
import { useVerdict } from '@/hooks/useVerdict';

const { Title, Paragraph, Text } = Typography;

interface CommitteeDebateProps {
  analysisId?: string;
}

const CommitteeDebate: React.FC<CommitteeDebateProps> = ({ analysisId }) => {
  const { verdict, loading } = useVerdict(analysisId);
  
  if (loading) {
    return (
      <Card loading={true}>
        <Title level={4}>Loading committee debate...</Title>
      </Card>
    );
  }

  if (!verdict || !verdict.committee_analysis) {
    return (
      <Card>
        <Title level={4}>Committee Debate</Title>
        <Text type="secondary">No committee debate data available</Text>
      </Card>
    );
  }

  const { members, final_verdict, consensus_score, key_debate_points } = verdict.committee_analysis;

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'STRONG_INVEST':
        return 'green';
      case 'CONSIDER':
        return 'blue';
      case 'HIGH_RISK':
        return 'orange';
      case 'PASS':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <div className="mb-6">
        <Title level={4}>Investment Committee Debate</Title>
        <Text type="secondary">
          Our AI committee has reviewed this opportunity and provided their perspectives.
          Consensus: <Tag color={getVoteColor(final_verdict)}>{final_verdict.replace('_', ' ')}</Tag> 
          ({(consensus_score * 100).toFixed(0)}% confidence)
        </Text>
      </div>

      <Divider>Committee Members</Divider>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {members.map((member, index) => (
          <Card 
            key={index} 
            size="small"
            className="h-full"
            title={
              <Space>
                <span>{member.name}</span>
                <Tag color={getVoteColor(member.vote)}>{member.vote.replace('_', ' ')}</Tag>
              </Space>
            }
            extra={<Tag>{member.role}</Tag>}
          >
            <div className="mb-2">
              <Text strong>Personality:</Text> {member.personality}
            </div>
            <div className="mb-2">
              <Text strong>Analysis:</Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                {member.analysis}
              </Paragraph>
            </div>
            <div>
              <Text strong>Reasoning:</Text>
              <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                {member.reasoning}
              </Paragraph>
            </div>
          </Card>
        ))}
      </div>

      <Divider>Key Debate Points</Divider>
      
      <List
        dataSource={key_debate_points}
        renderItem={(point, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Text type="secondary">{index + 1}.</Text>}
              description={point}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default CommitteeDebate;

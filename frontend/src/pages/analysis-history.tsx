import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Typography, Tag, Spin, Empty, Button, Space, Divider } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { getAnalysisHistory, AnalysisHistoryItem } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const { Title, Text } = Typography;

const AnalysisHistoryPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const navigate = useNavigate();

  const fetchAnalyses = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pageSize;
      const data = await getAnalysisHistory({ skip, limit: pageSize });
      setAnalyses(data);
      // Update pagination with total count if available
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total: data.length === pageSize ? page * pageSize + 1 : (page - 1) * pageSize + data.length
      }));
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchAnalyses(page, pageSize || pagination.pageSize);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'processing':
        return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
      default:
        return <Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMetricsDisplay = (metrics?: { score?: number; sentiment?: string }) => {
    if (!metrics) return null;
    
    return (
      <Space size="middle">
        {metrics.score !== undefined && (
          <Text>Score: <Text strong>{metrics.score.toFixed(1)}/10</Text></Text>
        )}
        {metrics.sentiment && (
          <Text>Sentiment: <Text strong>{metrics.sentiment}</Text></Text>
        )}
      </Space>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-full z-50">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen ml-16">
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-16 z-40 bg-white border-b border-gray-200">
          <Header />
        </div>
        
        {/* Scrollable Content */}
        <main className="flex-1 pt-16 pb-8 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <Title level={2}>Analysis History</Title>
              <Button type="primary" onClick={() => navigate('/')}>
                New Analysis
              </Button>
            </div>

        <Card>
          {loading && analyses.length === 0 ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <div className="mt-4">Loading your analysis history...</div>
            </div>
          ) : analyses.length === 0 ? (
            <Empty
              description={
                <span>No analysis history found. Start by creating your first analysis!</span>
              }
            >
              <Button type="primary" onClick={() => navigate('/')}>
                Start New Analysis
              </Button>
            </Empty>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={analyses}
              pagination={{
                ...pagination,
                onChange: handlePageChange,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              renderItem={(analysis) => (
                <List.Item
                  key={analysis.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-200 p-4 rounded"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusTag(analysis.status)}
                        <Text type="secondary" className="ml-4">
                          {formatDate(analysis.createdAt)}
                        </Text>
                      </div>
                      <Title level={5} className="mb-1">
                        {analysis.pitch_preview}
                      </Title>
                      {analysis.website_url && (
                        <Text type="secondary" className="block mb-2" ellipsis>
                          Website: {analysis.website_url}
                        </Text>
                      )}
                      {getMetricsDisplay(analysis.metrics)}
                    </div>
                    <div className="ml-4">
                      <Button type="link">View Details</Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalysisHistoryPage;

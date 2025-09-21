import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, FileText, Globe, Lightbulb } from 'lucide-react';

export interface AnalysisCardProps {
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
  onViewDetails?: (id: string) => void;
}

export function AnalysisCard({
  id,
  title,
  timestamp,
  status,
  type,
  summary,
  metadata,
  onViewDetails,
}: AnalysisCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'pitch':
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'website':
        return <Globe className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusBadge = () => {
    const statusMap = {
      completed: { label: 'Completed', variant: 'default' as const },
      processing: { label: 'Processing', variant: 'secondary' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' as const };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-muted">
            {getTypeIcon()}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">
              {format(new Date(timestamp), 'MMMM d, yyyy h:mm a')}
            </CardDescription>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      {summary && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </CardContent>
      )}
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {metadata?.wordCount && (
            <span>{metadata.wordCount} words</span>
          )}
          {metadata?.fileName && (
            <span>• {metadata.fileName}</span>
          )}
          {metadata?.url && (
            <span>• {metadata.url}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewDetails}
        >
          View Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AnalysisCard;

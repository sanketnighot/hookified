"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Copy, ExternalLink, Eye, EyeOff, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WebhookInfoProps {
  hookId: string;
}

interface WebhookDetails {
  webhookUrl: string;
  secret: string;
  lastTriggered: string | null;
  lastStatus: string | null;
  exampleCurl: string;
  instructions: {
    method: string;
    headers: Record<string, string>;
    body: string;
  };
}

interface WebhookRun {
  id: string;
  triggeredAt: string;
  status: string;
  error?: string;
}

export function WebhookInfo({ hookId }: WebhookInfoProps) {
  const [webhookDetails, setWebhookDetails] = useState<WebhookDetails | null>(null);
  const [recentRuns, setRecentRuns] = useState<WebhookRun[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchWebhookDetails = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/hooks/${hookId}/webhook-details?_t=${timestamp}`);
      if (response.ok) {
        const data = await response.json();
        setWebhookDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch webhook details:', error);
    }
  };

  const fetchRecentRuns = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/runs?hookId=${hookId}&limit=10&_t=${timestamp}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentRuns(data.runs || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent runs:", error);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchWebhookDetails(), fetchRecentRuns()]);
      setIsLoading(false);
    };
    loadData();
  }, [hookId]);

  const copyToClipboard = async (text: string, type: 'url' | 'secret') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
      toast.success(`${type === 'url' ? 'Webhook URL' : 'Secret'} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const regenerateSecret = async () => {
    if (!confirm('Are you sure you want to regenerate the webhook secret? This will break existing integrations.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/hooks/${hookId}/regenerate-secret`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookDetails(prev => prev ? { ...prev, secret: data.secret } : null);
        toast.success('Webhook secret regenerated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to regenerate secret');
      }
    } catch (error) {
      toast.error('Failed to regenerate secret');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="outline" className="text-green-400 border-green-400">Success</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="text-red-400 border-red-400">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400 border-gray-400">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-8 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!webhookDetails) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load webhook details</p>
        </CardContent>
      </Card>
    );
  }

  const exampleJavaScript = `fetch("${webhookDetails.webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-secret": "${webhookDetails.secret}"
  },
  body: JSON.stringify({
    message: "Hello from JavaScript!",
    timestamp: new Date().toISOString()
  })
});`;

  const examplePython = `import requests
import json
from datetime import datetime

url = "${webhookDetails.webhookUrl}"
headers = {
    "Content-Type": "application/json",
    "x-webhook-secret": "${webhookDetails.secret}"
}
data = {
    "message": "Hello from Python!",
    "timestamp": datetime.utcnow().isoformat() + "Z"
}

response = requests.post(url, headers=headers, json=data)`;

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Use this endpoint to trigger your hook from external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={webhookDetails.webhookUrl}
                readOnly
                className="glass font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookDetails.webhookUrl, 'url')}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
                {copiedUrl ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Webhook Secret</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                value={webhookDetails.secret}
                readOnly
                className="glass font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
                className="shrink-0"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookDetails.secret, 'secret')}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
                {copiedSecret ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateSecret}
                disabled={isRegenerating}
                className="shrink-0 text-orange-400 border-orange-400 hover:bg-orange-400/10"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Last Triggered */}
          {webhookDetails.lastTriggered && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Triggered</Label>
              <div className="flex items-center gap-2">
                {getStatusIcon(webhookDetails.lastStatus || '')}
                <span className="text-sm text-muted-foreground">
                  {new Date(webhookDetails.lastTriggered).toLocaleString()}
                </span>
                {getStatusBadge(webhookDetails.lastStatus || '')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>
            Copy these examples to integrate with your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg glass border border-white/10 text-xs font-mono overflow-x-auto">
                  {webhookDetails.exampleCurl}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookDetails.exampleCurl, 'url')}
                  className="absolute top-2 right-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="javascript" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg glass border border-white/10 text-xs font-mono overflow-x-auto">
                  {exampleJavaScript}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleJavaScript, 'url')}
                  className="absolute top-2 right-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="python" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg glass border border-white/10 text-xs font-mono overflow-x-auto">
                  {examplePython}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(examplePython, 'url')}
                  className="absolute top-2 right-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Always use HTTPS</p>
              <p className="text-xs text-muted-foreground">
                Ensure your webhook endpoint is only accessible via HTTPS in production
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Validate the secret</p>
              <p className="text-xs text-muted-foreground">
                Always verify the x-webhook-secret header matches your configured secret
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Rate limiting</p>
              <p className="text-xs text-muted-foreground">
                Implement rate limiting on your webhook endpoint to prevent abuse
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Secret rotation</p>
              <p className="text-xs text-muted-foreground">
                Regularly rotate your webhook secret for enhanced security
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

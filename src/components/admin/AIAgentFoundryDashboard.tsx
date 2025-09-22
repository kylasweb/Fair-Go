import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bot, 
  Phone, 
  BarChart3, 
  Database, 
  Shield, 
  Play, 
  Pause, 
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

interface AIAgentConfig {
  id: string;
  name: string;
  type: 'booking' | 'support' | 'driver' | 'custom';
  isActive: boolean;
  model: string;
  systemPrompt: string;
  customInstructions: string;
  performance: {
    successRate?: number;
    avgCallDuration?: number;
    userSatisfaction?: number;
  };
}

interface AIServiceSettings {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isEnabled: boolean;
  };
  googleCloud: {
    projectId: string;
    credentialsJson: string;
    isEnabled: boolean;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    isEnabled: boolean;
  };
}

interface SystemSettings {
  defaultLanguage: string;
  supportedLanguages: string[];
  sessionTimeout: number;
  maxConcurrentCalls: number;
  recordCalls: boolean;
  enableAnalytics: boolean;
}

interface Analytics {
  totalCalls: number;
  successfulBookings: number;
  avgCallDuration: number;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    callsHandled: number;
    successRate: number;
    avgDuration: number;
  }>;
}

export default function AIAgentFoundryDashboard() {
  const [agents, setAgents] = useState<AIAgentConfig[]>([]);
  const [aiServices, setAIServices] = useState<AIServiceSettings>({
    openai: { apiKey: '', model: 'gpt-4', temperature: 0.3, maxTokens: 150, isEnabled: false },
    googleCloud: { projectId: '', credentialsJson: '', isEnabled: false },
    twilio: { accountSid: '', authToken: '', phoneNumber: '', isEnabled: false }
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ml', 'hi'],
    sessionTimeout: 15,
    maxConcurrentCalls: 100,
    recordCalls: true,
    enableAnalytics: true
  });
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCalls: 0,
    successfulBookings: 0,
    avgCallDuration: 0,
    agentPerformance: []
  });
  const [selectedAgent, setSelectedAgent] = useState<AIAgentConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load initial data
  useEffect(() => {
    loadConfiguration();
    loadAnalytics();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ivr-config');
      const data = await response.json();
      setAgents(data.agents || []);
      setAIServices(data.aiServices || aiServices);
      setSystemSettings(data.systemSettings || systemSettings);
    } catch (error) {
      showNotification('error', 'Failed to load configuration');
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/ivr-analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const saveAIServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ivr-config/ai-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiServices)
      });
      
      if (response.ok) {
        showNotification('success', 'AI services configuration saved');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      showNotification('error', 'Failed to save AI services configuration');
    }
    setLoading(false);
  };

  const saveSystemSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ivr-config/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });
      
      if (response.ok) {
        showNotification('success', 'System settings saved');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showNotification('error', 'Failed to save system settings');
    }
    setLoading(false);
  };

  const saveAgent = async (agent: AIAgentConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ivr-config/agents', {
        method: agent.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      
      if (response.ok) {
        await loadConfiguration();
        setSelectedAgent(null);
        setIsEditing(false);
        showNotification('success', 'Agent configuration saved');
      } else {
        throw new Error('Failed to save agent');
      }
    } catch (error) {
      showNotification('error', 'Failed to save agent configuration');
    }
    setLoading(false);
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ivr-config/agents/${agentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadConfiguration();
        showNotification('success', 'Agent deleted successfully');
      } else {
        throw new Error('Failed to delete agent');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete agent');
    }
    setLoading(false);
  };

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    await saveAgent({ ...agent, isActive });
  };

  const testConnectivity = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ivr-config/test-connectivity');
      const results = await response.json();
      
      const failedServices = Object.entries(results).filter(([_, status]) => !status);
      if (failedServices.length > 0) {
        showNotification('error', `Connection failed: ${failedServices.map(([name]) => name).join(', ')}`);
      } else {
        showNotification('success', 'All services connected successfully');
      }
    } catch (error) {
      showNotification('error', 'Failed to test connectivity');
    }
    setLoading(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const createNewAgent = () => {
    const newAgent: AIAgentConfig = {
      id: '',
      name: '',
      type: 'custom',
      isActive: false,
      model: 'gpt-4',
      systemPrompt: '',
      customInstructions: '',
      performance: {}
    };
    setSelectedAgent(newAgent);
    setIsEditing(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🤖 FairGo AI Agent Foundry</h1>
        <p className="text-gray-600 mt-2">
          Create, manage, and optimize AI agents for the conversational IVR system
        </p>
      </div>

      {notification && (
        <Alert className={`mb-6 ${notification.type === 'success' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">
            <Bot className="w-4 h-4 mr-2" />
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="services">
            <Settings className="w-4 h-4 mr-2" />
            AI Services
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* AI Agents Tab */}
        <TabsContent value="agents">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">AI Agents</h2>
                <Button onClick={createNewAgent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </div>
              
              <div className="grid gap-4">
                {agents.map(agent => (
                  <Card key={agent.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{agent.type}</Badge>
                            <Badge variant="outline">{agent.model}</Badge>
                            {agent.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAgent(agent.id, !agent.isActive)}
                          >
                            {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedAgent(agent); setIsEditing(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAgent(agent.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Success Rate</p>
                          <p className="font-medium">{agent.performance.successRate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Duration</p>
                          <p className="font-medium">{agent.performance.avgCallDuration || 0}s</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Satisfaction</p>
                          <p className="font-medium">{agent.performance.userSatisfaction || 0}/5</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Agent Configuration Panel */}
            <div>
              {isEditing && selectedAgent && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedAgent.id ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="agent-name">Agent Name</Label>
                      <Input
                        id="agent-name"
                        value={selectedAgent.name}
                        onChange={(e) => setSelectedAgent({ ...selectedAgent, name: e.target.value })}
                        placeholder="e.g., Booking Coordinator"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agent-type">Agent Type</Label>
                      <Select
                        value={selectedAgent.type}
                        onValueChange={(value: 'booking' | 'support' | 'driver' | 'custom') =>
                          setSelectedAgent({ ...selectedAgent, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking">Booking Coordinator</SelectItem>
                          <SelectItem value="support">Ride Support Specialist</SelectItem>
                          <SelectItem value="driver">Driver Concierge</SelectItem>
                          <SelectItem value="custom">Custom Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="agent-model">AI Model</Label>
                      <Select
                        value={selectedAgent.model}
                        onValueChange={(value) => setSelectedAgent({ ...selectedAgent, model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Premium)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Standard)</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="system-prompt">System Prompt</Label>
                      <Textarea
                        id="system-prompt"
                        value={selectedAgent.systemPrompt}
                        onChange={(e) => setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value })}
                        placeholder="Define the agent's persona and core instructions..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-instructions">Custom Instructions</Label>
                      <Textarea
                        id="custom-instructions"
                        value={selectedAgent.customInstructions}
                        onChange={(e) => setSelectedAgent({ ...selectedAgent, customInstructions: e.target.value })}
                        placeholder="Add specific instructions for Kerala context, Manglish handling, etc..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="agent-active"
                        checked={selectedAgent.isActive}
                        onCheckedChange={(checked) => setSelectedAgent({ ...selectedAgent, isActive: checked })}
                      />
                      <Label htmlFor="agent-active">Activate Agent</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => saveAgent(selectedAgent)} disabled={loading}>
                        {selectedAgent.id ? 'Update Agent' : 'Create Agent'}
                      </Button>
                      <Button variant="outline" onClick={() => { setSelectedAgent(null); setIsEditing(false); }}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AI Services Tab */}
        <TabsContent value="services">
          <div className="grid gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Service Configuration</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={testConnectivity}>
                  <Activity className="w-4 h-4 mr-2" />
                  Test Connectivity
                </Button>
                <Button onClick={saveAIServices} disabled={loading}>
                  Save Configuration
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* OpenAI Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    OpenAI
                  </CardTitle>
                  <CardDescription>Configure OpenAI GPT models for conversation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={aiServices.openai.isEnabled}
                      onCheckedChange={(checked) => setAIServices({
                        ...aiServices,
                        openai: { ...aiServices.openai, isEnabled: checked }
                      })}
                    />
                    <Label>Enable OpenAI</Label>
                  </div>
                  
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={aiServices.openai.apiKey}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        openai: { ...aiServices.openai, apiKey: e.target.value }
                      })}
                      placeholder="sk-..."
                    />
                  </div>

                  <div>
                    <Label>Default Model</Label>
                    <Select
                      value={aiServices.openai.model}
                      onValueChange={(value) => setAIServices({
                        ...aiServices,
                        openai: { ...aiServices.openai, model: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Temperature: {aiServices.openai.temperature}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiServices.openai.temperature}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        openai: { ...aiServices.openai, temperature: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={aiServices.openai.maxTokens}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        openai: { ...aiServices.openai, maxTokens: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Google Cloud Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Google Cloud
                  </CardTitle>
                  <CardDescription>Configure Speech-to-Text and Text-to-Speech</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={aiServices.googleCloud.isEnabled}
                      onCheckedChange={(checked) => setAIServices({
                        ...aiServices,
                        googleCloud: { ...aiServices.googleCloud, isEnabled: checked }
                      })}
                    />
                    <Label>Enable Google Cloud</Label>
                  </div>

                  <div>
                    <Label>Project ID</Label>
                    <Input
                      value={aiServices.googleCloud.projectId}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        googleCloud: { ...aiServices.googleCloud, projectId: e.target.value }
                      })}
                      placeholder="your-project-id"
                    />
                  </div>

                  <div>
                    <Label>Service Account JSON</Label>
                    <Textarea
                      value={aiServices.googleCloud.credentialsJson}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        googleCloud: { ...aiServices.googleCloud, credentialsJson: e.target.value }
                      })}
                      placeholder="Paste service account JSON here..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Twilio Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Twilio
                  </CardTitle>
                  <CardDescription>Configure voice communication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={aiServices.twilio.isEnabled}
                      onCheckedChange={(checked) => setAIServices({
                        ...aiServices,
                        twilio: { ...aiServices.twilio, isEnabled: checked }
                      })}
                    />
                    <Label>Enable Twilio</Label>
                  </div>

                  <div>
                    <Label>Account SID</Label>
                    <Input
                      value={aiServices.twilio.accountSid}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        twilio: { ...aiServices.twilio, accountSid: e.target.value }
                      })}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <Label>Auth Token</Label>
                    <Input
                      type="password"
                      value={aiServices.twilio.authToken}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        twilio: { ...aiServices.twilio, authToken: e.target.value }
                      })}
                      placeholder="Auth token"
                    />
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={aiServices.twilio.phoneNumber}
                      onChange={(e) => setAIServices({
                        ...aiServices,
                        twilio: { ...aiServices.twilio, phoneNumber: e.target.value }
                      })}
                      placeholder="+1234567890"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system">
          <div className="max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">System Settings</h2>
              <Button onClick={saveSystemSettings} disabled={loading}>
                Save Settings
              </Button>
            </div>

            <Card>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label>Default Language</Label>
                  <Select
                    value={systemSettings.defaultLanguage}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, defaultLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ml">Malayalam</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Max Concurrent Calls</Label>
                  <Input
                    type="number"
                    value={systemSettings.maxConcurrentCalls}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maxConcurrentCalls: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={systemSettings.recordCalls}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, recordCalls: checked })}
                  />
                  <Label>Record Calls</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={systemSettings.enableAnalytics}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableAnalytics: checked })}
                  />
                  <Label>Enable Analytics</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">IVR System Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.totalCalls}</p>
                  <p className="text-sm text-gray-600">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Successful Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.successfulBookings}</p>
                  <p className="text-sm text-gray-600">
                    {analytics.totalCalls > 0 
                      ? `${((analytics.successfulBookings / analytics.totalCalls) * 100).toFixed(1)}% success rate`
                      : '0% success rate'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Avg Call Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.avgCallDuration}s</p>
                  <p className="text-sm text-gray-600">Per conversation</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.agentPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.agentPerformance.map(agent => (
                      <div key={agent.agentId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-sm text-gray-600">{agent.callsHandled} calls handled</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{agent.successRate}% success</p>
                          <p className="text-sm text-gray-600">{agent.avgDuration}s avg duration</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No performance data available yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
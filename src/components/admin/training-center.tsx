'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Brain, 
  Database, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

// Types for training data
interface TrainingExample {
  id: string;
  prompt: string;
  completion: string;
  language: 'ml' | 'en' | 'ml-en' | 'hi' | 'ta' | 'te';
  source: 'API_SUBMISSION' | 'MANUAL_CORRECTION' | 'SYNTHETIC_DATA' | 'USER_FEEDBACK';
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  metadata?: any;
  confidence?: number;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface FinetuneJob {
  id: string;
  name: string;
  description?: string;
  status: 'PREPARING' | 'TRAINING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  sourceDatasetSize: number;
  datasetFilters?: any;
  externalJobId?: string;
  resultingModelId?: string;
  accuracy?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ModelConfig {
  id: string;
  key: string;
  value: string;
  description: string;
}

const languageNames = {
  ml: 'മലയാളം',
  en: 'English',
  'ml-en': 'Manglish',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు'
};

const statusColors = {
  'PENDING_REVIEW': 'orange',
  'APPROVED': 'green',
  'REJECTED': 'red',
  'NEEDS_REVISION': 'yellow',
  'PREPARING': 'blue',
  'TRAINING': 'purple',
  'COMPLETED': 'green',
  'FAILED': 'red',
  'CANCELLED': 'gray'
};

export default function TrainingCenter() {
  // State management
  const [activeTab, setActiveTab] = useState('examples');
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [finetuneJobs, setFinetuneJobs] = useState<FinetuneJob[]>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Form states
  const [selectedExample, setSelectedExample] = useState<TrainingExample | null>(null);
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ml']);

  // Load data on component mount
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    setLoading(true);
    try {
      // Load training examples
      const examplesRes = await fetch('/api/admin/training/examples');
      if (examplesRes.ok) {
        const examples = await examplesRes.json();
        setTrainingExamples(examples);
      }

      // Load finetune jobs
      const jobsRes = await fetch('/api/admin/training/jobs');
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        setFinetuneJobs(jobs);
      }

      // Load model configuration
      const configRes = await fetch('/api/admin/config');
      if (configRes.ok) {
        const config = await configRes.json();
        setModelConfig(config);
      }
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load training data. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleExampleReview = async (exampleId: string, status: string, feedback?: string) => {
    try {
      const response = await fetch(`/api/admin/training/examples/${exampleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, feedback }),
      });

      if (response.ok) {
        await loadTrainingData();
        toast({
          title: "Example updated",
          description: `Training example has been ${status.toLowerCase().replace('_', ' ')}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update training example.",
        variant: "destructive"
      });
    }
  };

  const handleStartFinetuning = async () => {
    if (!newJobName.trim()) {
      toast({
        title: "Job name required",
        description: "Please provide a name for the fine-tuning job.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/training/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newJobName,
          description: newJobDescription,
          languages: selectedLanguages,
          approvedOnly: true
        }),
      });

      if (response.ok) {
        await loadTrainingData();
        setShowJobDialog(false);
        setNewJobName('');
        setNewJobDescription('');
        toast({
          title: "Fine-tuning started",
          description: "New fine-tuning job has been queued.",
        });
      }
    } catch (error) {
      toast({
        title: "Job creation failed",
        description: "Failed to start fine-tuning job.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateModelConfig = async (configId: string, newValue: string) => {
    try {
      const response = await fetch(`/api/admin/config/${configId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue }),
      });

      if (response.ok) {
        await loadTrainingData();
        toast({
          title: "Configuration updated",
          description: "Model configuration has been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update configuration.",
        variant: "destructive"
      });
    }
  };

  // Filter training examples
  const filteredExamples = trainingExamples.filter(example => {
    if (statusFilter !== 'all' && example.status !== statusFilter) return false;
    if (languageFilter !== 'all' && example.language !== languageFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExamples.length / itemsPerPage);
  const paginatedExamples = filteredExamples.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = {
    totalExamples: trainingExamples.length,
    pendingReview: trainingExamples.filter(e => e.status === 'PENDING_REVIEW').length,
    approved: trainingExamples.filter(e => e.status === 'APPROVED').length,
    rejected: trainingExamples.filter(e => e.status === 'REJECTED').length,
    activeJobs: finetuneJobs.filter(j => ['PREPARING', 'TRAINING'].includes(j.status)).length,
    completedJobs: finetuneJobs.filter(j => j.status === 'COMPLETED').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Training Center</h1>
          <p className="text-muted-foreground">
            Manage training data and fine-tune AI models for better performance
          </p>
        </div>
        <Button onClick={() => setShowJobDialog(true)} className="gap-2">
          <Zap className="h-4 w-4" />
          Start Fine-tuning
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Examples</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExamples}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="examples">Training Examples</TabsTrigger>
          <TabsTrigger value="jobs">Fine-tuning Jobs</TabsTrigger>
          <TabsTrigger value="config">Model Configuration</TabsTrigger>
        </TabsList>

        {/* Training Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Data Management</CardTitle>
              <CardDescription>
                Review and manage AI training examples from various sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="language-filter">Language</Label>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {Object.entries(languageNames).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Examples Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExamples.map((example) => (
                    <TableRow key={example.id}>
                      <TableCell className="max-w-xs truncate" title={example.prompt}>
                        {example.prompt}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {languageNames[example.language]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {example.source.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={example.status === 'APPROVED' ? 'default' : 'secondary'}
                          className={`bg-${statusColors[example.status]}-100 text-${statusColors[example.status]}-800`}
                        >
                          {example.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(example.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedExample(example);
                              setShowExampleDialog(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {example.status === 'PENDING_REVIEW' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleExampleReview(example.id, 'APPROVED')}
                              >
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleExampleReview(example.id, 'REJECTED')}
                              >
                                <XCircle className="h-3 w-3 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExamples.length)} of {filteredExamples.length} examples
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fine-tuning Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fine-tuning Jobs</CardTitle>
              <CardDescription>
                Monitor and manage AI model fine-tuning processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Dataset Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finetuneJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{job.name}</div>
                          {job.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {job.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{job.sourceDatasetSize} examples</TableCell>
                      <TableCell>
                        <Badge 
                          variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className={`bg-${statusColors[job.status]}-100 text-${statusColors[job.status]}-800`}
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.accuracy ? `${(job.accuracy * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {job.startedAt ? new Date(job.startedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {job.startedAt && job.completedAt 
                          ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / (1000 * 60))}m`
                          : job.startedAt 
                            ? 'Running...'
                            : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {job.status === 'COMPLETED' && job.resultingModelId && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateModelConfig('active_ai_model_id', job.resultingModelId!)}
                            >
                              <Play className="h-3 w-3" />
                              Activate
                            </Button>
                          )}
                          {job.error && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                              View Error
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Manage AI model settings and active configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelConfig.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{config.key.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={config.value} 
                      onChange={(e) => {
                        setModelConfig(prev => prev.map(c => 
                          c.id === config.id ? {...c, value: e.target.value} : c
                        ));
                      }}
                      className="w-64"
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateModelConfig(config.id, config.value)}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Example Detail Dialog */}
      {selectedExample && (
        <AlertDialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Training Example Details</AlertDialogTitle>
              <AlertDialogDescription>
                Review and manage this training example
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <Textarea value={selectedExample.prompt} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Expected Completion</Label>
                <Textarea value={selectedExample.completion} readOnly className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language</Label>
                  <Badge className="mt-1">{languageNames[selectedExample.language]}</Badge>
                </div>
                <div>
                  <Label>Source</Label>
                  <Badge variant="secondary" className="mt-1">{selectedExample.source}</Badge>
                </div>
              </div>
              {selectedExample.confidence && (
                <div>
                  <Label>Confidence Score</Label>
                  <Progress value={selectedExample.confidence * 100} className="mt-1" />
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              {selectedExample.status === 'PENDING_REVIEW' && (
                <>
                  <AlertDialogAction 
                    onClick={() => {
                      handleExampleReview(selectedExample.id, 'APPROVED');
                      setShowExampleDialog(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </AlertDialogAction>
                  <AlertDialogAction 
                    onClick={() => {
                      handleExampleReview(selectedExample.id, 'REJECTED');
                      setShowExampleDialog(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* New Fine-tuning Job Dialog */}
      <AlertDialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Fine-tuning Job</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new fine-tuning job using approved training data
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-name">Job Name</Label>
              <Input 
                id="job-name"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                placeholder="e.g., Malayalam Enhancement v2"
              />
            </div>
            <div>
              <Label htmlFor="job-description">Description (Optional)</Label>
              <Textarea 
                id="job-description"
                value={newJobDescription}
                onChange={(e) => setNewJobDescription(e.target.value)}
                placeholder="Describe the purpose of this fine-tuning job..."
              />
            </div>
            <div>
              <Label>Languages to Include</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(languageNames).map(([code, name]) => (
                  <Button
                    key={code}
                    variant={selectedLanguages.includes(code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedLanguages.includes(code)) {
                        setSelectedLanguages(prev => prev.filter(lang => lang !== code));
                      } else {
                        setSelectedLanguages(prev => [...prev, code]);
                      }
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <Alert>
              <AlertDescription>
                This will use {stats.approved} approved training examples for fine-tuning.
                The process may take several hours to complete.
              </AlertDescription>
            </Alert>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNewJobName('');
              setNewJobDescription('');
              setSelectedLanguages(['ml']);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStartFinetuning}>
              Start Fine-tuning
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
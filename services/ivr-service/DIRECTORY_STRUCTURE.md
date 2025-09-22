# 📁 FairGo IVR Service & AI Training Center - Directory Structure

## IVR Service Structure

```
services/ivr-service/
├── src/
│   ├── controllers/
│   │   ├── callController.ts          # Main IVR call orchestration
│   │   ├── webhookController.ts       # Twilio webhook handlers
│   │   └── healthController.ts        # Health check endpoint
│   ├── services/
│   │   ├── aiService.ts              # Puter.js AI integration
│   │   ├── callService.ts            # Call flow management
│   │   ├── bookingService.ts         # FairGo API integration
│   │   ├── smsService.ts             # SMS notifications
│   │   └── configService.ts          # Dynamic model config loading
│   ├── middleware/
│   │   ├── auth.ts                   # Twilio webhook validation
│   │   ├── errorHandler.ts           # Global error handling
│   │   └── logging.ts                # Request logging
│   ├── models/
│   │   ├── callSession.ts            # Call session data structure
│   │   ├── bookingIntent.ts          # AI interpretation models
│   │   └── callState.ts              # State machine definitions
│   ├── utils/
│   │   ├── validation.ts             # Input validation schemas
│   │   ├── constants.ts              # System constants
│   │   └── logger.ts                 # Winston logger configuration
│   ├── types/
│   │   ├── twilio.ts                 # Twilio-specific types
│   │   ├── puter.ts                  # Puter.js types
│   │   └── fairgo.ts                 # FairGo API types
│   ├── config/
│   │   ├── database.ts               # Redis configuration
│   │   ├── twilio.ts                 # Twilio client setup
│   │   └── environment.ts            # Environment variables
│   ├── routes/
│   │   ├── calls.ts                  # Call-related routes
│   │   ├── webhooks.ts               # Twilio webhook routes
│   │   └── health.ts                 # Health check routes
│   └── app.ts                        # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── api.md                        # API documentation
│   ├── call-flow.md                  # Call flow diagrams
│   └── deployment.md                 # Deployment guide
├── scripts/
│   ├── start.sh                      # Startup script
│   └── deploy.sh                     # Deployment script
├── .env.example                      # Environment variables template
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── Dockerfile                        # Container configuration
└── README.md                         # Service documentation
```

## Training Center Components (Admin Dashboard)

```
src/components/admin/training/
├── TrainingCenter.tsx                # Main training center dashboard
├── ConversationAnalyzer.tsx          # Call log analysis & correction
├── DatasetManagement.tsx             # JSONL upload & dataset viewer
├── ModelTraining.tsx                 # Fine-tuning job management
├── ModelVersioning.tsx               # Model selection & deployment
├── TrainingMetrics.tsx               # Performance analytics
└── components/
    ├── CorrectionModal.tsx           # AI interpretation correction UI
    ├── DatasetUploader.tsx           # File upload component
    ├── JobStatusCard.tsx             # Training job status display
    ├── ModelSelector.tsx             # Active model selection
    ├── MetricsChart.tsx              # Training metrics visualization
    └── TrainingDataTable.tsx         # Training examples table

src/pages/admin/training/
├── index.tsx                         # Training center main page
├── conversations.tsx                 # Conversation analysis page
├── datasets.tsx                      # Dataset management page
├── models.tsx                        # Model management page
└── analytics.tsx                     # Training analytics page

src/lib/training/
├── trainingAPI.ts                    # Training API client
├── datasetValidator.ts               # JSONL validation
├── modelManager.ts                   # Model deployment logic
└── metricsCalculator.ts              # Performance metrics
```

## Database Extensions

```
prisma/migrations/
├── add_ai_training_tables.sql        # Training tables schema
└── add_config_table.sql              # App configuration table

prisma/
├── schema.prisma                     # Updated schema with training tables
└── seed-training.ts                  # Training data seeder
```

## API Extensions

```
src/app/api/v1/ai/
├── training-data/
│   ├── route.ts                      # POST /api/v1/ai/training-data
│   └── [id]/route.ts                 # GET/PUT/DELETE individual examples
├── finetune-jobs/
│   ├── route.ts                      # POST /api/v1/ai/finetune-jobs
│   └── [id]/route.ts                 # GET job status
├── models/
│   ├── route.ts                      # GET available models
│   └── activate/route.ts             # POST activate model
└── config/
    └── route.ts                      # GET/PUT AI configuration
```

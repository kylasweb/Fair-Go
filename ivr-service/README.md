# FairGo AI-Powered IVR System

A sophisticated conversational AI-powered Interactive Voice Response (IVR) system that transforms traditional "press 1 for this, press 2 for that" menu-based interactions into natural, voice-driven booking conversations.

## 🚀 Overview

The FairGo IVR system leverages cutting-edge AI technologies to provide a seamless voice booking experience for customers in Kerala, India. The system understands natural speech in multiple languages, processes booking requests intelligently, and integrates seamlessly with FairGo's existing ride-hailing infrastructure.

### Key Features

- **Natural Language Processing**: Understand customer intent from natural speech
- **Multi-language Support**: English, Malayalam, and Hindi recognition
- **Real-time Audio Processing**: Sub-second response times for seamless conversations
- **Kerala-Specific Optimization**: Recognition of local landmarks and cultural context
- **AI Agent Foundry**: Visual workflow builder for creating and managing AI agents
- **Admin Dashboard Integration**: Complete configuration management from the admin panel

## 🏗️ Architecture

```
Caller → Twilio → WebSocket → AudioStreamHandler
                                    ↓
         STT Service ← Audio Stream ← Session Manager
                ↓
         AI Service (GPT-4) → Booking Logic
                ↓
         TTS Service → Audio Response
                ↓
         WebSocket → Twilio → Caller
```

### Core Components

1. **SpeechToTextService**: Real-time streaming speech recognition with Kerala accent optimization
2. **ConversationalAIService**: OpenAI GPT-4 integration with function calling for intelligent conversations
3. **TextToSpeechService**: Natural voice synthesis optimized for telephony
4. **AudioStreamHandler**: Real-time bidirectional WebSocket audio streaming
5. **SessionManager**: Conversation state management and persistence
6. **ConfigManager**: Centralized configuration with admin dashboard integration

## 🤖 FairGo AI Agent Foundry

The AI Agent Foundry is an innovative feature within the FairGo admin panel that allows non-technical administrators to create, train, and manage a sophisticated ecosystem of AI agents for the IVR system.

### 1. Agent Creation & Configuration

**Visual Agent Builder Interface:**

- **Agent Name**: Unique identifier (e.g., "Booking Coordinator")
- **Purpose**: Clear description of the agent's role and responsibilities
- **Model Selection**: Choose from GPT-4o, Gemini Pro, Claude based on requirements
- **System Instructions**: Core prompt defining agent persona and rules
- **Custom Instructions**: Specific instructions for local context and "Manglish" handling

### 2. Training & Knowledge Management

**Knowledge Base Training:**

- Upload documents (PDFs, text files, spreadsheets) with relevant information
- FAQ documents, service area lists, policy documents
- Automatic conversion to searchable format for agent access

**Fine-Tuning:**

- Upload example conversation datasets
- Train models to align with FairGo brand tone
- Improve performance for specific use cases

### 3. Advanced AI Agent Workflow Builder

**Visual No-Code Interface:**

**Available Nodes:**

- **Start Call**: Initialize conversation with greeting
- **Get User Input**: Capture and process user speech
- **Play Audio**: Text-to-speech response generation
- **Conditional Logic**: If/else branching based on user intent
- **Call API**: Integration with FairGo backend services
- **Transfer Call**: Route to specialized agents
- **End Call**: Graceful conversation termination

**Workflow Features:**

- **Drag-and-Drop**: Visual workflow design
- **Nested Workflows**: Sub-processes for complex operations
- **API Integration**: Direct connection to FairGo backend
- **Real-time Testing**: Test workflows before deployment

### 4. Agent Stacking & Hierarchy

**Multi-Agent System:**

- **Primary Router Agent**: Handles initial interactions
- **Specialized Agents**: Transfer based on user intent
- **Parallel Hierarchies**: Separate agent systems for different user types
- **Intelligent Routing**: Context-aware agent selection

## 🤖 Initial AI Agent Definitions

### 1. Booking Coordinator Agent

**Purpose**: Primary frontline agent for ride bookings through IVR system

**Workflow Configuration:**

```
Start Call → Welcome & Language Selection
     ↓
Get User Intent → Understand booking request
     ↓
Gather Information → Collect pickup/destination/vehicle type
     ↓
Call Booking API → Execute ride booking
     ↓
Conditional Logic → Check booking success
     ↓
Confirmation Response → Provide ETA and fare
     ↓
End Call
```

**Hierarchical Relations**: Top-level agent, first point of contact
**Task Handling**: New ride bookings exclusively
**Performance Metrics**:

- Booking Success Rate (%)
- Average Call Duration (seconds)
- Information Accuracy Rate (%)

**Dependencies**:

- FairGo Booking API access
- Fixed Fare Algorithm integration
- AI-Based Dispatch system

### 2. Ride Support Specialist Agent

**Purpose**: Handle post-booking issues and safety-related queries

**Workflow Configuration:**

```
Receive Transfer → Get user context and ride ID
     ↓
Get User Intent → Understand specific issue
     ↓
Fetch Ride Data → API call for user's recent rides
     ↓
Conditional Logic → Branch based on issue type
     ↓
├── Cancel Ride → Execute cancellation
├── Lost Item → Log report and inform process
├── Emergency → Trigger emergency protocol
└── Payment Issue → Handle billing queries
     ↓
Respond to User → Confirm action taken
     ↓
End Call
```

**Hierarchical Relations**: Secondary agent receiving transfers
**Task Handling**: Support and emergency situations
**Performance Metrics**:

- Issue Resolution Rate (%)
- Average Handling Time
- User Satisfaction Score

**Dependencies**:

- Ride history API access
- Payment gateway integration
- Emergency alert system protocol

### 3. Driver Concierge Agent

**Purpose**: Dedicated support for FairGo drivers

**Workflow Configuration:**

```
Start Call → Driver-specific phone number
     ↓
Authenticate Driver → Validate driver ID
     ↓
Get Driver Intent → Understand query type
     ↓
Call Driver API → Fetch relevant information
     ↓
├── Weekly Earnings → Provide earnings summary
├── Subscription Details → Share plan information
├── Onboarding Info → Guide through process
└── General Support → Handle misc queries
     ↓
Respond with Information → Relay requested data
     ↓
End Call
```

**Hierarchical Relations**: Parallel hierarchy for driver communication
**Task Handling**: Driver-specific queries only
**Performance Metrics**:

- Driver Satisfaction Score
- First-call Resolution Rate
- Reduction in human support calls

**Dependencies**:

- Driver Data API access
- Driver Subscriptions system
- Training & Onboarding Kit information

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18.0.0 or higher
- Google Cloud Account with Speech-to-Text and Text-to-Speech APIs enabled
- OpenAI API access
- Twilio account for voice communication
- FairGo admin dashboard access

### Installation Steps

1. **Clone Repository**

```bash
git clone https://github.com/fairgo/ivr-service.git
cd ivr-service
```

2. **Install Dependencies**

```bash
npm install --legacy-peer-deps
```

3. **Environment Configuration**

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Database Setup**

```bash
npx prisma migrate dev --name init
```

5. **Build and Start**

```bash
npm run build
npm start
```

## 🔧 Configuration

### Admin Dashboard Integration

All configuration is managed through the FairGo Admin Dashboard:

1. **AI Service Settings**

   - OpenAI API keys and model selection
   - Google Cloud credentials and project settings
   - Twilio account configuration

2. **Agent Management**

   - Create and configure AI agents
   - Design conversation workflows
   - Set performance metrics and monitoring

3. **Kerala Location Context**

   - Manage landmark databases
   - Configure local language support
   - Update service area information

4. **System Parameters**
   - Audio processing settings
   - Session timeout configurations
   - Rate limiting and security settings

### Environment Variables

```env
# Core Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# AI Service APIs (Configured via Admin Dashboard)
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_PROJECT=fairgo-ivr
TWILIO_ACCOUNT_SID=ACxx...
TWILIO_AUTH_TOKEN=xxx...

# Database
DATABASE_URL=postgresql://...

# Session Management
SESSION_TIMEOUT=15
MAX_CONVERSATION_TURNS=50

# Audio Processing
AUDIO_SAMPLE_RATE=8000
AUDIO_CHANNELS=1
```

## 📊 Monitoring & Analytics

### Performance Metrics

**System-wide Metrics:**

- Total calls processed
- Average response time
- Success rate by agent type
- Language distribution

**Agent-specific Metrics:**

- Booking conversion rates
- Issue resolution efficiency
- User satisfaction scores
- Call duration statistics

### Dashboard Features

**Real-time Monitoring:**

- Active call visualization
- Agent performance dashboards
- Error rate monitoring
- Resource utilization tracking

**Historical Analytics:**

- Conversation flow analysis
- Peak usage patterns
- Agent effectiveness trends
- User behavior insights

## 🔐 Security & Compliance

### Data Protection

- End-to-end encryption for voice data
- PCI DSS compliance for payment information
- GDPR-compliant data handling
- Automatic data purging policies

### Access Control

- Role-based admin access
- API key rotation
- Audit trail logging
- Secure credential management

## 🚀 Deployment

### Production Deployment

1. **Server Requirements**

```
- 4+ CPU cores
- 8GB+ RAM
- 100GB+ storage
- High-bandwidth network connection
```

2. **Infrastructure Setup**

```bash
# Using Docker
docker build -t fairgo-ivr .
docker run -p 3001:3001 fairgo-ivr

# Using PM2
pm2 start dist/index.js --name fairgo-ivr
```

3. **Load Balancing**

- Configure multiple instances for high availability
- Implement WebSocket sticky sessions
- Set up health check endpoints

### Scaling Considerations

**Horizontal Scaling:**

- Multi-instance deployment
- Redis session sharing
- Database connection pooling

**Vertical Scaling:**

- CPU optimization for AI processing
- Memory allocation for audio buffering
- Network bandwidth for real-time streaming

## 📝 API Documentation

### Webhook Endpoints

**POST /webhook/voice**

- Twilio voice webhook handler
- Initiates WebSocket audio streaming
- Returns TwiML response

**POST /webhook/status**

- Call status notifications
- Logging and analytics data
- Call completion handling

### Management APIs

**GET /api/sessions**

- List active and historical sessions
- Query parameters for filtering
- Pagination support

**POST /api/ai/process-text**

- Direct text processing endpoint
- Testing and debugging interface
- Response preview functionality

**GET /api/analytics/overview**

- System-wide performance metrics
- Real-time statistics
- Historical trend data

## 🤝 Contributing

### Development Setup

1. **Local Development**

```bash
npm run dev
# Starts development server with hot reload
```

2. **Testing**

```bash
npm test
npm run test:watch
```

3. **Code Quality**

```bash
npm run lint
npm run type-check
```

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

## 📞 Support

### Technical Support

- **Email**: tech-support@fairgo.com
- **Phone**: +91-XXX-XXX-XXXX
- **Documentation**: https://docs.fairgo.com/ivr

### Business Inquiries

- **Email**: business@fairgo.com
- **Demo Requests**: https://fairgo.com/demo

## 📄 License

This project is proprietary software owned by FairGo Technologies Pvt Ltd. All rights reserved.

---

**FairGo IVR System v1.0.0**  
_Transforming voice interactions with AI-powered conversations_

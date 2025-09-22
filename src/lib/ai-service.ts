import ZAI from 'z-ai-web-dev-sdk'

export interface AIServiceConfig {
  apiKey?: string
  baseUrl?: string
}

export interface BookingIntent {
  pickupLocation: string
  dropLocation?: string
  vehicleType?: string
  urgency?: 'immediate' | 'scheduled'
  scheduledTime?: string
  specialRequests?: string
}

export interface ParsedBookingRequest {
  intent: 'book_ride' | 'cancel_ride' | 'track_ride' | 'driver_info' | 'price_inquiry' | 'help'
  entities: BookingIntent
  confidence: number
  language: string
}

export class AIService {
  private zai: any
  private isInitialized: boolean = false
  private config: AIServiceConfig

  constructor(config: AIServiceConfig = {}) {
    this.config = config
  }

  private async ensureInitialized() {
    if (this.isInitialized) return

    try {
      this.zai = await ZAI.create()
      if (this.config.apiKey) {
        this.zai.setApiKey(this.config.apiKey)
      }
      if (this.config.baseUrl) {
        this.zai.setBaseUrl(this.config.baseUrl)
      }
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize AI service:', error)
      throw new Error('AI service initialization failed')
    }
  }

  async processVoiceRequest(audioData: Blob, language: string = 'en'): Promise<ParsedBookingRequest> {
    await this.ensureInitialized()

    try {
      // Convert audio to text (in a real implementation, you'd use a speech-to-text service)
      const transcript = await this.speechToText(audioData, language)

      // Process the transcript with AI
      const response = await this.processTextRequest(transcript, language)

      return response
    } catch (error) {
      console.error('Voice request processing failed:', error)
      throw new Error('Failed to process voice request')
    }
  }

  async processTextRequest(text: string, language: string = 'en'): Promise<ParsedBookingRequest> {
    await this.ensureInitialized()

    try {
      // Get system prompt based on language
      const systemPrompt = this.getSystemPrompt(language)

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })

      const responseText = completion.choices[0]?.message?.content || ''

      // Parse the AI response to extract structured data
      return this.parseAIResponse(responseText, text, language)
    } catch (error) {
      console.error('Text request processing failed:', error)
      throw new Error('Failed to process text request')
    }
  }

  private async speechToText(audioData: Blob, language: string): Promise<string> {
    // In a real implementation, you would use a speech-to-text service
    // For demo purposes, we'll return a mock transcript
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock transcript based on language
        const mockTranscripts = {
          en: "I need a ride from MG Road to Koramangala",
          hi: "मुझे एमजी रोड से कोरमंगला जाने के लिए टैक्सी चाहिए",
          ta: "எனக்கு எம்ஜி ரோடு முதல் கோரமங்கலா வரை டாக்ஸி வேண்டும்",
          te: "నాకు ఎంజీ రోడ్ నుండి కోరమంగళ వరకు ট్యాక్సీ కావాలి",
          ml: "എനിക്ക് എം.ജി. റോഡിൽ നിന്ന് കൊരമംഗലയിലേക്ക് ഒരു ടാക്സി വേണം",
          'ml-en': "MG Road il ninnu Koramangala-lekku oru cab venam"
        }

        resolve(mockTranscripts[language as keyof typeof mockTranscripts] || mockTranscripts.en)
      }, 1000)
    })
  }

  private getSystemPrompt(language: string): string {
    const prompts = {
      en: `You are an AI assistant for FairGo, a taxi booking platform in India. 
      Analyze the user's request and extract booking information. 
      Respond with a JSON object containing:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "en"
      }
      
      Common locations in Bangalore: MG Road, Koramangala, Indiranagar, Airport, Railway Station, Electronic City, Whitefield, Jayanagar.
      If location is unclear, ask for clarification.
      If vehicle type is not specified, default to CAR_ECONOMY.`,

      hi: `आप फेयरगो के लिए एक एआई सहायक हैं, जो भारत में एक टैक्सी बुकिंग प्लेटफॉर्म है।
      उपयोगकर्ता के अनुरोध का विश्लेषण करें और बुकिंग जानकारी निकालें।
      JSON ऑब्जेक्ट के साथ प्रतिक्रिया करें जिसमें शामिल है:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "hi"
      }
      
      बैंगलोर में सामान्य स्थान: एमजी रोड, कोरमंगला, इंदिरानगर, एयरपोर्ट, रेलवे स्टेशन, इलेक्ट्रॉनिक सिटी, व्हाइटफील्ड, जयनगर।
      यदि स्थान अस्पष्ट है, तो स्पष्टीकरण के लिए पूछें।
      यदि वाहन प्रकार निर्दिष्ट नहीं है, तो CAR_ECONOMY डिफ़ॉल्ट होगा।`,

      ta: `நீங்கள் பெயர்கோவிற்கான AI உதவியாளர், இந்தியாவில் ஒரு டாக்ஸி முன்பதிவு தளம்.
      பயனரின் கோரிக்கையை பகுப்பாய்ந்து முன்பதிவு தகவலை பிரித்தெடுக்கவும்.
      JSON பொருளுடன் பதிலளிக்கவும்:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "ta"
      }
      
      பெங்களூரில் பொதுவான இடங்கள்: எம்ஜி ரோடு, கோரமங்கலா, இந்திராநகர், விமான நிலையம், ரயில் நிலையம், எலக்ட்ரானிக் சிட்டி, வைட்ஃபீல்டு, ஜெயநகர்.
      இடம் தெளிவாக இல்லையென்றால், தெளிவுபடுத்த கேளுங்கள்.
      வாகன வகை குறிப்பிடப்படவில்லை என்றால், CAR_ECONOMY இயல்புநிலை.`,

      te: `మీరు ఫేర్‌గో కోసం AI అసిస్టెంట్, భారతదేశంలో టాక్సీ బుకింగ్ ప్లాట్‌ఫారమ్.
      వినియోగదారుని అభ్యర్థనను విశ্లేషించి బుకింగ్ సమాచారాన్ని సేకరించండి.
      JSON ఆబ్జెక్ట్‌తో ప్రతిస్పందించండి:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "te"
      }
      
      బెంగళూరులో సాధారణ ప్రాంతాలు: ఎంజీ రోడ్, కోరమంగళ, ఇందిరానగర్, ఎయిర్‌పోర్ట్, రైల్వే స్టేషన్, ఎలక్ట్రానిక్ సిటీ, వైట్‌ఫీల్డ్, జయనగర్.
      స్థానం స్పష్టంగా లేకపోతే, స్పష్టత కోసం అడగండి.
      వాహనం రకం పేర్కొనబడలేదు అయితే, CAR_ECONOMY డిఫాల్ట్‌గా ఉంటుంది.`,

      ml: `നിങ്ങൾ ഫെയർഗോയ്‌ക്കുള്ള AI സഹായിയാണ്, ഇന്ത്യയിലെ ഒരു ടാക്സി ബുക്കിംഗ് പ്ലാറ്റ്‌ഫോമാണ്.
      ഉപയോക്താവിന്റെ അഭ്യർത്ഥന വിശകലനം ചെയ്ത് ബുക്കിംഗ് വിവരങ്ങൾ എക്‌സ്ട്രാക്റ്റ് ചെയ്യുക.
      JSON ഒബ്‌ജക്റ്റ് ഉപയോഗിച്ച് പ്രതികരിക്കുക:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "ml"
      }
      
      ബെംഗളൂരിലെ സാധാരണ സ്ഥലങ്ങൾ: എം.ജി. റോഡ്, കൊരമംഗല, ഇന്ദിരാനഗർ, എയർപോർട്ട്, റെയിൽവേ സ്റ്റേഷൻ, ഇലക്‌ട്രോണിക് സിറ്റി, വൈറ്റ്‌ഫീൽഡ്, ജയനഗർ.
      സ്ഥലം വ്യക്തമല്ലെങ്കിൽ, വ്യക്തതയ്ക്ക് ചോദിക്കുക.
      വാഹന തരം വ്യക്തമാക്കിയില്ലെങ്കിൽ, CAR_ECONOMY ഡിഫോൾട്ടാണ്.`,

      'ml-en': `You are an AI assistant for FairGo, a taxi booking platform in India. 
      You understand Malayalam-English mixed speech (Manglish). 
      Analyze the user's request and extract booking information.
      Respond with a JSON object containing:
      {
        "intent": "book_ride|cancel_ride|track_ride|driver_info|price_inquiry|help",
        "entities": {
          "pickupLocation": "string",
          "dropLocation": "string (optional)",
          "vehicleType": "AUTO_RICKSHAW|CAR_ECONOMY|CAR_PREMIUM|CAR_LUXURY|SUV|BIKE (optional)",
          "urgency": "immediate|scheduled (optional)",
          "scheduledTime": "string (optional)",
          "specialRequests": "string (optional)"
        },
        "confidence": 0.0-1.0,
        "language": "ml-en"
      }
      
      Common locations in Bangalore: MG Road, Koramangala, Indiranagar, Airport, Railway Station, Electronic City, Whitefield, Jayanagar.
      Understand mixed Malayalam-English phrases like: "MG Road il ninnu", "auto venam", "cab book cheyyanam", "ividunnu avide pokkanam".
      If location is unclear, ask for clarification in simple Malayalam-English.
      If vehicle type not specified, default to CAR_ECONOMY.`
    }

    return prompts[language as keyof typeof prompts] || prompts.en
  }

  private parseAIResponse(responseText: string, originalText: string, language: string): ParsedBookingRequest {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(responseText)

      return {
        intent: parsed.intent || 'book_ride',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.8,
        language: parsed.language || language
      }
    } catch (error) {
      // If JSON parsing fails, create a basic response
      return {
        intent: 'book_ride',
        entities: {
          pickupLocation: this.extractLocation(originalText),
          dropLocation: this.extractDestination(originalText)
        },
        confidence: 0.6,
        language
      }
    }
  }

  private extractLocation(text: string): string {
    // Simple location extraction for demo
    const locations = ['MG Road', 'Koramangala', 'Indiranagar', 'Airport', 'Railway Station', 'Electronic City', 'Whitefield', 'Jayanagar']

    for (const location of locations) {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        return location
      }
    }

    return 'Current Location'
  }

  private extractDestination(text: string): string | undefined {
    // Simple destination extraction for demo
    const locations = ['MG Road', 'Koramangala', 'Indiranagar', 'Airport', 'Railway Station', 'Electronic City', 'Whitefield', 'Jayanagar']

    for (const location of locations) {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        return location
      }
    }

    return undefined
  }

  async generateResponse(request: ParsedBookingRequest): Promise<string> {
    await this.ensureInitialized()

    try {
      const responsePrompt = this.generateResponsePrompt(request)

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for FairGo taxi booking. Provide friendly, concise responses.'
          },
          {
            role: 'user',
            content: responsePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      return completion.choices[0]?.message?.content || 'I understand your request. Let me help you with that.'
    } catch (error) {
      console.error('Response generation failed:', error)
      return 'I apologize, but I encountered an error processing your request. Please try again.'
    }
  }

  private generateResponsePrompt(request: ParsedBookingRequest): string {
    const { intent, entities } = request

    switch (intent) {
      case 'book_ride':
        return `Generate a friendly response for booking a ride from ${entities.pickupLocation} to ${entities.dropLocation || 'your destination'}. ${entities.vehicleType ? `Vehicle type: ${entities.vehicleType}.` : ''}`

      case 'cancel_ride':
        return 'Generate a response for canceling a ride. Ask for booking ID if not provided.'

      case 'track_ride':
        return 'Generate a response for tracking a ride. Ask for booking ID if not provided.'

      case 'driver_info':
        return 'Generate a response providing driver information. Ask for booking ID if not provided.'

      case 'price_inquiry':
        return `Generate a response for price inquiry from ${entities.pickupLocation} to ${entities.dropLocation || 'destination'}.`

      case 'help':
        return 'Generate a helpful response explaining how to use FairGo services.'

      default:
        return 'Generate a general helpful response for FairGo taxi booking.'
    }
  }
}

// Singleton instance
export const aiService = new AIService()
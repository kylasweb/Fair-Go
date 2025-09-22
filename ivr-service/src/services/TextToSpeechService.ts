import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import winston from 'winston';

interface TTSConfig {
    languageCode: string;
    voiceName?: string;
    gender?: 'NEUTRAL' | 'FEMALE' | 'MALE';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
}

interface TTSResult {
    audioContent: Buffer;
    duration?: number;
    format: 'MP3' | 'WAV' | 'MULAW';
}

export class TextToSpeechService {
    private client: TextToSpeechClient;
    private logger: winston.Logger;
    private voiceConfigs: Map<string, TTSConfig>;

    constructor() {
        this.client = new TextToSpeechClient({
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'text-to-speech' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/tts.log' })
            ],
        });

        // Initialize voice configurations for different languages
        this.voiceConfigs = new Map([
            ['en', {
                languageCode: 'en-IN',
                voiceName: 'en-IN-Wavenet-A', // Female Indian English voice
                gender: 'FEMALE',
                speakingRate: 0.9, // Slightly slower for clarity
                pitch: 0,
                volumeGainDb: 0
            }],
            ['ml', {
                languageCode: 'ml-IN',
                voiceName: 'ml-IN-Standard-A',
                gender: 'FEMALE',
                speakingRate: 0.9,
                pitch: 0,
                volumeGainDb: 0
            }],
            ['hi', {
                languageCode: 'hi-IN',
                voiceName: 'hi-IN-Wavenet-A',
                gender: 'FEMALE',
                speakingRate: 0.9,
                pitch: 0,
                volumeGainDb: 0
            }]
        ]);
    }

    /**
     * Convert text to speech audio suitable for telephony
     */
    async synthesizeSpeech(
        text: string,
        language: 'en' | 'ml' | 'hi' = 'en',
        customConfig?: Partial<TTSConfig>
    ): Promise<TTSResult> {
        try {
            const baseConfig = this.voiceConfigs.get(language) || this.voiceConfigs.get('en')!;
            const config = { ...baseConfig, ...customConfig };

            const request = {
                input: { text },
                voice: {
                    languageCode: config.languageCode,
                    name: config.voiceName,
                    ssmlGender: config.gender,
                },
                audioConfig: {
                    audioEncoding: 'MULAW' as const, // Optimized for telephony
                    speakingRate: config.speakingRate,
                    pitch: config.pitch,
                    volumeGainDb: config.volumeGainDb,
                    // Optimize for phone calls
                    effectsProfileId: ['telephony-class-application'],
                    sampleRateHertz: 8000, // Standard telephony sample rate
                },
            };

            this.logger.info('Synthesizing speech', {
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                language,
                voice: config.voiceName
            });

            const [response] = await this.client.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content received from TTS service');
            }

            const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

            this.logger.info('Speech synthesis completed', {
                audioSize: audioBuffer.length,
                language
            });

            return {
                audioContent: audioBuffer,
                format: 'MULAW'
            };

        } catch (error) {
            this.logger.error('Speech synthesis failed:', error);
            throw error;
        }
    }

    /**
     * Convert text to speech with SSML markup for better control
     */
    async synthesizeWithSSML(
        ssml: string,
        language: 'en' | 'ml' | 'hi' = 'en',
        customConfig?: Partial<TTSConfig>
    ): Promise<TTSResult> {
        try {
            const baseConfig = this.voiceConfigs.get(language) || this.voiceConfigs.get('en')!;
            const config = { ...baseConfig, ...customConfig };

            const request = {
                input: { ssml },
                voice: {
                    languageCode: config.languageCode,
                    name: config.voiceName,
                    ssmlGender: config.gender,
                },
                audioConfig: {
                    audioEncoding: 'MULAW' as const,
                    speakingRate: config.speakingRate,
                    pitch: config.pitch,
                    volumeGainDb: config.volumeGainDb,
                    effectsProfileId: ['telephony-class-application'],
                    sampleRateHertz: 8000,
                },
            };

            this.logger.info('Synthesizing SSML speech', {
                ssml: ssml.substring(0, 100) + (ssml.length > 100 ? '...' : ''),
                language
            });

            const [response] = await this.client.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content received from TTS service');
            }

            const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

            return {
                audioContent: audioBuffer,
                format: 'MULAW'
            };

        } catch (error) {
            this.logger.error('SSML speech synthesis failed:', error);
            throw error;
        }
    }

    /**
     * Create enhanced speech with emotional context and emphasis
     */
    async synthesizeConversationalSpeech(
        text: string,
        context: {
            emotion?: 'neutral' | 'friendly' | 'apologetic' | 'excited' | 'concerned';
            emphasis?: string[]; // Words to emphasize
            pauseAfter?: string[]; // Words to pause after
        },
        language: 'en' | 'ml' | 'hi' = 'en'
    ): Promise<TTSResult> {
        // Convert to SSML for better expressiveness
        let ssml = `<speak>`;

        // Apply emotional prosody
        switch (context.emotion) {
            case 'friendly':
                ssml += `<prosody rate="medium" pitch="+2st" volume="medium">`;
                break;
            case 'apologetic':
                ssml += `<prosody rate="slow" pitch="-1st" volume="soft">`;
                break;
            case 'excited':
                ssml += `<prosody rate="fast" pitch="+3st" volume="loud">`;
                break;
            case 'concerned':
                ssml += `<prosody rate="slow" pitch="-2st" volume="medium">`;
                break;
            default:
                ssml += `<prosody rate="medium" pitch="0st" volume="medium">`;
        }

        let processedText = text;

        // Add emphasis
        if (context.emphasis) {
            context.emphasis.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                processedText = processedText.replace(regex, `<emphasis level="strong">${word}</emphasis>`);
            });
        }

        // Add pauses
        if (context.pauseAfter) {
            context.pauseAfter.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                processedText = processedText.replace(regex, `${word}<break time="500ms"/>`);
            });
        }

        ssml += processedText;
        ssml += `</prosody></speak>`;

        return this.synthesizeWithSSML(ssml, language);
    }

    /**
     * Generate audio for common IVR phrases to cache and reuse
     */
    async generateCommonPhrases(language: 'en' | 'ml' | 'hi' = 'en'): Promise<Map<string, Buffer>> {
        const phrases = new Map([
            ['greeting', 'Hello! Welcome to FairGo. I\'m Priya, your booking assistant. How can I help you today?'],
            ['pickup_prompt', 'Where would you like to be picked up from?'],
            ['dropoff_prompt', 'Where are you heading to?'],
            ['vehicle_prompt', 'Would you prefer an auto rickshaw or a car?'],
            ['confirmation', 'Let me confirm your booking details.'],
            ['booking_success', 'Great! Your ride has been booked successfully. Your driver will arrive shortly.'],
            ['booking_error', 'I\'m sorry, there was an issue booking your ride. Please try again.'],
            ['clarification', 'I didn\'t catch that clearly. Could you please repeat?'],
            ['goodbye', 'Thank you for using FairGo! Have a safe journey.'],
            ['hold_please', 'Please hold while I process your request.']
        ]);

        const audioCache = new Map<string, Buffer>();

        for (const [key, text] of phrases) {
            try {
                const result = await this.synthesizeSpeech(text, language);
                audioCache.set(key, result.audioContent);
                this.logger.info(`Cached audio for phrase: ${key}`);
            } catch (error) {
                this.logger.error(`Failed to cache audio for phrase ${key}:`, error);
            }
        }

        return audioCache;
    }

    /**
     * Test the TTS service connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.synthesizeSpeech('Test', 'en');
            return true;
        } catch (error) {
            this.logger.error('TTS service test failed:', error);
            return false;
        }
    }

    /**
     * Get available voices for a language
     */
    async getAvailableVoices(languageCode: string): Promise<any[]> {
        try {
            const [response] = await this.client.listVoices({
                languageCode
            });

            return response.voices || [];
        } catch (error) {
            this.logger.error('Failed to get available voices:', error);
            return [];
        }
    }
}
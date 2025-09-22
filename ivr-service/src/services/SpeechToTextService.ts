import { SpeechClient } from '@google-cloud/speech';
import { Readable } from 'stream';
import winston from 'winston';

interface STTConfig {
    sampleRateHertz: number;
    languageCode: string;
    enableAutomaticPunctuation: boolean;
    enableWordTimeOffsets: boolean;
    model: string;
}

interface STTResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
    alternatives?: Array<{
        transcript: string;
        confidence: number;
    }>;
}

export class SpeechToTextService {
    private client: SpeechClient;
    private logger: winston.Logger;
    private defaultConfig: STTConfig;

    constructor() {
        // Initialize Google Cloud Speech client
        this.client = new SpeechClient({
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'speech-to-text' },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/stt.log' })
            ],
        });

        this.defaultConfig = {
            sampleRateHertz: 8000, // Standard for telephony
            languageCode: 'en-IN', // English (India) for better Kerala accent recognition
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true,
            model: 'phone_call', // Optimized for phone call audio
        };
    }

    /**
     * Start streaming speech recognition
     */
    createStreamingRecognition(config?: Partial<STTConfig>): {
        stream: Readable;
        startRecognition: () => Promise<void>;
        stopRecognition: () => void;
    } {
        const finalConfig = { ...this.defaultConfig, ...config };

        const recognitionConfig = {
            encoding: 'MULAW' as const,
            sampleRateHertz: finalConfig.sampleRateHertz,
            languageCode: finalConfig.languageCode,
            enableAutomaticPunctuation: finalConfig.enableAutomaticPunctuation,
            enableWordTimeOffsets: finalConfig.enableWordTimeOffsets,
            model: finalConfig.model,
            // Add alternative language codes for better recognition
            alternativeLanguageCodes: ['ml-IN', 'hi-IN'], // Malayalam and Hindi
        };

        const streamingConfig = {
            config: recognitionConfig,
            interimResults: true,
            enableVoiceActivityDetection: true,
            voiceActivityTimeout: {
                speechStartTimeout: { seconds: 2 },
                speechEndTimeout: { seconds: 2 },
            },
        };

        let recognizeStream: any = null;
        const audioStream = new Readable({
            read() { } // No-op, we'll push data manually
        });

        const startRecognition = async (): Promise<void> => {
            try {
                recognizeStream = this.client
                    .streamingRecognize(streamingConfig)
                    .on('error', (error: Error) => {
                        this.logger.error('STT streaming error:', error);
                        audioStream.emit('error', error);
                    })
                    .on('data', (data: any) => {
                        if (data.results[0] && data.results[0].alternatives[0]) {
                            const result: STTResult = {
                                transcript: data.results[0].alternatives[0].transcript,
                                confidence: data.results[0].alternatives[0].confidence || 0,
                                isFinal: data.results[0].isFinal,
                                alternatives: data.results[0].alternatives.slice(1),
                            };

                            audioStream.emit('transcript', result);

                            if (result.isFinal) {
                                this.logger.info('Final transcript:', result.transcript);
                            }
                        }
                    });

                // Pipe audio data to Google Speech API
                audioStream.on('data', (chunk: Buffer) => {
                    if (recognizeStream && !recognizeStream.destroyed) {
                        recognizeStream.write(chunk);
                    }
                });

                this.logger.info('Speech recognition stream started');
            } catch (error) {
                this.logger.error('Failed to start speech recognition:', error);
                throw error;
            }
        };

        const stopRecognition = (): void => {
            if (recognizeStream && !recognizeStream.destroyed) {
                recognizeStream.end();
                this.logger.info('Speech recognition stream stopped');
            }
        };

        return {
            stream: audioStream,
            startRecognition,
            stopRecognition,
        };
    }

    /**
     * Convert single audio buffer to text (for non-streaming use)
     */
    async recognizeAudio(audioBuffer: Buffer, config?: Partial<STTConfig>): Promise<STTResult[]> {
        const finalConfig = { ...this.defaultConfig, ...config };

        const audio = {
            content: audioBuffer.toString('base64'),
        };

        const recognitionConfig = {
            encoding: 'MULAW' as const,
            sampleRateHertz: finalConfig.sampleRateHertz,
            languageCode: finalConfig.languageCode,
            enableAutomaticPunctuation: finalConfig.enableAutomaticPunctuation,
            alternativeLanguageCodes: ['ml-IN', 'hi-IN'],
        };

        try {
            const [response] = await this.client.recognize({
                audio,
                config: recognitionConfig,
            });

            const results: STTResult[] = [];

            if (response.results) {
                for (const result of response.results) {
                    if (result.alternatives && result.alternatives[0]) {
                        results.push({
                            transcript: result.alternatives[0].transcript || '',
                            confidence: result.alternatives[0].confidence || 0,
                            isFinal: true,
                            alternatives: result.alternatives.slice(1).map(alt => ({
                                transcript: alt.transcript || '',
                                confidence: alt.confidence || 0,
                            })),
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            this.logger.error('Speech recognition failed:', error);
            throw error;
        }
    }

    /**
     * Check if the service is properly configured
     */
    async testConnection(): Promise<boolean> {
        try {
            // Test with a small dummy request
            const testAudio = Buffer.alloc(1024); // Small silent audio buffer
            await this.recognizeAudio(testAudio);
            return true;
        } catch (error) {
            this.logger.error('STT service test failed:', error);
            return false;
        }
    }
}

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { DatabaseService } from '../lib/supabase';

interface SmartVoiceInputProps {
    onTranscript: (text: string) => void;
}

export const SmartVoiceInput: React.FC<SmartVoiceInputProps> = ({ onTranscript }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Audio Visualization State
    const [audioLevel, setAudioLevel] = useState(0);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';

            recognition.onstart = () => {
                setIsRecording(true);
                setTranscript('');
            };

            recognition.onresult = (event: any) => {
                let finalTrans = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTrans += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTrans) {
                    setTranscript(prev => prev + finalTrans);
                }

                // Simular níveis de áudio baseados no comprimento do input (fallback visual)
                setAudioLevel(Math.random() * 0.5 + 0.5);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech error:', event.error);
                if (event.error !== 'no-speech') {
                    stopRecording();
                    toast.error("Erro na captação de áudio.");
                }
            };

            recognition.onend = () => {
                if (isRecording) {
                    // Se parou sozinho mas o state diz que está gravando, tenta reiniciar ou para
                    // stopRecording(); // Descomentar se quiser parar automático no silêncio
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) {
            toast.error("Seu navegador não suporta transcrição de voz.");
            return;
        }
        try {
            recognitionRef.current.start();
            setIsRecording(true);
            toast.info("Ouvindo... Fale agora.");
        } catch (e) {
            console.error(e);
        }
    };

    const stopRecording = async () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsRecording(false);

        // Pequeno delay para garantir que o último bit de áudio foi processado
        if (transcript.trim() || recognitionRef.current) {
            // Usamos um timeout para permitir que o onresult final dispare
            setTimeout(() => processFinalText(), 500);
        }
    };

    const processFinalText = async () => {
        if (!transcript.trim()) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);

        try {
            // IA Refinement removed as requested. Using raw transcript.
            onTranscript(transcript.trim());
            toast.success("Transcrição concluída!");
        } catch (error) {
            console.error("Error processing voice with AI:", error);
            // Fallback para o texto bruto em caso de erro na IA
            onTranscript(transcript.trim());
            toast.error("Erro ao processar com IA. Usando texto bruto.");
        } finally {
            setTranscript(''); // Limpa buffer
            setIsProcessing(false);
        }
    };

    // Toggle Action
    const handleClick = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    return (
        <div className="flex items-center space-x-3 select-none">
            {/* Status Display - Animated */}
            {(isRecording || isProcessing) && (
                <div className={cn(
                    "flex items-center space-x-3 px-4 py-2 rounded-2xl animate-in slide-in-from-right-4 duration-300 border backdrop-blur-md",
                    isRecording ? "bg-red-500/10 border-red-500/20" : "bg-sky-500/10 border-sky-500/20"
                )}>
                    {isRecording ? (
                        <>
                            <div className="flex items-center space-x-1 h-4">
                                {/* Voice Waveform Animation - Simulates reacting to audio */}
                                {[1, 2, 3, 2, 4, 2, 1].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-red-500/80 rounded-full animate-pulse"
                                        style={{
                                            height: `${Math.max(4, Math.random() * 16)}px`, // Random height simulation
                                            animationDuration: '0.4s',
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    ></div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Gravando</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} className="text-sky-400 animate-spin" />
                        </>
                    )}
                </div>
            )}

            {/* Main Activation Button */}
            <button
                onClick={handleClick}
                disabled={isProcessing}
                className={cn(
                    "relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
                    isRecording
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30 scale-110"
                        : isProcessing
                            ? "bg-neutral-800 text-neutral-600 border border-white/5 cursor-wait"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20 border border-white/10"
                )}
            >
                {isRecording ? (
                    // Stop Icon (Square)
                    <div className="w-4 h-4 bg-white rounded-sm shadow-sm"></div>
                ) : isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    // Voice Bars Icon (ChatGPT Style)
                    <div className="flex items-center space-x-[2px]">
                        <div className="w-[3px] h-3 bg-white/90 rounded-full group-hover:h-5 transition-all duration-300 delay-75"></div>
                        <div className="w-[3px] h-5 bg-white/90 rounded-full group-hover:h-3 transition-all duration-300 delay-0"></div>
                        <div className="w-[3px] h-3 bg-white/90 rounded-full group-hover:h-6 transition-all duration-300 delay-150"></div>
                        <div className="w-[3px] h-4 bg-white/90 rounded-full group-hover:h-3 transition-all duration-300 delay-100"></div>
                    </div>
                )}

                {/* Ring Glow Effect */}
                {!isRecording && !isProcessing && (
                    <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
            </button>
        </div>
    );
};

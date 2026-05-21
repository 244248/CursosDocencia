import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import './styles/VoiceAgent.css';

function limpiarParaVoz(texto) {
  return texto
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*•]\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&/g, ' y ')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VOICE_NAME = 'es-MX-DaliaNeural';

const VoiceAgent = ({ sidebarMode = false }) => {
  const [status, setStatus] = useState('idle');
  const [conversation, setConversation] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const synthesizerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const orbRef = useRef(null);

  const SPEECH_KEY = process.env.REACT_APP_AZURE_SPEECH_KEY || '';
  const SPEECH_REGION = process.env.REACT_APP_AZURE_SPEECH_REGION || 'eastus';
  const FUNCTION_URL = process.env.REACT_APP_JARVIS_FUNCTION_URL || 'https://misty-unit-d4f8.andrehm143.workers.dev/api/jarvis-query';

  const stopSpeaking = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (synthesizerRef.current) {
      try {
        synthesizerRef.current.stopSpeakingAsync();
        synthesizerRef.current.close();
      } catch (e) {}
      synthesizerRef.current = null;
    }
    setStatus('idle');
    setStreamingText('');
  }, []);

  const speakText = useCallback((text) => {
    stopSpeaking();
    const limpio = limpiarParaVoz(text);
    if (!limpio) return;
    setStatus('speaking');
    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
      speechConfig.speechSynthesisVoiceName = VOICE_NAME;
      speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
      synthesizerRef.current = synthesizer;
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">
          <voice name="${VOICE_NAME}">
            <prosody rate="1.08">
              ${limpio}
            </prosody>
          </voice>
        </speak>
      `;
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (synthesizerRef.current === synthesizer) {
            synthesizer.close();
            synthesizerRef.current = null;
          }
          setStatus('idle');
        },
        (error) => {
          console.error('[TTS] Error:', error);
          if (synthesizerRef.current === synthesizer) {
            synthesizer.close();
            synthesizerRef.current = null;
          }
          setStatus('idle');
        }
      );
    } catch (err) {
      console.error('[TTS] Exception:', err);
      setStatus('idle');
    }
  }, [SPEECH_KEY, SPEECH_REGION, stopSpeaking]);

  const handleStreamResponse = useCallback(async (userText) => {
    stopSpeaking();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus('thinking');
    setStreamingText('');
    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText }),
        signal: controller.signal
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const limpio = limpiarParaVoz(fullText);
              setConversation(prev => [...prev, { role: 'bot', text: limpio }]);
              setStreamingText('');
              setStatus('idle');
              speakText(limpio);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setStreamingText(fullText);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Error en stream:', error);
      setStatus('idle');
      setStreamingText('');
    }
  }, [FUNCTION_URL, speakText, stopSpeaking]);

  const unlockAudio = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      setTimeout(() => source.disconnect(), 100);
    }
  }, []);

  const handleVoice = useCallback(async () => {
    if (status === 'listening' || status === 'thinking') return;
    
    // Desbloquear audio en CADA toque para iOS
    unlockAudio();
    
    stopSpeaking();
    setStatus('listening');
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = 'es-MX';
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognizeOnceAsync(async (result) => {
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const text = result.text;
        if (/para|silencio|callate|basta/i.test(text)) {
          stopSpeaking();
          setStatus('idle');
          recognizer.close();
          return;
        }
        setConversation(prev => [...prev, { role: 'user', text }]);
        setStatus('thinking');
        await handleStreamResponse(text);
      } else {
        setStatus('idle');
      }
      recognizer.close();
    });
  }, [status, SPEECH_KEY, SPEECH_REGION, handleStreamResponse, stopSpeaking, unlockAudio]);

  const clearChat = useCallback(() => {
    setConversation([]);
    setStreamingText('');
    setStatus('idle');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingText]);

  const statusLabels = {
    idle: 'Toca para hablar',
    listening: 'Escuchando...',
    thinking: 'Pensando...',
    speaking: 'Hablando...'
  };

  return (
    <div className={`voice-agent ${sidebarMode ? 'sidebar-mode' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="va-orb-container" onClick={() => { if (!sidebarMode) setIsExpanded(!isExpanded); }}>
        <div className={`va-orb ${status}`}>
          <div className="va-orb-ring ring-1"></div>
          <div className="va-orb-ring ring-2"></div>
          <div className="va-orb-ring ring-3"></div>
          <div className="va-orb-core">
            {status === 'listening' && <i className="fas fa-microphone"></i>}
            {status === 'thinking' && <i className="fas fa-brain"></i>}
            {status === 'speaking' && <i className="fas fa-volume-up"></i>}
          </div>
        </div>
        <p className="va-status-label">{statusLabels[status]}</p>
      </div>

      {(isExpanded || sidebarMode) && (
        <div className="va-conversation">
          {conversation.length === 0 && !streamingText && (
            <div className="va-empty">
              <i className="fas fa-comment-dots"></i>
              <p>Toca el orbe y habla con el agente IA</p>
            </div>
          )}
          {conversation.map((msg, i) => (
            <div key={i} className={`va-msg ${msg.role}`}>
              <div className="va-msg-icon">
                {msg.role === 'user' ? <i className="fas fa-user"></i> : <i className="fas fa-robot"></i>}
              </div>
              <div className="va-msg-bubble">{msg.text}</div>
            </div>
          ))}
          {streamingText && (
            <div className="va-msg bot streaming">
              <div className="va-msg-icon"><i className="fas fa-robot"></i></div>
              <div className="va-msg-bubble">
                {streamingText}
                <span className="va-cursor">|</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="va-controls">
        <button
          className={`va-mic-btn ${status === 'listening' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleVoice(); }}
          disabled={status === 'listening' || status === 'thinking'}
        >
          <i className={`fas ${status === 'listening' ? 'fa-circle' : 'fa-microphone'}`}></i>
        </button>
        {status === 'speaking' && (
          <button className="va-stop-btn" onClick={(e) => { e.stopPropagation(); stopSpeaking(); }}>
            <i className="fas fa-stop"></i>
          </button>
        )}
        {conversation.length > 0 && (
          <button className="va-clear-btn" onClick={(e) => { e.stopPropagation(); clearChat(); }}>
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;

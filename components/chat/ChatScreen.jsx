import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Lock, ArrowRight } from 'lucide-react';
import { parseAIResponse } from '../../lib/parsers';
import { buildSystemPrompt, callAPI } from '../../lib/prompts';

// ═══════════════════════════════════════════════
// CHAT SCREEN — Pure text conversation
// No interaction widgets for launch
// ═══════════════════════════════════════════════

export default function ChatScreen({
  messages,
  setMessages,
  parsedMessages,
  setParsedMessages,
  chatComplete,
  setChatComplete,
  onGenerateReport,
  resetProgress,
}) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Derived
  const userMsgCount = messages.filter((m) => m.role === 'user').length;
  const totalSegments = 15;
  const filledSegments = Math.min(userMsgCount, totalSegments);

  // Auto-scroll + focus
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsedMessages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // ─── START CHAT ───
  const startChat = useCallback(async () => {
    setIsLoading(true);

    try {
      const text = await callAPI(
        [{ role: 'user', content: '[Begin]' }],
        buildSystemPrompt(0),
        150
      );
      const parsed = parseAIResponse(text);

      setMessages([{ role: 'assistant', content: text }]);
      setParsedMessages([
        { role: 'assistant', text: parsed.conversationText },
      ]);
    } catch (e) {
      console.error('Start error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [setMessages, setParsedMessages]);

  // Auto-start if no messages
  useEffect(() => {
    if (messages.length === 0) {
      startChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── SEND MESSAGE ───
  const sendMessage = async (content) => {
    if (!content?.trim() || isLoading || chatComplete) return;

    const userMsg = content.trim();
    const newMsgs = [...messages, { role: 'user', content: userMsg }];

    setMessages(newMsgs);
    setParsedMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setIsLoading(true);

    const currentUserCount = newMsgs.filter((m) => m.role === 'user').length;

    try {
      let text = await callAPI(
        newMsgs,
        buildSystemPrompt(currentUserCount),
        600
      );

      // Hard cap at 16 user messages
      if (currentUserCount >= 16 && !text.includes('[CONVERSATION_COMPLETE]')) {
        text += '\n\n[CONVERSATION_COMPLETE]';
      }

      const complete = text.includes('[CONVERSATION_COMPLETE]');
      const cleanedText = text.replace('[CONVERSATION_COMPLETE]', '').trim();
      const parsed = parseAIResponse(cleanedText);

      setMessages([...newMsgs, { role: 'assistant', content: cleanedText }]);
      setParsedMessages((prev) => [
        ...prev,
        { role: 'assistant', text: parsed.conversationText },
      ]);

      if (complete) setChatComplete(true);
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = () => {
    if (userInput.trim()) sendMessage(userInput);
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F5F3',
        display: 'flex',
        flexDirection: 'column',
        color: '#111113',
        position: 'relative',
      }}
    >
      {/* Fixed grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.25,
          backgroundImage:
            'linear-gradient(#BFBDB8 1px, transparent 1px), linear-gradient(90deg, #BFBDB8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(245, 245, 243, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#111113',
          }}
        >
          Pathlight
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#555250',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Lock size={12} /> private
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          display: 'flex',
          gap: 3,
          padding: '0 24px 12px',
          background: 'rgba(245, 245, 243, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'relative',
          zIndex: 9,
        }}
      >
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 2,
              flex: 1,
              borderRadius: 9999,
              background:
                i < filledSegments
                  ? '#7B6FBF'
                  : i === filledSegments
                  ? '#111113'
                  : '#E5E3DF',
              transition: 'background 350ms',
            }}
          />
        ))}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {parsedMessages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius: 8,
                background:
                  msg.role === 'user'
                    ? '#111113'
                    : 'rgba(255, 255, 255, 0.75)',
                backdropFilter:
                  msg.role === 'user' ? 'none' : 'blur(12px)',
                WebkitBackdropFilter:
                  msg.role === 'user' ? 'none' : 'blur(12px)',
                color: msg.role === 'user' ? '#F5F5F3' : '#111113',
                border:
                  msg.role === 'user'
                    ? 'none'
                    : '1px solid rgba(229, 227, 223, 0.6)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem',
                fontWeight: 400,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(229, 227, 223, 0.6)',
                borderRadius: 8,
                display: 'flex',
                gap: 4,
              }}
            >
              <span className="pl-dot" />
              <span className="pl-dot" style={{ animationDelay: '0.2s' }} />
              <span className="pl-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: 16,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {chatComplete ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <button
                onClick={onGenerateReport}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  background: '#111113',
                  color: '#F5F5F3',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Generate My Report <ArrowRight size={16} />
              </button>
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  color: '#555250',
                  marginTop: 8,
                }}
              >
                takes about 45 seconds
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
                placeholder="Type your response..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#F5F5F3',
                  border: '1px solid #E5E3DF',
                  borderRadius: 4,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: '#111113',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleTextSubmit}
                disabled={isLoading || !userInput.trim()}
                style={{
                  padding: '12px 16px',
                  background: '#111113',
                  color: '#F5F5F3',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: !userInput.trim() || isLoading ? 0.2 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          background: 'rgba(245, 245, 243, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6875rem',
          color: '#555250',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/privacy" style={{ color: '#555250' }}>
            privacy
          </a>
          <a href="/terms" style={{ color: '#555250' }}>
            terms
          </a>
        </div>
        <button
          onClick={resetProgress}
          style={{
            background: 'none',
            border: 'none',
            color: '#555250',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            cursor: 'pointer',
          }}
        >
          clear data
        </button>
      </div>
    </div>
  );
}

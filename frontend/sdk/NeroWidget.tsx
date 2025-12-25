// frontend/sdk/NeroWidget.tsx
// React SDK for Nero Protocol - Easy dApp Integration

import React, { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import './NeroWidget.css';

interface NeroWidgetProps {
  platformId: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  apiEndpoint?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface NFTData {
  level: number;
  xp: number;
  maxXP: number;
  platform: string;
}

export const NeroWidget: React.FC<NeroWidgetProps> = ({
  platformId,
  theme = 'light',
  primaryColor = '#6366f1',
  position = 'bottom-right',
  apiEndpoint = 'http://localhost:3001/api',
}) => {
  const { user, login, authenticated, getAccessToken } = usePrivy();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nftData, setNFTData] = useState<NFTData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load NFT data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadNFTData();
    }
  }, [authenticated]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadNFTData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${apiEndpoint}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNFTData(data.nft);
      }
    } catch (error) {
      console.error('Failed to load NFT data:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      const response = await fetch(`${apiEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputValue,
          platformId,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update XP if earned
        if (data.xpEarned > 0 && nftData) {
          setNFTData({
            ...nftData,
            xp: nftData.xp + data.xpEarned,
          });
        }
      } else if (response.status === 402) {
        // Payment required
        const data = await response.json();
        alert(`Query limit reached. Cost: ${data.cost} MOVE tokens`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
  };

  if (!authenticated) {
    return (
      <div className={`nero-widget-button ${theme}`} style={{
        ...positionStyles[position],
        '--primary-color': primaryColor,
      } as React.CSSProperties}>
        <button onClick={login} className="nero-login-button">
          🤖 Connect to Nero
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className={`nero-widget-fab ${theme}`}
          style={{
            ...positionStyles[position],
            backgroundColor: primaryColor,
          }}
          onClick={() => setIsOpen(true)}
        >
          🤖
          {nftData && (
            <div className="nero-fab-badge">
              Lvl {nftData.level}
            </div>
          )}
        </button>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <div
          className={`nero-widget-panel ${theme}`}
          style={{
            ...positionStyles[position],
            '--primary-color': primaryColor,
          } as React.CSSProperties}
        >
          {/* Header */}
          <div className="nero-widget-header">
            <div className="nero-header-content">
              <div className="nero-logo">🤖</div>
              <div>
                <div className="nero-title">Nero Sentinel</div>
                <div className="nero-subtitle">AI Guide</div>
              </div>
            </div>
            {nftData && (
              <div className="nero-nft-badge">
                <div className="nero-level">Lvl {nftData.level}</div>
                <div className="nero-xp-bar">
                  <div 
                    className="nero-xp-fill"
                    style={{ width: `${(nftData.xp / nftData.maxXP) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <button
              className="nero-close-button"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="nero-messages">
            {messages.length === 0 && (
              <div className="nero-welcome">
                <div className="nero-welcome-icon">👋</div>
                <h3>Hello! I'm Nero</h3>
                <p>I'm here to help you navigate {platformId}. Ask me anything!</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`nero-message ${msg.role}`}>
                <div className="nero-message-content">
                  {msg.content}
                </div>
                <div className="nero-message-time">
                  {msg.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="nero-message assistant">
                <div className="nero-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="nero-input-area">
            <input
              type="text"
              className="nero-input"
              placeholder="Ask Nero anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="nero-send-button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              style={{ backgroundColor: primaryColor }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NeroWidget;

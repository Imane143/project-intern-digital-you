import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatService } from '../services/chat';
import { authService } from '../services/auth';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &.own-message {
    flex-direction: row-reverse;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 3px;

  .own-message & {
    align-items: flex-end;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7f8c8d;

  .own-message & {
    flex-direction: row-reverse;
  }
`;

const SenderName = styled.span`
  font-weight: 500;
  color: #2c3e50;
`;

const MessageTime = styled.span`
  font-size: 11px;
`;

const MessageBubble = styled.div`
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  color: #2c3e50;
  word-wrap: break-word;

  .own-message & {
    background-color: #3498db;
    color: white;
    border-bottom-left-radius: 18px;
    border-bottom-right-radius: 4px;
  }
`;

const InputContainer = styled.div`
  background: white;
  border-top: 1px solid #ddd;
  padding: 20px;
`;

const InputForm = styled.form`
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 25px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  min-height: 45px;
  max-height: 120px;
  outline: none;

  &:focus {
    border-color: #3498db;
  }

  &::placeholder {
    color: #95a5a6;
  }
`;

const SendButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
`;

const ConnectionStatus = styled.div`
  background-color: ${props => props.connected ? '#27ae60' : '#e74c3c'};
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
`;

function ChatView({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    initializeChat();
    return () => {
      chatService.leaveWorkspace(workspaceId);
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Connect to socket if not already connected
      const token = localStorage.getItem('token');
      if (token) {
        chatService.connect(token);
        
        // Set up event listeners
        chatService.socket.on('connect', () => {
          setConnected(true);
          chatService.joinWorkspace(workspaceId);
        });

        chatService.socket.on('disconnect', () => {
          setConnected(false);
        });

        chatService.onNewMessage(handleNewMessage);
      }

      // Load existing messages
      const data = await chatService.getMessages(workspaceId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;

    chatService.sendMessage(workspaceId, newMessage.trim());
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const shouldStartNewGroup = !currentGroup || 
        currentGroup.userId !== message.user_id ||
        (new Date(message.created_at) - new Date(currentGroup.lastMessageTime)) > 5 * 60 * 1000; // 5 minutes

      if (shouldStartNewGroup) {
        currentGroup = {
          userId: message.user_id,
          userName: message.user_name,
          lastMessageTime: message.created_at,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
        currentGroup.lastMessageTime = message.created_at;
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading chat...</LoadingMessage>
      </Container>
    );
  }

  const messageGroups = groupMessages(messages);

  return (
    <Container>
      <ConnectionStatus connected={connected}>
        {connected ? 'Connected' : 'Disconnected - trying to reconnect...'}
      </ConnectionStatus>

      <MessagesContainer>
        {messageGroups.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <MessageGroup key={groupIndex}>
              {group.messages.map((message, messageIndex) => {
                const isOwnMessage = message.user_id === currentUser?.id;
                const showAvatar = messageIndex === 0;
                const showHeader = messageIndex === 0;

                return (
                  <Message key={message.id} className={isOwnMessage ? 'own-message' : ''}>
                    {showAvatar && !isOwnMessage && (
                      <Avatar>
                        {getInitials(message.user_name)}
                      </Avatar>
                    )}
                    {!showAvatar && !isOwnMessage && <div style={{ width: '40px' }} />}
                    
                    <MessageContent>
                      {showHeader && (
                        <MessageHeader>
                          <SenderName>
                            {isOwnMessage ? 'You' : message.user_name}
                          </SenderName>
                          <MessageTime>
                            {formatTime(message.created_at)}
                          </MessageTime>
                        </MessageHeader>
                      )}
                      <MessageBubble>
                        {message.content}
                      </MessageBubble>
                    </MessageContent>

                    {showAvatar && isOwnMessage && (
                      <Avatar>
                        {getInitials(currentUser?.name)}
                      </Avatar>
                    )}
                    {!showAvatar && isOwnMessage && <div style={{ width: '40px' }} />}
                  </Message>
                );
              })}
            </MessageGroup>
          ))
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <InputForm onSubmit={handleSubmit}>
          <MessageInput
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!connected}
          />
          <SendButton type="submit" disabled={!newMessage.trim() || !connected}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
            </svg>
          </SendButton>
        </InputForm>
      </InputContainer>
    </Container>
  );
}

export default ChatView;
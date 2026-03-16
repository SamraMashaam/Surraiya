import { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageSquareMore, Users } from 'lucide-react';
import { color } from 'framer-motion';


export default function ChatWindow({
  conversation,
  messages,
  loading,
  onSendMessage,
  onTyping,
  typingUsers,
  getConversationName,
  user,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?._id]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping();
  };

  const getMessageTime = (createdAt) => {
    return format(new Date(createdAt), 'h:mm a');
  };

  const getDateDivider = (createdAt) => {
    const date = new Date(createdAt);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const shouldShowDateDivider = (messages, index) => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt);
    const previous = new Date(messages[index - 1].createdAt);
    return current.toDateString() !== previous.toDateString();
  };

  const shouldShowSenderName = (messages, index) => {
    if (!conversation || conversation.type === 'dm') return false;
    if (index === 0) return true;
    return messages[index].sender?._id !== messages[index - 1].sender?._id;
  };

  const isMyMessage = (message) => {
    return message.sender?._id === user?._id ||
           message.sender === user?._id;
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

  const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const typingList = typingUsers[conversation?._id] || [];
  const conversationName = conversation ? getConversationName(conversation) : '';

  // ─── Empty state ──────────────────────────────────────────────────────────────
  if (!conversation) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}><MessageSquareMore size={70} /></div>
        <h3 style={styles.emptyStateTitle}>Select a conversation</h3>
        <p style={styles.emptyStateDesc}>
          Choose a conversation from the left or start a new one
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{
            ...styles.headerAvatar,
            backgroundColor: getAvatarColor(conversationName),
          }}>
            {conversation.type === 'group' ? <Users /> : getInitial(conversationName)}
          </div>
          <div>
            <div style={styles.headerName}>{conversationName}</div>
            <div style={styles.headerSub}>
              {conversation.type === 'group'
                ? `${conversation.participants?.length} members`
                : 'Direct Message'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messageList}>
        {loading && (
          <div style={styles.loadingState}>Loading messages...</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={styles.loadingState}>
            No messages yet — say hello!
          </div>
        )}

        {messages.map((message, index) => {
          const mine = isMyMessage(message);
          const senderName = message.sender?.userName || 'Unknown';
          const showDivider = shouldShowDateDivider(messages, index);
          const showName = shouldShowSenderName(messages, index);

          return (
            <div key={message._id}>

              {/* Date divider */}
              {showDivider && (
                <div style={styles.dateDivider}>
                  <span style={styles.dateDividerText}>
                    {getDateDivider(message.createdAt)}
                  </span>
                </div>
              )}

              {/* Sender name for group chats */}
              {!mine && showName && (
                <div style={styles.senderName}>{senderName}</div>
              )}

              {/* Message row */}
              <div style={{
                ...styles.messageRow,
                justifyContent: mine ? 'flex-end' : 'flex-start',
              }}>

                {/* Avatar for other people's messages */}
                {!mine && (
                  <div style={{
                    ...styles.messageAvatar,
                    backgroundColor: getAvatarColor(senderName),
                    opacity: showName ? 1 : 0, // hide but keep spacing
                  }}>
                    {getInitial(senderName)}
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  ...styles.bubble,
                  ...(mine ? styles.bubbleMine : styles.bubbleTheirs),
                }}>
                  <span style={styles.bubbleText}>{message.content}</span>
                  <span style={styles.bubbleTime}>
                    {getMessageTime(message.createdAt)}
                  </span>
                </div>

              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingList.length > 0 && (
          <div style={styles.messageRow}>
            <div style={styles.typingBubble}>
              <span style={styles.typingText}>
                {typingList.map((u) => u.userName).join(', ')}{' '}
                {typingList.length === 1 ? 'is' : 'are'} typing
              </span>
              <span style={styles.typingDots}>
                <span style={styles.dot} />
                <span style={styles.dot} />
                <span style={styles.dot} />
              </span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputBar}>
        <input
          ref={inputRef}
          style={styles.input}
          type='text'
          placeholder={`Message ${conversationName}...`}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={2000}
        />
        <button
          style={{
            ...styles.sendButton,
            ...(input.trim() ? styles.sendButtonActive : {}),
          }}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#282447',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#282447',
  },
  emptyStateIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
    color:'#e5e7eb',
  },
  emptyStateTitle: {
    color: '#e5e7eb',
    fontSize: '1.2rem',
    margin: '0 0 8px 0',
  },
  emptyStateDesc: {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    backgroundColor: '#1b1830',
    borderBottom: '1px solid #2a2a4a',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f1ebd2',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  headerName: {
    color: '#f1ebd2',
    fontWeight: '600',
    fontSize: '1rem',
  },
  headerSub: {
    color: '#6b7280',
    fontSize: '0.78rem',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  loadingState: {
    color: '#6b7280',
    fontSize: '0.875rem',
    textAlign: 'center',
    padding: '32px 0',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px 0 8px',
  },
  dateDividerText: {
    color: '#f1ebd2',
    fontSize: '0.75rem',
    backgroundColor: '#1a1a2e',
    padding: '3px 12px',
    borderRadius: '999px',
  },
  senderName: {
    color: '#9ca3af',
    fontSize: '0.78rem',
    marginLeft: '44px',
    marginBottom: '2px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '2px',
  },
  messageAvatar: {
    width: '28px',
    height: '28px',
    minWidth: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f1ebd2',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  bubble: {
    maxWidth: '65%',
    padding: '8px 12px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    flexWrap: 'wrap',
  },
  bubbleMine: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: '4px',
  },
  bubbleTheirs: {
    backgroundColor: '#1e1e3a',
    borderBottomLeftRadius: '4px',
  },
  bubbleText: {
    color: '#f1ebd2',
    fontSize: '0.925rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  bubbleTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.68rem',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end',
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1e1e3a',
    padding: '8px 14px',
    borderRadius: '16px',
    borderBottomLeftRadius: '4px',
  },
  typingText: {
    color: '#9ca3af',
    fontSize: '0.82rem',
  },
  typingDots: {
    display: 'flex',
    gap: '3px',
    alignItems: 'center',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#6b7280',
    animation: 'pulse 1.2s infinite',
  },
  inputBar: {
    display: 'flex',
    gap: '10px',
    padding: '14px 20px',
    backgroundColor: '#1b1830',
    borderTop: '1px solid #2a2a4a',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e3a',
    border: '1px solid #2a2a4a',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#f1ebd2',
    fontSize: '0.925rem',
    outline: 'none',
  },
  sendButton: {
    backgroundColor: '#2a2a4a',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#6b7280',
    fontSize: '0.925rem',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  sendButtonActive: {
    backgroundColor: '#4f46e5',
    color: '#f1ebd2',
    cursor: 'pointer',
  },
};
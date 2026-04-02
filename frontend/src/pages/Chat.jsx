import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import NewConversation from '../components/NewConversation';

export default function Chat({ user: propUser }) {
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [user, setUser] = useState(propUser || null);
  useEffect(() => {
      document.title = "Chat Room";
    }, []);

  // Load user from localStorage if not passed as prop
  useEffect(() => {
    if (!propUser) {
        try {
        const stored = JSON.parse(localStorage.getItem('user'));
        if (stored) {
            // normalize id → _id since localStorage user may use either
            setUser({
            ...stored,
            _id: stored._id || stored.id,
            userName: stored.userName || stored.name,
            });
        }
        } catch (_) {}
    }
    }, [propUser]);

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    messagesLoading,
    error,
    typingUsers,
    unreadCounts,
    blockedConversations,
    selectConversation,
    sendMessage,
    sendTyping,
    startDM,
    createGroup,
    searchUsers,
    getConversationName,
    deleteConversation,
  } = useChat({ user });

  // ─── Not logged in ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={styles.centered}>
        <p style={styles.notLoggedIn}>Please log in to use chat.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Error banner */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Conversation list — left sidebar */}
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={selectConversation}
        onNewChat={() => setShowNewConversation(true)}
        unreadCounts={unreadCounts}
        getConversationName={getConversationName}
        loading={loading}
        user={user}
      />

      {/* Chat window — right side */}
      <ChatWindow
        conversation={activeConversation}
        messages={messages}
        loading={messagesLoading}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        typingUsers={typingUsers}
        getConversationName={getConversationName}
        user={user}
        blockedConversations={blockedConversations}
        onDeleteConversation={deleteConversation}
      />

      {/* New conversation modal */}
      {showNewConversation && (
        <NewConversation
          onClose={() => setShowNewConversation(false)}
          onStartDM={async (userId) => {
            await startDM(userId);
            setShowNewConversation(false);
          }}
          onCreateGroup={async (data) => {
            await createGroup(data);
            setShowNewConversation(false);
          }}
          searchUsers={searchUsers}
        />
      )}

    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    width: '100vw',
    height: '92vh',
    backgroundColor: '#2e2952',
    overflow: 'hidden',
    position: 'fixed',
    top: '50px',
    left: 0,
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#2e2952',
    top: 0,
    left: 0,
  },
  notLoggedIn: {
    color: '#6b7280',
    fontSize: '1rem',
  },
  errorBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '10px 20px',
    fontSize: '0.875rem',
    textAlign: 'center',
    zIndex: 999,
  },
};
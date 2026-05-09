import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCirclePlus, Video } from 'lucide-react';

export default function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  onNewChat,
  unreadCounts,
  getConversationName,
  loading,
  user,
}) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    getConversationName(c).toLowerCase().includes(search.toLowerCase())
  );

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage?.content) return 'No messages yet';
    const isMe = conversation.lastMessage?.sender?._id === user?._id ||
                 conversation.lastMessage?.sender === (user?._id || user?.id);
    const preview = conversation.lastMessage.content.length > 40
      ? conversation.lastMessage.content.slice(0, 40) + '...'
      : conversation.lastMessage.content;
    return isMe ? `You: ${preview}` : preview;
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.lastMessage?.createdAt) return '';
    return formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
      addSuffix: false,
    });
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

  const getAvatarColor = (name) => {
    const colors = ['#059669', '#10b981', '#34d399', '#0ea5e9', '#d97706', '#dc2626'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Messages</h2>
        <button style={styles.newChatButton} onClick={onNewChat} title='New conversation'>
          <MessageCirclePlus/>
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrapper}>
        <input
          style={styles.searchInput}
          type='text'
          placeholder='Search conversations...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div style={styles.list}>
        {loading && (
          <div style={styles.emptyState}>Loading conversations...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={styles.emptyState}>
            {search ? 'No conversations match your search' : 'No conversations yet — start one!'}
          </div>
        )}

        {filtered.map((conversation) => {
          const name = getConversationName(conversation);
          const isActive = activeConversation?._id === conversation._id;
          const unread = unreadCounts[conversation._id] || 0;

          return (
            <div
              key={conversation._id}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : {}),
              }}
              onClick={() => onSelect(conversation)}
            >
              {/* Avatar */}
              <div
                style={{
                  ...styles.avatar,
                  backgroundColor: getAvatarColor(name),
                }}
              >
                {conversation.type === 'group' ? '👥' : getInitial(name)}
              </div>

              {/* Content */}
              <div style={styles.itemContent}>
                <div style={styles.itemTop}>
                  <span style={styles.itemName}>{name}</span>
                  <span style={styles.itemTime}>
                    {getLastMessageTime(conversation)}
                  </span>
                </div>
                <div style={styles.itemBottom}>
                  <span style={{
                    ...styles.itemPreview,
                    ...(unread > 0 ? styles.itemPreviewUnread : {}),
                  }}>
                    {getLastMessagePreview(conversation)}
                  </span>
                  {unread > 0 && (
                    <span style={styles.unreadBadge}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
         
      </div>
      <button
      style={styles.videoButton}
      onClick={() => window.open("/video", "_blank")}
      title='Start video call'
    >
      <><Video/>  Arrange Video Call</>
    </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
    minWidth: '300px',
    height: '100%',
    backgroundColor: '#1A2332',
    borderRight: '1px solid #2D3748',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px 12px',
    borderBottom: '1px solid #2D3748',
    flexShrink: 0,
  },
  title: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: 0,
  },
  newChatButton: {
    backgroundColor: 'transparent',
    border: '1px solid #12121d',
    borderRadius: '8px',
    padding: '10px 10px',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#fff',
  },
  searchWrapper: {
    padding: '12px 16px',
    borderBottom: '1px solid #2D3748',
    flexShrink: 0,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#1A2332',
    border: '1px solid #2D3748',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyState: {
    color: '#6b7280',
    fontSize: '0.875rem',
    textAlign: 'center',
    padding: '32px 16px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #2D3748',
    transition: 'background-color 0.15s',
  },
  itemActive: {
    backgroundColor: '#1A2332',
    borderLeft: '3px solid #6EE7B7',
  },
  avatar: {
    width: '44px',
    height: '44px',
    minWidth: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    color: '#fff',
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    overflow: 'hidden',
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
  },
  itemName: {
    color: '#e5e7eb',
    fontSize: '0.95rem',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    color: '#6b7280',
    fontSize: '0.72rem',
    whiteSpace: 'nowrap',
    marginLeft: '8px',
  },
  itemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPreview: {
    color: '#6b7280',
    fontSize: '0.82rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPreviewUnread: {
    color: '#e5e7eb',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#6EE7B7',
    color: '#151D28',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    padding: '2px 7px',
    borderRadius: '999px',
    marginLeft: '8px',
    whiteSpace: 'nowrap',
  },
  videoButton: {
    backgroundColor: '#6EE7B7',
    border: 'none',
    padding: '8px 16px',
    color: '#151D28',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};
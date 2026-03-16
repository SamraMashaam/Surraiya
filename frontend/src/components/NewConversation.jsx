import { useState, useEffect, useRef } from 'react';

export default function NewConversation({ onClose, onStartDM, onCreateGroup, searchUsers }) {
  const [mode, setMode] = useState('dm'); // 'dm' or 'group'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // [{ _id, name, email }]
  const [groupName, setGroupName] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || !query.trim()) {
        setResults([]);
        setSearching(false);
        return;
    }
    setSearching(true);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
        const users = await searchUsers(query);
        setResults(users);
        setSearching(false);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
    }, [query, searchUsers]);

  // Clear selected when switching modes
  useEffect(() => {
    setSelected([]);
    setQuery('');
    setResults([]);
    setGroupName('');
    setError('');
  }, [mode]);

  const toggleSelect = (user) => {
    if (mode === 'dm') {
        clearTimeout(searchTimeoutRef.current); // prevent search re-firing
        setSelected([user]);
        setQuery(user.name);
        setResults([]);
        setSearching(false);
        return;
    }
    const already = selected.find((s) => s._id === user._id);
    if (already) {
        setSelected((prev) => prev.filter((s) => s._id !== user._id));
    } else {
        setSelected((prev) => [...prev, user]);
    }
    };

  const handleSubmit = async () => {
    setError('');

    if (mode === 'dm') {
      if (selected.length === 0) {
        setError('Please select a user to message.');
        return;
      }
      setSubmitting(true);
      await onStartDM(selected[0]._id);
      setSubmitting(false);
      onClose();
      return;
    }

    // Group
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    }
    if (selected.length < 2) {
      setError('Please select at least 2 people for a group chat.');
      return;
    }
    setSubmitting(true);
    await onCreateGroup({
      name: groupName.trim(),
      participantIds: selected.map((s) => s._id),
    });
    setSubmitting(false);
    onClose();
  };

  return (
    // Backdrop
    <div style={styles.backdrop} onClick={onClose}>

      {/* Modal */}
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>New Conversation</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Mode toggle */}
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeButton, ...(mode === 'dm' ? styles.modeButtonActive : {}) }}
            onClick={() => setMode('dm')}
          >
            Direct Message
          </button>
          <button
            style={{ ...styles.modeButton, ...(mode === 'group' ? styles.modeButtonActive : {}) }}
            onClick={() => setMode('group')}
          >
            Group Chat
          </button>
        </div>

        {/* Group name input — group mode only */}
        {mode === 'group' && (
          <div style={styles.field}>
            <label style={styles.label}>Group Name</label>
            <input
              style={styles.input}
              type='text'
              placeholder='e.g. Study Group, Project Team...'
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>
        )}

        {/* Selected users — group mode */}
        {mode === 'group' && selected.length > 0 && (
          <div style={styles.selectedList}>
            {selected.map((u) => (
              <div key={u._id} style={styles.selectedChip}>
                <span>{u.name}</span>
                <button
                  style={styles.chipRemove}
                  onClick={() => setSelected((prev) => prev.filter((s) => s._id !== u._id))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search input */}
        <div style={styles.field}>
          <label style={styles.label}>
            {mode === 'dm' ? 'Search for a user' : 'Add participants'}
          </label>
          <input
            ref={inputRef}
            style={styles.input}
            type='text'
            placeholder='Search by name or email...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Search results */}
        {(searching || results.length > 0) && (
          <div style={styles.results}>
            {searching && (
              <div style={styles.resultsEmpty}>Searching...</div>
            )}
            {!searching && results.length === 0 && query.trim() && (
              <div style={styles.resultsEmpty}>No users found</div>
            )}
            {results.map((user) => {
              const isSelected = selected.find((s) => s._id === user._id);
              return (
                <div
                  key={user._id}
                  style={{
                    ...styles.resultItem,
                    ...(isSelected ? styles.resultItemSelected : {}),
                  }}
                  onClick={() => toggleSelect(user)}
                >
                  <div style={styles.resultAvatar}>
                    {user.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.resultInfo}>
                    <span style={styles.resultName}>{user.userName}</span>
                    <span style={styles.resultEmail}>{user.email}</span>
                  </div>
                  {isSelected && <span style={styles.checkmark}>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Submit */}
        <button
          style={{
            ...styles.submitButton,
            ...(submitting ? styles.submitButtonDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? 'Creating...'
            : mode === 'dm'
            ? 'Start Conversation'
            : 'Create Group'}
        </button>

      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#13131f',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  title: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  modeToggle: {
    display: 'flex',
    backgroundColor: '#0f0f1a',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px',
    gap: '4px',
  },
  modeButton: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modeButtonActive: {
    backgroundColor: '#4f46e5',
    color: '#fff',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: '#9ca3af',
    fontSize: '0.8rem',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e3a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.925rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  selectedList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  },
  selectedChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.825rem',
  },
  chipRemove: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    padding: '0',
    fontSize: '0.75rem',
    lineHeight: 1,
  },
  results: {
    backgroundColor: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: '10px',
    marginBottom: '16px',
    overflow: 'hidden',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  resultsEmpty: {
    color: '#6b7280',
    fontSize: '0.875rem',
    padding: '14px 16px',
    textAlign: 'center',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #1a1a2e',
  },
  resultItemSelected: {
    backgroundColor: '#1e1e3a',
  },
  resultAvatar: {
    width: '34px',
    height: '34px',
    minWidth: '34px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.875rem',
  },
  resultInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  resultName: {
    display: 'block',
    color: '#e5e7eb',
    fontSize: '0.925rem',
    fontWeight: '500',
  },
  resultEmail: {
    display: 'block',
    color: '#6b7280',
    fontSize: '0.78rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  checkmark: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  error: {
    backgroundColor: '#7f1d1d',
    border: '1px solid #dc2626',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '16px',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a4a',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
};
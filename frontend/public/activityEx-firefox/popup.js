console.log('🔔 Inactivity popup opened');

// Dismiss button
document.getElementById('dismissBtn').addEventListener('click', () => {
  console.log('✅ User dismissed notification');
  
  chrome.runtime.sendMessage({ action: 'notificationDismissed' }, () => {
    window.close();
  });
});


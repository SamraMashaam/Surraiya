const USER_ID = "12345";
const API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;

console.log('Focus page loaded');
console.log('Current URL:', window.location.href);

const urlParams = new URLSearchParams(window.location.search);
let blockedSite = urlParams.get('site') || 'this site';

console.log('Blocked site:', blockedSite);

document.getElementById('siteName').textContent = blockedSite;

document.getElementById('dashboardBtn').addEventListener('click', function() {
  console.log('Dashboard button clicked');
  window.location.href = 'http://localhost:3000';
});

document.getElementById('unblockBtn').addEventListener('click', async function() {
  console.log('Unblock button clicked for:', blockedSite);
  
  if (!confirm(`Are you sure you want to unblock ${blockedSite}?`)) {
    console.log('User cancelled unblock');
    return;
  }
  
  const btn = document.getElementById('unblockBtn');
  btn.disabled = true;
  btn.textContent = 'Unblocking...';
  
  try {
    console.log('Sending DELETE request to:', `${API_URL}/${encodeURIComponent(blockedSite)}`);
    const res = await fetch(`${API_URL}/${encodeURIComponent(blockedSite)}`, {
      method: 'DELETE'
    });
    
    console.log('Response status:', res.status);
    
    if (res.ok) {
      chrome.runtime.sendMessage({ action: 'syncBlocklist' }, function(response) {
        console.log('Sync triggered:', response);
        alert(`${blockedSite} has been unblocked!`);
        window.location.href = `https://${blockedSite}`;
      });
      alert(`${blockedSite} has been unblocked!`);
      console.log('Redirecting to:', `https://${blockedSite}`);
      window.location.href = `https://${blockedSite}`;
    } else {
      alert('Failed to unblock site. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Unblock site';
    }
  } catch (err) {
    console.error('Error unblocking site:', err);
    alert('Failed to unblock site. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Unblock site';
  }
});

console.log('Event listeners attached');
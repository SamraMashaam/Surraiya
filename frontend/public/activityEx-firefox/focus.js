const USER_ID = "12345";
const API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;

console.log('Focus page loaded');
console.log('Current URL:', window.location.href);

const urlParams = new URLSearchParams(window.location.search);
let blockedSite = urlParams.get('site') || 'this site';

console.log('Blocked site:', blockedSite);

document.getElementById('siteName').textContent = blockedSite;

let countdownInterval = null;
let remainingSeconds = 60;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showCountdown() {
  document.getElementById('mainButtons').classList.add('hidden');
  document.getElementById('countdownContainer').classList.remove('hidden');
  remainingSeconds = 60;
  document.getElementById('countdownTimer').textContent = formatTime(remainingSeconds);
  startCountdown();
}

function hideCountdown() {
  document.getElementById('mainButtons').classList.remove('hidden');
  document.getElementById('countdownContainer').classList.add('hidden');
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    remainingSeconds--;
    document.getElementById('countdownTimer').textContent = formatTime(remainingSeconds);
    
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      performUnblock();
    }
  }, 1000);
}

async function performUnblock() {
  console.log('Performing unblock for:', blockedSite);
  
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn.disabled = true;
  cancelBtn.textContent = 'Unblocking...';
  
  try {
    console.log('Sending DELETE request to:', `${API_URL}/${encodeURIComponent(blockedSite)}`);
    const res = await fetch(`${API_URL}/${encodeURIComponent(blockedSite)}`, {
      method: 'DELETE'
    });
    
    console.log('Response status:', res.status);
    
    if (res.ok) {
      chrome.runtime.sendMessage({ action: 'syncBlocklist' }, function(response) {
        console.log('Sync triggered:', response);
      });
      alert(`${blockedSite} has been unblocked!`);
      console.log('Redirecting to:', `https://${blockedSite}`);
      window.location.href = `https://${blockedSite}`;
    } else {
      alert('Failed to unblock site. Please try again.');
      hideCountdown();
      cancelBtn.disabled = false;
      cancelBtn.textContent = 'Cancel Unblock';
    }
  } catch (err) {
    console.error('Error unblocking site:', err);
    alert('Failed to unblock site. Please try again.');
    hideCountdown();
    cancelBtn.disabled = false;
    cancelBtn.textContent = 'Cancel Unblock';
  }
}

document.getElementById('dashboardBtn').addEventListener('click', function() {
  console.log('Dashboard button clicked');
  window.location.href = 'http://localhost:3000';
});

document.getElementById('unblockBtn').addEventListener('click', function() {
  console.log('Unblock button clicked for:', blockedSite);
  showCountdown();
});

document.getElementById('cancelBtn').addEventListener('click', function() {
  console.log('Cancel button clicked');
  hideCountdown();
});

console.log('Event listeners attached');
console.log('🔔 Inactivity popup opened');

// 1. Create the audio object
const audio = new Audio(chrome.runtime.getURL("alert.mp3"));

// 2. Enable looping
audio.loop = true;

// 3. Play immediately (catch errors for autoplay policies)
audio.play().catch(error => {
  console.warn("Audio playback failed:", error);
});

// Dismiss button handler
const dismissBtn = document.getElementById('dismissBtn');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    console.log('✅ User dismissed notification');
    
    // Stop the sound immediately when button is clicked
    audio.pause();
    audio.currentTime = 0;

    // Notify background script and close
    chrome.runtime.sendMessage({ action: 'notificationDismissed' }, () => {
      window.close();
    });
  });
}
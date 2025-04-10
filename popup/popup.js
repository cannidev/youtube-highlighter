document.addEventListener('DOMContentLoaded', () => {
  const thresholdSlider = document.getElementById('threshold');
  const windowSlider = document.getElementById('window');
  const thresholdValue = document.getElementById('thresholdValue');
  const windowValue = document.getElementById('windowValue');

  const themeToggle = document.getElementById('themeToggle');

  chrome.storage.sync.get('theme', (data) => {
    const theme = data.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
    themeToggle.checked = theme === 'dark';
  });

  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    chrome.storage.sync.set({ theme });
  });


  chrome.storage.sync.get(['threshold', 'window'], (data) => {
    thresholdSlider.value = data.threshold || 2;
    windowSlider.value = data.window || 5;
    updateDisplayValues();
  });

  thresholdSlider.addEventListener('input', () => updateDisplayValues());
  windowSlider.addEventListener('input', () => updateDisplayValues());

  document.getElementById('save').addEventListener('click', () => {
    const threshold = parseFloat(thresholdSlider.value);
    const windowSize = parseInt(windowSlider.value);

    chrome.storage.sync.set({ threshold, window }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SETTINGS_UPDATE',
          threshold,
          windowSize
        });
      });
      window.close();
    });
  });

  function updateDisplayValues() {
    thresholdValue.textContent = `${thresholdSlider.value}x`;
    windowValue.textContent = windowSlider.value;
  }
});
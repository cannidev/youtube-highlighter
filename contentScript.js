
let HIGHLIGHT_THRESHOLD = 2;
let WINDOW_SIZE = 5;

chrome.storage.sync.get(['threshold', 'window'], (data) => {
  HIGHLIGHT_THRESHOLD = data.threshold || 2;
  WINDOW_SIZE = data.window || 5;
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'SETTINGS_UPDATE') {
    HIGHLIGHT_THRESHOLD = request.threshold;
    WINDOW_SIZE = request.windowSize;
    highlightVideos();
  }
});


function parseViews(viewString) {
  if (!viewString) return 0;

  if (viewString.toLowerCase().includes('no views')) return 0;


  const clean = viewString.replace(/[^0-9.KM]/g, '');
  const num = parseFloat(clean);

  if (clean.includes('K')) return num * 1000;
  if (clean.includes('M')) return num * 1000000;
  return num;
}
function getVideoElements() {

  return Array.from(document.querySelectorAll(
    'ytd-grid-video-renderer, ytd-rich-grid-media'
  ));
}

function calculateViewData(videos) {
  return videos.map(video => {
    const viewElement = [...video.querySelectorAll('span')]
      .find(span => span.textContent.includes('views'));
    return {
      element: video,
      views: parseViews(viewElement?.textContent || '0')
    };
  });
}
const style = document.createElement('style');
style.textContent = `
  @keyframes rainbow {
    0%   { border-color: #ff0000; }
    16%  { border-color: #ff7f00; }
    33%  { border-color: #ffff00; }
    50%  { border-color: #00ff00; }
    66%  { border-color: #0000ff; }
    83%  { border-color: #4b0082; }
    100% { border-color: #ff0000; }
  }
  
  .rainbow-highlight {
    border: 5px solid #ff0000;
    animation: rainbow 2s linear infinite;
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);

function highlightVideos() {
  const videos = getVideoElements();
  if (videos.length < 3) return;

  const viewData = calculateViewData(videos);

  viewData.forEach((currentVideo, index) => {

    const thumbnailLink = currentVideo.element.querySelector('#thumbnail a');
    if (!thumbnailLink) return;

    const start = Math.max(0, index - WINDOW_SIZE);
    const end = Math.min(viewData.length - 1, index + WINDOW_SIZE);
    const nearby = viewData.slice(start, end + 1);

    const total = nearby.reduce((sum, video) => sum + video.views, 0);
    const average = total / nearby.length;

    if (average > 0 && currentVideo.views / average >= HIGHLIGHT_THRESHOLD) {
      thumbnailLink.classList.add('rainbow-highlight');
    } else {
      thumbnailLink.classList.remove('rainbow-highlight');
    }
  });
}


const observer = new MutationObserver(() => {
  if (window.location.href.includes('/videos')) {
    highlightVideos();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

if (window.location.href.includes('/videos')) {
  highlightVideos();
}
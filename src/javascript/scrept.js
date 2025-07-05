document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURATION ===
    const API_KEY = 'AIzaSyAMgYgHKz8aXQGVJ9u1Pa0d14EyEZDPVr8'; // 🔑 Replace with your Google API key
    const VIDEO_FOLDER_ID = '1g8RrmxJei-b3Ys6GfNivYLDqUhIF8z9C'; // 🎥 Google Drive video folder ID
    const LONG_VIDEO_FOLDER_ID = '1lfSbGwPLTSlU41NF-HrYdEN0lNsvbvge'; // 🎬 Long videos folder ID (replace with actual ID)
    const THUMBNAIL_FOLDER = '/thumbnal/';
    const TOTAL_IMAGES = 8;

    // === IMAGE SLIDER SETUP ===
    const imageFiles = [];
    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        imageFiles.push({
            name: `Thumbnal-${i}.jpg`,
            url: `${THUMBNAIL_FOLDER}Thumbnal-${i}.jpg`
        });
    }

    let currentIndex = 0;
    let slides = [];
    let slideInterval;
    let isAnimating = false;

    const slidesContainer = document.querySelector('.slides');
    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');
    const videoContainer = document.getElementById('videos');

    // === SLIDER FUNCTIONS ===
    function getIndex(offset) {
        const len = imageFiles.length;
        return (currentIndex + offset + len) % len;
    }

    function renderSlides() {
        if (!slidesContainer || imageFiles.length === 0) return;

        slidesContainer.innerHTML = '';
        slides = [];

        const positions = ['left', 'center', 'right'];
        [-1, 0, 1].forEach((offset, i) => {
            const slide = document.createElement('div');
            slide.className = `slide ${positions[i]}`;

            const img = document.createElement('img');
            const image = imageFiles[getIndex(offset)];
            img.className = 'slide-image';
            img.src = image.url;
            img.alt = image.name;
            img.onerror = () => console.error("Slider image failed to load:", img.src);

            slide.appendChild(img);
            slidesContainer.appendChild(slide);
            slides.push(slide);
        });
    }

    function updateSlides(direction) {
        if (isAnimating) return;
        isAnimating = true;

        slides.forEach(slide => slide.classList.remove('left', 'center', 'right'));

        if (direction === 'left') {
            slides[0].classList.add('left');
            slides[1].classList.add('left');
            slides[2].classList.add('center');
        } else {
            slides[0].classList.add('center');
            slides[1].classList.add('right');
            slides[2].classList.add('right');
        }

        setTimeout(() => {
            currentIndex = (currentIndex + (direction === 'left' ? 1 : -1) + imageFiles.length) % imageFiles.length;
            renderSlides();
            isAnimating = false;
        }, 500);
    }

    function nextSlide() {
        updateSlides('left');
    }

    function prevSlide() {
        updateSlides('right');
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 3500);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    // === VIDEO FETCH (NO THUMBNAILS) ===
    async function fetchDriveVideos(folderId) {
        const query = `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=files(id,name)&t=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.files || [];
    }

    // === BATCH VIDEO LOADING ===
    let allVideos = [];
    let allLongVideos = [];
    let currentBatch = 0;
    let currentLongBatch = 0;
    const videosPerBatch = 6;
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showMoreLongBtn = document.getElementById('showMoreLongBtn');
    const longVideoContainer = document.getElementById('longVideos');

    function createVideoCard(video, index, isLongVideo = false) {
        // Create video card container
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card loading';
        
        // Create video container with iframe
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'video-container';
        
        const iframe = document.createElement('iframe');
        iframe.src = `https://drive.google.com/file/d/${video.id}/preview`;
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        
        // Create play button overlay
        const playButton = document.createElement('div');
        playButton.className = 'play-button';
        playButton.innerHTML = '<i class="fa-solid fa-play"></i>';
        
        // Create video info section
        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        
        // Create video title
        const videoTitle = document.createElement('h3');
        videoTitle.className = 'video-title';
        videoTitle.textContent = video.name.replace(/\.[^/.]+$/, ''); // Remove file extension
        
        // Create video meta information
        const videoMeta = document.createElement('div');
        videoMeta.className = 'video-meta';
        
        const videoType = document.createElement('span');
        videoType.className = 'video-type';
        videoType.textContent = isLongVideo ? 'Long Video' : 'Twixtor Edit';
        
        const videoDate = document.createElement('span');
        videoDate.className = 'video-date';
        videoDate.textContent = `${isLongVideo ? 'Long' : 'Video'} ${index + 1}`;
        
        // Assemble the card
        videoMeta.appendChild(videoType);
        videoMeta.appendChild(videoDate);
        
        videoInfo.appendChild(videoTitle);
        videoInfo.appendChild(videoMeta);
        
        videoWrapper.appendChild(iframe);
        videoWrapper.appendChild(playButton);
        
        videoCard.appendChild(videoWrapper);
        videoCard.appendChild(videoInfo);
        
        // Add click event for the entire video container
        videoWrapper.addEventListener('click', (e) => {
            // Don't trigger if clicking on the play button specifically
            if (e.target === playButton || playButton.contains(e.target)) {
                return;
            }
            
            // Simply focus the iframe and let the user interact with it directly
            iframe.focus();
            
            // Hide play button after clicking
            playButton.style.opacity = '0';
            playButton.style.pointerEvents = 'none';
            
            // Show visual feedback
            playButton.innerHTML = '<i class="fa-solid fa-check"></i>';
            playButton.style.background = 'rgba(76, 175, 80, 0.9)';
            
            // Reset button after a delay
            setTimeout(() => {
                playButton.style.opacity = '0';
            }, 1000);
        });
        
        // Add click event for play button
        playButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the videoWrapper click
            
            // Focus the iframe
            iframe.focus();
            
            // Hide play button
            playButton.style.opacity = '0';
            playButton.style.pointerEvents = 'none';
            
            // Show visual feedback
            playButton.innerHTML = '<i class="fa-solid fa-check"></i>';
            playButton.style.background = 'rgba(76, 175, 80, 0.9)';
            
            // Reset button after a delay
            setTimeout(() => {
                playButton.style.opacity = '0';
            }, 1000);
        });
        
        // Remove loading animation after iframe loads
        iframe.addEventListener('load', () => {
            videoCard.classList.remove('loading');
        });
        
        // Add error handling
        iframe.addEventListener('error', () => {
            videoCard.classList.remove('loading');
            videoCard.style.opacity = '0.7';
            videoTitle.textContent = 'Video unavailable';
            videoTitle.style.color = 'rgba(255, 255, 255, 0.6)';
        });
        
        return videoCard;
    }

    function loadVideoBatch() {
        const startIndex = currentBatch * videosPerBatch;
        const endIndex = startIndex + videosPerBatch;
        const batchVideos = allVideos.slice(startIndex, endIndex);
        
        if (batchVideos.length === 0) {
            showMoreBtn.style.display = 'none';
            return;
        }
        
        batchVideos.forEach((video, batchIndex) => {
            const globalIndex = startIndex + batchIndex;
            const videoCard = createVideoCard(video, globalIndex, false);
            videoContainer.appendChild(videoCard);
            
            // Add staggered animation for new cards
            setTimeout(() => {
                videoCard.style.opacity = '0';
                videoCard.style.transform = 'translateY(20px)';
                videoCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    videoCard.style.opacity = '1';
                    videoCard.style.transform = 'translateY(0)';
                }, 100);
            }, batchIndex * 100);
        });
        
        currentBatch++;
        
        // Hide show more button if no more videos
        if (endIndex >= allVideos.length) {
            showMoreBtn.style.display = 'none';
        }
    }

    function loadLongVideoBatch() {
        const startIndex = currentLongBatch * videosPerBatch;
        const endIndex = startIndex + videosPerBatch;
        const batchVideos = allLongVideos.slice(startIndex, endIndex);
        
        if (batchVideos.length === 0) {
            showMoreLongBtn.style.display = 'none';
            return;
        }
        
        batchVideos.forEach((video, batchIndex) => {
            const globalIndex = startIndex + batchIndex;
            const videoCard = createVideoCard(video, globalIndex, true);
            longVideoContainer.appendChild(videoCard);
            
            // Add staggered animation for new cards
            setTimeout(() => {
                videoCard.style.opacity = '0';
                videoCard.style.transform = 'translateY(20px)';
                videoCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    videoCard.style.opacity = '1';
                    videoCard.style.transform = 'translateY(0)';
                }, 100);
            }, batchIndex * 100);
        });
        
        currentLongBatch++;
        
        // Hide show more button if no more videos
        if (endIndex >= allLongVideos.length) {
            showMoreLongBtn.style.display = 'none';
        }
    }

    async function loadVideos() {
        allVideos = await fetchDriveVideos(VIDEO_FOLDER_ID);
        allVideos.sort((a, b) => a.name.localeCompare(b.name));

        if (!videoContainer) return;
        videoContainer.innerHTML = '';
        currentBatch = 0;

        // Check if folder is empty
        if (allVideos.length === 0) {
            videoContainer.innerHTML = `
                <div class="coming-soon">
                    <i class="fa-solid fa-video"></i>
                    <h2>Coming Soon</h2>
                    <p>New Twixtor edits are being prepared. Stay tuned!</p>
                </div>
            `;
            showMoreBtn.style.display = 'none';
            return;
        }

        // Load first batch
        loadVideoBatch();
        
        // Show the "Show More" button if there are more videos
        if (allVideos.length > videosPerBatch) {
            showMoreBtn.style.display = 'flex';
        }
    }

    async function loadLongVideos() {
        allLongVideos = await fetchDriveVideos(LONG_VIDEO_FOLDER_ID);
        allLongVideos.sort((a, b) => a.name.localeCompare(b.name));

        if (!longVideoContainer) return;
        longVideoContainer.innerHTML = '';
        currentLongBatch = 0;

        // Check if folder is empty
        if (allLongVideos.length === 0) {
            longVideoContainer.innerHTML = `
                <div class="coming-soon">
                    <i class="fa-solid fa-film"></i>
                    <h2>Coming Soon</h2>
                    <p>Long videos are being prepared. Check back later!</p>
                </div>
            `;
            showMoreLongBtn.style.display = 'none';
            return;
        }

        // Load first batch
        loadLongVideoBatch();
        
        // Show the "Show More" button if there are more videos
        if (allLongVideos.length > videosPerBatch) {
            showMoreLongBtn.style.display = 'flex';
        }
    }

    // Show More button event listeners
    showMoreBtn?.addEventListener('click', () => {
        showMoreBtn.classList.add('loading');
        showMoreBtn.innerHTML = '<i class="fa-solid fa-spinner"></i>Loading...';
        
        setTimeout(() => {
            loadVideoBatch();
            showMoreBtn.classList.remove('loading');
            showMoreBtn.innerHTML = '<i class="fa-solid fa-plus"></i>Show More Videos';
        }, 500);
    });

    showMoreLongBtn?.addEventListener('click', () => {
        showMoreLongBtn.classList.add('loading');
        showMoreLongBtn.innerHTML = '<i class="fa-solid fa-spinner"></i>Loading...';
        
        setTimeout(() => {
            loadLongVideoBatch();
            showMoreLongBtn.classList.remove('loading');
            showMoreLongBtn.innerHTML = '<i class="fa-solid fa-plus"></i>Show More Long Videos';
        }, 500);
    });

    // === SLIDER EVENTS ===
    nextBtn?.addEventListener('click', () => {
        nextSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    prevBtn?.addEventListener('click', () => {
        prevSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    // === INIT ===
    function initSlider() {
        renderSlides();
        startAutoSlide();
    }

    initSlider();
    loadVideos();
    loadLongVideos();
});

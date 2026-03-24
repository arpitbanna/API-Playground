/**
 * Public API Playground
 * Main JavaScript File
 */

// ---- Utility Functions ----

// Toast Notification System
const ToastType = { SUCCESS: 'success', ERROR: 'error', INFO: 'info' };

function showToast(message, type = ToastType.INFO) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === ToastType.SUCCESS) iconClass = 'fa-circle-check';
    if (type === ToastType.ERROR) iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Copy to Clipboard
async function copyToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, ToastType.SUCCESS);
    } catch (err) {
        showToast('Failed to copy to clipboard', ToastType.ERROR);
        console.error('Clipboard error:', err);
    }
}

// ---- Feature 1: Dog Finder Card ----
const DogAPI = (() => {
    let currentImgUrl = '';

    const btnGet = document.getElementById('btn-get-dog');
    const btnCopyUrl = document.getElementById('btn-copy-dog-url');
    const btnDownload = document.getElementById('btn-download-dog');
    
    const imgElement = document.getElementById('dog-image');
    const loader = document.getElementById('dog-loader');
    const emptyState = document.getElementById('dog-empty');
    const breedText = document.getElementById('dog-breed');

    async function fetchDog() {
        try {
            // UI Loading state
            btnGet.disabled = true;
            btnGet.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
            emptyState.style.display = 'none';
            imgElement.style.display = 'none';
            loader.style.display = 'block';
            breedText.textContent = 'Loading...';

            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            currentImgUrl = data.message;

            // Extract breed from URL (e.g., https://images.dog.ceo/breeds/terrier-irish/n02093991_1041.jpg)
            const urlParts = currentImgUrl.split('/');
            const breedPart = urlParts[urlParts.indexOf('breeds') + 1];
            // Format breed name (e.g., "terrier-irish" -> "Irish Terrier")
            const formattedBreed = breedPart.split('-').reverse().map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            // Load Image
            imgElement.src = currentImgUrl;
            imgElement.onload = () => {
                loader.style.display = 'none';
                imgElement.style.display = 'block';
                breedText.textContent = formattedBreed;
                
                // Enable actions
                btnGet.disabled = false;
                btnGet.innerHTML = '<i class="fa-solid fa-paw"></i> New Dog';
                btnCopyUrl.disabled = false;
                btnDownload.disabled = false;
            };

            imgElement.onerror = () => {
                throw new Error('Failed to load image');
            };

        } catch (error) {
            console.error('Dog API Error:', error);
            loader.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load dog.</p>';
            btnGet.disabled = false;
            btnGet.innerHTML = '<i class="fa-solid fa-paw"></i> Try Again';
            showToast('Failed to fetch dog image', ToastType.ERROR);
        }
    }

    async function downloadImage() {
        try {
            const response = await fetch(currentImgUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `dog-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Image downloaded successfully', ToastType.SUCCESS);
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download image (CORS issue possible)', ToastType.ERROR);
            // Fallback: open in new tab
            window.open(currentImgUrl, '_blank');
        }
    }

    // Event Listeners
    btnGet.addEventListener('click', fetchDog);
    btnCopyUrl.addEventListener('click', () => copyToClipboard(currentImgUrl, 'Image URL copied!'));
    btnDownload.addEventListener('click', downloadImage);
})();

// ---- Feature 2: Joke Generator Card ----
const JokeAPI = (() => {
    let currentJoke = '';

    const btnGet = document.getElementById('btn-get-joke');
    const btnCopy = document.getElementById('btn-copy-joke');
    
    const content = document.getElementById('joke-content');
    const setupEl = document.getElementById('joke-setup');
    const punchlineEl = document.getElementById('joke-punchline');
    const loader = document.getElementById('joke-loader');
    const emptyState = document.getElementById('joke-empty');

    let typewriterTimeout;

    // Typewriter effect function
    function typeWriter(text, element, speed = 50) {
        element.innerHTML = '<span class="cursor"></span>';
        let i = 0;
        
        return new Promise(resolve => {
            function type() {
                if (i < text.length) {
                    element.innerHTML = text.substring(0, i + 1) + '<span class="cursor"></span>';
                    i++;
                    typewriterTimeout = setTimeout(type, speed);
                } else {
                    element.innerHTML = text; // Remove cursor at end
                    resolve();
                }
            }
            type();
        });
    }

    async function fetchJoke() {
        try {
            clearTimeout(typewriterTimeout);
            
            btnGet.disabled = true;
            btnGet.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting Joke...';
            btnCopy.disabled = true;
            
            emptyState.style.display = 'none';
            content.style.display = 'none';
            loader.style.display = 'block';

            const response = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.error) throw new Error(data.message || 'API Error');

            currentJoke = `${data.setup} - ${data.delivery}`;

            loader.style.display = 'none';
            content.style.display = 'block';
            
            setupEl.textContent = data.setup;
            punchlineEl.innerHTML = '';

            // Delay punchline for comic effect, then type it out
            setTimeout(async () => {
                await typeWriter(data.delivery, punchlineEl, 60);
                btnGet.disabled = false;
                btnGet.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Next Joke';
                btnCopy.disabled = false;
            }, 1000);

        } catch (error) {
            console.error('Joke API Error:', error);
            loader.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><p>Failed to find a joke.</p>';
            btnGet.disabled = false;
            btnGet.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Try Again';
            showToast('Failed to fetch joke', ToastType.ERROR);
        }
    }

    btnGet.addEventListener('click', fetchJoke);
    btnCopy.addEventListener('click', () => copyToClipboard(currentJoke, 'Joke copied to clipboard!'));
})();

// ---- Feature 3: Random User Card ----
const UserAPI = (() => {
    const btnGet = document.getElementById('btn-get-user');
    const btnCopyEmail = document.getElementById('btn-copy-email');
    
    const content = document.getElementById('user-content');
    const loader = document.getElementById('user-loader');
    const emptyState = document.getElementById('user-empty');

    // DOM Elements for user data
    const imgEl = document.getElementById('user-image');
    const nameEl = document.getElementById('user-name');
    const countryEl = document.getElementById('user-country');
    const emailEl = document.getElementById('user-email');
    const phoneEl = document.getElementById('user-phone');
    const ageEl = document.getElementById('user-age');

    let currentEmail = '';

    async function fetchUser() {
        try {
            btnGet.disabled = true;
            btnGet.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            
            emptyState.style.display = 'none';
            content.style.display = 'none';
            loader.style.display = 'flex';

            const response = await fetch('https://randomuser.me/api/');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            const user = data.results[0];

            currentEmail = user.email;

            // Populate data
            nameEl.textContent = `${user.name.first} ${user.name.last}`;
            countryEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${user.location.country}`;
            emailEl.textContent = user.email;
            phoneEl.textContent = user.phone;
            ageEl.textContent = `Age: ${user.dob.age}`;
            
            imgEl.src = user.picture.large;
            imgEl.onload = () => {
                loader.style.display = 'none';
                content.style.display = 'block';
                btnGet.disabled = false;
                btnGet.innerHTML = '<i class="fa-solid fa-id-badge"></i> New Identity';
            };

            imgEl.onerror = () => {
                throw new Error('Image load failed');
            }

        } catch (error) {
            console.error('User API Error:', error);
            loader.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><p>Connection issue.</p>';
            btnGet.disabled = false;
            btnGet.innerHTML = '<i class="fa-solid fa-id-badge"></i> Try Again';
            showToast('Failed to generate user', ToastType.ERROR);
        }
    }

    btnGet.addEventListener('click', fetchUser);
    btnCopyEmail.addEventListener('click', () => copyToClipboard(currentEmail, 'Email copied!'));
})();

// ---- Feature 4: API Explorer Module ----
const ExplorerAPI = (() => {
    // DOM Elements
    const btnFetch = document.getElementById('btn-fetch-data');
    const btnReset = document.getElementById('btn-reset-data');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const btnViewJson = document.getElementById('btn-view-json');
    const btnCopyJson = document.getElementById('btn-copy-json');
    const btnLoadMore = document.getElementById('btn-load-more');
    const paginationFooter = document.getElementById('pagination-footer');
    
    const inputQuery = document.getElementById('api-query');
    const tabs = document.querySelectorAll('.tab-btn');
    const container = document.getElementById('data-container');
    const loader = document.getElementById('data-loader');
    const controls = document.getElementById('data-filters');
    const searchInput = document.getElementById('data-search');
    const countText = document.getElementById('data-count');
    
    // Modal Elements
    const modal = document.getElementById('explorer-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // State
    let currentResource = 'posts';
    let rawData = null;
    let isRawJsonView = false;
    let limit = 10;
    
    const BASE_URL = 'https://jsonplaceholder.typicode.com';

    // ---- Event Listeners: Tabs ----
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentResource = e.target.dataset.resource;
            resetExplorer();
        });
    });

    // ---- Event Listeners: Buttons ----
    btnFetch.addEventListener('click', () => fetchExplorerData(false));
    inputQuery.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchExplorerData(false); });
    
    btnReset.addEventListener('click', resetExplorer);
    
    btnLoadSample.addEventListener('click', () => {
        inputQuery.value = ''; // Fetch pure resource
        fetchExplorerData(false);
    });

    btnLoadMore.addEventListener('click', () => {
        limit += 10;
        fetchExplorerData(true);
    });

    btnViewJson.addEventListener('click', toggleRawJson);
    btnCopyJson.addEventListener('click', () => {
        if (rawData) copyToClipboard(JSON.stringify(rawData, null, 2), 'Copied Raw JSON');
    });

    // ---- Search Filter ----
    searchInput.addEventListener('input', (e) => {
        if (!rawData) return;
        const query = e.target.value.toLowerCase();
        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        const filtered = dataArray.filter(item => JSON.stringify(item).toLowerCase().includes(query));
        renderContent(filtered, true); // true = skip generic search format reset
    });

    // ---- Core Fetch Logic ----
    async function fetchExplorerData(isLoadMore = false) {
        let endpoint = `/${currentResource}`;
        const queryVal = inputQuery.value.trim();

        if (queryVal) {
            if (/^\d+$/.test(queryVal)) endpoint += `/${queryVal}`;
            else if (queryVal.startsWith('?')) endpoint += queryVal;
            else if (queryVal.startsWith('/')) endpoint += queryVal;
            else endpoint += `/${queryVal}`;
        }

        // Apply pagination if fetching array
        const finalUrl = endpoint.includes('?') 
            ? `${BASE_URL}${endpoint}&_limit=${limit}`
            : `${BASE_URL}${endpoint}?_limit=${limit}`;

        try {
            setLoadingState(true);
            const response = await fetch(finalUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            rawData = await response.json();
            
            isRawJsonView = false;
            btnViewJson.disabled = false;
            btnCopyJson.disabled = false;
            btnViewJson.innerHTML = '<i class="fa-solid fa-code"></i>';
            searchInput.value = '';
            
            renderContent(rawData);
            
            // Show/Hide Load More
            if (Array.isArray(rawData) && rawData.length === limit) {
                paginationFooter.style.display = 'block';
            } else {
                paginationFooter.style.display = 'none';
            }

            // Only show toast if not just loading more
            if (!isLoadMore) showToast(`Fetched ${currentResource} successfully`, ToastType.SUCCESS);
        } catch (error) {
            console.error('Explorer API Error:', error);
            showErrorState();
            showToast('Failed to fetch API data', ToastType.ERROR);
        } finally {
            setLoadingState(false);
        }
    }

    // ---- Render Dispatcher ----
    function renderContent(data, isFiltered = false) {
        container.innerHTML = '';
        controls.style.display = 'flex';
        
        const dataArray = Array.isArray(data) ? data : [data];
        countText.textContent = `Showing ${dataArray.length} results`;

        if (dataArray.length === 0 || Object.keys(dataArray[0]).length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-magnifying-glass-minus"></i>
                    <p>No results found for endpoint</p>
                </div>
            `;
            return;
        }

        if (isRawJsonView) {
            container.innerHTML = `<pre class="raw-json-view"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
            return;
        }

        // Route to specific renderers
        dataArray.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-item';

            if (currentResource === 'posts') renderPost(card, item);
            else if (currentResource === 'comments') renderComment(card, item);
            else if (currentResource === 'albums') renderAlbum(card, item);
            else if (currentResource === 'photos') renderPhoto(card, item);
            else if (currentResource === 'todos') renderTodo(card, item);
            else if (currentResource === 'users') renderUser(card, item);
            else renderGeneric(card, item);

            container.appendChild(card);
        });
    }

    // ---- Specific Renderers ----
    function renderPost(card, item) {
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; gap: 0.5rem;">
                <h4>${item.title || 'Untitled'}</h4>
                <span class="badge info" style="white-space: nowrap;">ID: ${item.id}</span>
            </div>
            <p>${item.body || ''}</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-outline expand-btn relation-btn" data-type="posts" data-id="${item.id}" data-rel="comments">View Comments</button>
            </div>
        `;
        attachRelationEvent(card);
    }

    function renderComment(card, item) {
        card.innerHTML = `
            <h4><i class="fa-regular fa-comment"></i> ${item.name || 'Anonymous'}</h4>
            <span class="badge info" style="margin-bottom: 0.5rem;">${item.email || 'No email'}</span>
            <p>${item.body || ''}</p>
        `;
    }

    function renderAlbum(card, item) {
        card.innerHTML = `
            <h4><i class="fa-regular fa-images"></i> ${item.title || 'Untitled'}</h4>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-outline expand-btn relation-btn" data-type="albums" data-id="${item.id}" data-rel="photos">View Photos</button>
            </div>
        `;
        attachRelationEvent(card);
    }

    function renderPhoto(card, item) {
        card.className = 'data-item photo-card';
        card.innerHTML = `
            <img src="${item.thumbnailUrl}" alt="${item.title || 'Photo'}" loading="lazy">
            <h4 style="font-size: 0.85rem; margin-top:0.5rem;">${item.title || 'Untitled'}</h4>
        `;
        card.addEventListener('click', () => openModal(`<img src="${item.url}" style="width:100%; border-radius:8px;">`, 'Full Photo'));
    }

    function renderTodo(card, item) {
        const isCompleted = item.completed;
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap: 0.5rem;">
                <span class="badge ${isCompleted ? 'success' : 'error'}">
                    <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-xmark'}"></i>
                </span>
                <h4 style="margin:0; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7' : ''}">${item.title || 'Untitled'}</h4>
            </div>
        `;
    }

    function renderUser(card, item) {
        card.innerHTML = `
            <h4><i class="fa-solid fa-user"></i> ${item.name || 'Unknown'}</h4>
            <p style="margin-bottom:0.5rem;">@${item.username || 'unknown'}</p>
            <div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.85rem; color:var(--text-muted);">
                <span><i class="fa-solid fa-envelope"></i> ${item.email || 'N/A'}</span>
                <span><i class="fa-solid fa-phone"></i> ${item.phone ? item.phone.split(' ')[0] : 'N/A'}</span>
                <span><i class="fa-solid fa-building"></i> ${item.company ? item.company.name : 'N/A'}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-outline expand-btn relation-btn" data-type="users" data-id="${item.id}" data-rel="posts">View Posts</button>
                <button class="btn btn-outline expand-btn relation-btn" data-type="users" data-id="${item.id}" data-rel="albums">View Albums</button>
            </div>
        `;
        attachRelationEvent(card);
    }

    function renderGeneric(card, item) {
        card.innerHTML = `<pre style="font-size:0.8rem; overflow:hidden; white-space: pre-wrap;">${JSON.stringify(item).substring(0, 150)}...</pre>`;
    }

    // ---- Relational Data Handling ----
    function attachRelationEvent(card) {
        const btns = card.querySelectorAll('.relation-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const { type, id, rel } = e.target.dataset;
                try {
                    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    const res = await fetch(`${BASE_URL}/${type}/${id}/${rel}`);
                    const data = await res.json();
                    
                    let html = `<div style="display:flex; flex-direction:column; gap:1rem;">`;
                    if (data.length === 0) html += `<p>No ${rel} found.</p>`;
                    data.forEach(d => {
                        html += `<div style="background:rgba(0,0,0,0.2); padding:1rem; border-radius:8px; border:1px solid var(--card-border);">`;
                        if (d.name) html += `<h4>${d.name}</h4>`;
                        if (d.title) html += `<h4>${d.title}</h4>`;
                        if (d.body) html += `<p style="font-size:0.9rem; color:var(--text-muted);">${d.body}</p>`;
                        if (d.thumbnailUrl) html += `<img src="${d.thumbnailUrl}" width="100" style="border-radius:4px; margin-top:0.5rem;">`;
                        html += `</div>`;
                    });
                    html += `</div>`;
                    
                    openModal(html, `${type.charAt(0).toUpperCase() + type.slice(1)} ${id} - ${rel.charAt(0).toUpperCase() + rel.slice(1)}`);
                    e.target.innerHTML = `View ${rel.charAt(0).toUpperCase() + rel.slice(1)}`;
                } catch (err) {
                    showToast(`Failed to fetch ${rel}`, ToastType.ERROR);
                    e.target.innerHTML = `Error`;
                }
            });
        });
    }

    // ---- Modals ----
    function openModal(contentHtml, title = 'Details') {
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;
        modal.style.display = 'flex';
        // Trigger opacity transition
        setTimeout(() => modal.classList.add('show'), 10);
    }

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            modalBody.innerHTML = '';
        }, 300); // Matches transition duration
    }

    btnCloseModal.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // ---- UI State Helpers ----
    function setLoadingState(isLoading) {
        if (isLoading) {
            btnFetch.disabled = true;
            btnFetch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            container.innerHTML = '';
            controls.style.display = 'none';
            paginationFooter.style.display = 'none';
            loader.style.display = 'block';
        } else {
            btnFetch.disabled = false;
            btnFetch.innerHTML = '<i class="fa-solid fa-bolt"></i> Fetch';
            loader.style.display = 'none';
        }
    }

    function showErrorState() {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Failed to fetch data. Check endpoint.</p>
            </div>
        `;
        paginationFooter.style.display = 'none';
    }

    function resetExplorer() {
        inputQuery.value = '';
        rawData = null;
        isRawJsonView = false;
        limit = 10;
        searchInput.value = '';
        btnViewJson.disabled = true;
        btnCopyJson.disabled = true;
        btnViewJson.innerHTML = '<i class="fa-solid fa-code"></i>';
        controls.style.display = 'none';
        paginationFooter.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fa-solid fa-table-list"></i>
                <p>Select a resource and click Fetch</p>
            </div>
        `;
    }

    function toggleRawJson() {
        if (!rawData) return;
        isRawJsonView = !isRawJsonView;
        btnViewJson.innerHTML = isRawJsonView ? '<i class="fa-solid fa-table"></i>' : '<i class="fa-solid fa-code"></i>';
        renderContent(rawData);
    }

})();

// ---- Theme Toggle ----
const ThemeManager = (() => {
    const toggleBtn = document.getElementById('theme-toggle');
    const icon = toggleBtn.querySelector('i');
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        localStorage.setItem('theme', theme);
    }

    // Initial apply
    applyTheme(currentTheme);

    toggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });
})();

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

            const response = await fetch('https://official-joke-api.appspot.com/random_joke');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            currentJoke = `${data.setup} - ${data.punchline}`;

            loader.style.display = 'none';
            content.style.display = 'block';
            
            setupEl.textContent = data.setup;
            punchlineEl.innerHTML = '';

            // Delay punchline for comic effect, then type it out
            setTimeout(async () => {
                await typeWriter(data.punchline, punchlineEl, 60);
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

// ---- Feature 4: JSONPlaceholder Data Viewer ----
const DataAPI = (() => {
    const btnFetch = document.getElementById('btn-fetch-data');
    const selectResource = document.getElementById('data-resource');
    const container = document.getElementById('data-container');
    const loader = document.getElementById('data-loader');
    const controls = document.getElementById('data-filters');
    const searchInput = document.getElementById('data-search');
    const countText = document.getElementById('data-count');
    
    let allData = [];

    async function fetchData() {
        try {
            const resource = selectResource.value;
            
            btnFetch.disabled = true;
            btnFetch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
            
            container.innerHTML = '';
            controls.style.display = 'none';
            loader.style.display = 'block';

            const response = await fetch(`https://jsonplaceholder.typicode.com/${resource}?_limit=20`);
            if (!response.ok) throw new Error('API request failed');
            
            allData = await response.json();

            loader.style.display = 'none';
            controls.style.display = 'flex';
            
            renderData(allData, resource);
            searchInput.value = '';
            
            btnFetch.disabled = false;
            btnFetch.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Refresh';
            showToast(`Loaded ${allData.length} ${resource}`, ToastType.SUCCESS);

        } catch (error) {
            console.error('Data API Error:', error);
            loader.style.display = 'none';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Failed to fetch data. Please try again.</p>
                </div>
            `;
            btnFetch.disabled = false;
            btnFetch.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Try Again';
            showToast('Failed to fetch data', ToastType.ERROR);
        }
    }

    function renderData(data, resourceType) {
        container.innerHTML = '';
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-magnifying-glass-minus"></i>
                    <p>No results found</p>
                </div>
            `;
            countText.textContent = '0 results';
            return;
        }

        countText.textContent = `Showing ${data.length} results`;

        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'data-item';
            
            let title = '';
            let body = '';

            // Mapping different resource structures
            if (resourceType === 'posts') {
                title = item.title;
                body = item.body;
            } else if (resourceType === 'comments') {
                title = item.email;
                body = item.body;
            } else if (resourceType === 'albums') {
                title = item.title;
                body = `Album ID: ${item.id} | User ID: ${item.userId}`;
            } else if (resourceType === 'users') {
                title = item.name;
                body = `Email: ${item.email}<br>Company: ${item.company.name}<br>Website: ${item.website}`;
            }

            el.innerHTML = `
                <h4>${title}</h4>
                <p>${body}</p>
                <button class="expand-btn">Read More</button>
            `;

            // Expand / Collapse logic
            const btnExpand = el.querySelector('.expand-btn');
            if (resourceType === 'albums' || (body && body.length < 60)) {
                btnExpand.style.display = 'none'; // hide if text is short
            }

            btnExpand.addEventListener('click', () => {
                el.classList.toggle('expanded');
                btnExpand.textContent = el.classList.contains('expanded') ? 'Show Less' : 'Read More';
            });

            container.appendChild(el);
        });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allData.filter(item => {
            const resource = selectResource.value;
            if (resource === 'posts' || resource === 'albums') return item.title.toLowerCase().includes(query);
            if (resource === 'comments') return item.email.toLowerCase().includes(query) || item.body.toLowerCase().includes(query);
            if (resource === 'users') return item.name.toLowerCase().includes(query) || item.email.toLowerCase().includes(query);
            return false;
        });
        renderData(filtered, selectResource.value);
    });

    btnFetch.addEventListener('click', fetchData);
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

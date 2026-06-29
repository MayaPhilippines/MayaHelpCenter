// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAK5I_7WeKouFM08SeOZcDHrXsgckYoULg",
    authDomain: "get100-8333e.firebaseapp.com",
    databaseURL: "https://get100-8333e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "get100-8333e",
    storageBucket: "get100-8333e.firebasestorage.app",
    messagingSenderId: "242341429618",
    appId: "1:242341429618:web:c596b279f746dc22851deb",
    measurementId: "G-Y8TW2M3494"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const linkInput = document.getElementById('linkInput');
const deployBtn = document.getElementById('deployBtn');
const linksList = document.getElementById('linksList');
const totalLinksEl = document.getElementById('totalLinks');
const totalClicksEl = document.getElementById('totalClicks');
const activeLinksEl = document.getElementById('activeLinks');
const linkCountEl = document.getElementById('linkCount');

// Generate short hash
function generateHash(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hashStr = Math.abs(hash).toString(36).substring(0, 8);
    return `#${hashStr}`;
}

// Show toast notification
function showToast(message, isError = false) {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    if (isError) {
        toast.style.borderColor = 'rgba(255, 50, 50, 0.15)';
    }
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideDown 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Deploy new link
function deployLink() {
    const url = linkInput.value.trim();
    
    if (!url) {
        showToast('⚠️ Please enter a valid URL', true);
        return;
    }
    
    try {
        new URL(url);
    } catch {
        showToast('⚠️ Please enter a valid URL format (include https://)', true);
        return;
    }
    
    const hash = generateHash(url);
    const linkId = database.ref('links').push().key;
    
    const linkData = {
        url: url,
        hash: hash,
        clicks: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    database.ref('links/' + linkId).set(linkData)
        .then(() => {
            showToast('✅ Link deployed successfully!');
            linkInput.value = '';
            loadLinks();
        })
        .catch((error) => {
            showToast('❌ Error deploying link: ' + error.message, true);
        });
}

// Delete link
function deleteLink(linkId) {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    database.ref('links/' + linkId).remove()
        .then(() => {
            showToast('🗑️ Link deleted successfully');
            loadLinks();
        })
        .catch((error) => {
            showToast('❌ Error deleting link: ' + error.message, true);
        });
}

// Load links from Firebase
function loadLinks() {
    database.ref('links').orderByChild('createdAt').on('value', (snapshot) => {
        const links = snapshot.val();
        const linksListEl = document.getElementById('linksList');
        let totalLinks = 0;
        let totalClicks = 0;
        let activeLinks = 0;
        
        if (!links) {
            linksListEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔗</span>
                    <p>No links deployed yet</p>
                    <span class="empty-sub">Add a link using the form above</span>
                </div>
            `;
            updateStats(0, 0, 0);
            return;
        }
        
        let html = '';
        const linkIds = Object.keys(links);
        
        linkIds.forEach((id) => {
            const link = links[id];
            totalLinks++;
            totalClicks += link.clicks || 0;
            activeLinks++;
            
            const displayHash = link.hash || generateHash(link.url);
            
            html += `
                <div class="link-item" data-id="${id}">
                    <div class="link-info">
                        <span class="link-hash">${displayHash}</span>
                        <div class="link-clicks">
                            👆 <span class="click-count">${link.clicks || 0}</span>
                        </div>
                    </div>
                    <div class="link-actions">
                        <button class="delete-btn" onclick="deleteLink('${id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        
        linksListEl.innerHTML = html;
        updateStats(totalLinks, totalClicks, activeLinks);
        linkCountEl.textContent = `${totalLinks} links`;
    });
}

// Update stats dashboard
function updateStats(totalLinks, totalClicks, activeLinks) {
    totalLinksEl.textContent = totalLinks;
    totalClicksEl.textContent = totalClicks;
    activeLinksEl.textContent = activeLinks;
}

// ========== EVENT LISTENERS ==========
deployBtn.addEventListener('click', deployLink);

linkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        deployLink();
    }
});

// ========== INITIALIZE ==========
loadLinks();

// Make deleteLink available globally
window.deleteLink = deleteLink;

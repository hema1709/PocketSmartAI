async function call(url, options = {}) {
    options.headers = options.headers || {};

    // Attach the auth token so the backend lets us view history
    const token = localStorage.getItem("pocketsmart_token");
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, options);
    return res.json();
}

// Fetch and render the recommendation history list
(async () => {
    const container = document.getElementById("historyContainer") || document.getElementById("result");
    try {
        const data = await call("/api/history"); // Adjust endpoint to match your main.py router path if needed
        if (data && data.length > 0) {
            container.innerHTML = data.map(item => `
                <div class="card" style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3>${item.room_type || item.title || 'Recommendation'}</h3>
                    <p><strong>Budget:</strong> ₹${item.budget}</p>
                    <p>${item.recommendation_text || item.result || ''}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p>No recommendation history found.</p>";
        }
    } catch (err) {
        if (container) container.textContent = "Failed to load history: " + err;
    }

    // Set up functioning logout button action
    const logoutBtn = document.getElementById("logoutBtn") || document.querySelector("a[href*='logout']") || document.getElementsByClassName("Logout")[0];
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("pocketsmart_token"); // Wipe session token
            window.location.href = "/static/auth.html";    // Send back to login screen
        });
    }
})();
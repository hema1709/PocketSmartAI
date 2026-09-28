const result = document.getElementById("result");
const tabs = document.querySelectorAll(".tab");
tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove("active")); t.classList.add("active");
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(t.dataset.target).classList.remove("hidden");
});
async function call(url, options) { return fetch(url, options); }
//function render(data) {
//result.innerHTML = `<div class="card"><h2>Recommendations</h2><p class="meta">AI used: ${data.ai_used ? "Yes" : "No — local fallback mode"}</p><pre>${JSON.stringify(data.allocations, null, 2)}</pre>${data.recommendations.map(r => `<article class="rec"><strong>${r.category}</strong><p>${r.suggestion}</p><p>Estimated: ₹${Number(r.estimated_price).toLocaleString("en-IN")}</p><a href="${r.link}" target="_blank" rel="noopener noreferrer">${r.platform} search</a></article>`).join("")}</div>`;
//}
function render(data) {
    if (!data) {
        result.innerHTML = `<div class="card"><h2>Error</h2><p>No data received from server.</p></div>`;
        return;
    }

    // Determine the AI label indicator state
    const aiUsedText = data.ai_used ? "Yes" : "No (local fallback)";

    // Handle Case 1: Backend returned an object with a content/text string directly
    let outputContent = "";
    if (data.recommendations) {
        outputContent = `<p>${data.recommendations}</p>`;
    } else if (data.text) {
        outputContent = `<p>${data.text}</p>`;
    } else if (typeof data.result === 'string') {
        outputContent = `<p>${data.result}</p>`;
    }
    // Handle Case 2: Backend returned an array of structured items
    else if (Array.isArray(data)) {
        outputContent = data.map(item => `
            <div class="recommendation-item" style="margin-top: 10px; padding: 10px; border-bottom: 1px dashed #eee;">
                <strong>${item.name || item.item || 'Suggested Item'}:</strong> ${item.description || item.notes || ''}
            </div>
        `).join('');
    }
    // Fallback Case: Turn whatever object structure is sent directly into text string display
    else {
        if (data && typeof data.text === 'function') {
            outputContent = `<p>The server returened a rawresponsestream. Please check backend logs.</p>`;
        } else {
            outputContent = `<p>${data.recommendation_text || JSON.stringify(data)}</p>`;
        }
    }

    // Paint the clean results card element layout onto the page container
    result.innerHTML = `
        <div class="card" style="margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h2>Recommendations</h2>
            <p class="meta" style="font-size: 0.85em; color: #666;">AI Used: ${aiUsedText}</p>
            <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;">
            <div class="content-body">${outputContent}</div>
        </div>
    `;
}

document.getElementById("homeForm").onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    const items = (f.get("items") || "").split("\n").filter(Boolean).map(line => { const [category, quantity, notes = ""] = line.split(","); return { category: category.trim(), quantity: Number(quantity) || 1, notes: notes.trim() }; });
    //try { call("/generate-home", { method: "POST", body: JSON.stringify({ budget: Number(f.get("budget")), room_type: f.get("room_type"), style: f.get("style"), items }) }).then(res => res.json()).then(render) } catch (err) { result.textContent = err.message; }
    try {
        const data = await call("/generate-home", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                budget: Number(f.get("budget")),
                room_type: f.get("room_type"),
                style: f.get("style"),
                items: items
            })
        });
        render(data);
    } catch (err) {
        result.textContent = "Error: " + err;
    }
};
document.getElementById("partyForm").onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    const body = Object.fromEntries(f.entries()); body.budget = Number(body.budget); body.guest_count = Number(body.guest_count);
    try { call("/generate-party", { method: "POST", body: JSON.stringify(body) }).then(res => res.json()).then(render) } catch (err) { result.textContent = err.message; }
};
document.getElementById("jewelryForm").onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(e.target);
    try { call("/generate-jewelry", { method: "POST", body: fd }).then(res => res.json()).then(render) } catch (err) { result.textContent = err.message; }
};
(async () => { try { const s = await call("/session-info", { headers: {} }); document.getElementById("loginState").textContent = `Logged in as ${s.username}`; } catch { document.getElementById("loginState").innerHTML = `Please <a href="/static/auth.html">log in</a> before generating recommendations.`; } })
const logoutBtn = document.getElementById("logoutBtn") || document.querySelector("a[href*='logout']") || document.getElementsByClassName("Logout")[0];
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("pocketsmart_token");
        window.location.href = "/static/auth.html";
    }
    )
};

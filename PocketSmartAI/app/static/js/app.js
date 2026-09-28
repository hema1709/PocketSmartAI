const result = document.getElementById("result");
const tabs = document.querySelectorAll(".tab");

// Manage UI panel swapping actions seamlessly
tabs.forEach(t => t.onclick = () => {
  tabs.forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(t.dataset.target).classList.remove("hidden");
});

// Clean fetch wrapper that automatically grabs your login access token
async function call(url, options = {}) {
  options.headers = options.headers || {};

  // Automatically fetch and inject the access token we saved during login
  const token = localStorage.getItem("pocketsmart_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, options);
  return res.json();
}

// Robust layout parser engine to securely process server responses
function render(data) {
  if (!data) {
    result.innerHTML = `<div class="card"><h2>Error</h2><p>No recommendations returned.</p></div>`;
    return;
  }

  const aiUsedText = data.ai_used ? "Yes" : "No";
  let outputContent = "";

  // Check if the server returned the expected "recommendations" array block
  if (data.recommendations && Array.isArray(data.recommendations)) {
    outputContent = `
          <div style="overflow-x: auto; margin-top: 15px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: sans-serif; font-size: 0.95em;">
                  <thead>
                      <tr style="background-color: #f2f2f2; border-bottom: 2px solid #ddd;">
                          <th style="padding: 10px; border: 1px solid #ddd;">Category</th>
                          <th style="padding: 10px; border: 1px solid #ddd;">Suggestion</th>
                          <th style="padding: 10px; border: 1px solid #ddd;">Est. Price</th>
                          <th style="padding: 10px; border: 1px solid #ddd;">Platform</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${data.recommendations.map(item => `
                          <tr style="border-bottom: 1px solid #eee;">
                              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.category || ""}</td>
                              <td style="padding: 10px; border: 1px solid #ddd;">${item.suggestion || ""}</td>
                              <td style="padding: 10px; border: 1px solid #ddd; color: #2e7d32; font-weight: bold;">₹${item.estimated_price || "0"}</td>
                              <td style="padding: 10px; border: 1px solid #ddd; font-style: italic; color: #555;">${item.platform || "N/A"}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
      `;
  }
  // Fallback: If it's a direct string message or an alternative layout object
  else if (typeof data.recommendations === 'string') {
    outputContent = `<p>${data.recommendations}</p>`;
  } else if (data.text) {
    outputContent = `<p>${data.text}</p>`;
  } else {
    outputContent = `<p style="color: #666; font-style: italic;">No structured array recommendations found. Server returned: ${JSON.stringify(data)}</p>`;
  }

  // Paint the beautifully styled final output dashboard onto the user screen
  result.innerHTML = `
      <div class="card" style="margin-top: 20px; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="margin-top: 0; color: #333;">PocketSmart AI Budget Recommendations</h2>
          <p class="meta" style="font-size: 0.85em; color: #777; margin-bottom: 15px;">AI Generation Status: <strong>${aiUsedText}</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0 20px 0;">
          <div class="content-body">${outputContent}</div>
      </div>
  `;
}

// Home Form submit handling mapping
document.getElementById("homeForm").onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const itemsText = f.get("items") || "";
  const items = itemsText.split("\n").filter(Boolean).map(line => {
    const [category, quantity, notes = ""] = line.split(",");
    return { category, quantity: Number(quantity) || 1, notes: notes.trim() };
  });

  try {
    const data = await call("/generate-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget: Number(f.get("budget")), room_type: f.get("room_type"), style: f.get("style"), items })
    });
    render(data);
  } catch (err) {
    result.textContent = "Error: " + err;
  }
};

// Party Form submit handling mapping
document.getElementById("partyForm").onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = Object.fromEntries(f.entries());
  body.budget = Number(body.budget);
  body.guest_count = Number(body.guest_count);
  try {
    const data = await call("/generate-party", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    render(data);
  } catch (err) { result.textContent = "Error: " + err; }
};

// Jewelry Form submit handling mapping
document.getElementById("jewelryForm").onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);

  // Check if the image file input is empty, and clear it to prevent 400 errors
  const imageFile = fd.get("image");
  if (!imageFile || imageFile.size === 0 || imageFile.name === "") {
    fd.delete("image");
  }

  try {
    const data = await call("/generate-jewelry", {
      method: "POST",
      // Do NOT specify 'Content-Type' header here; FormData sets boundary automatically
      body: fd
    });
    render(data);
  } catch (err) {
    result.textContent = "Error: " + err;
  }
};

// Self-loading workspace configurations initialization setup
(async () => {
  try {
    const s = await call("/session-info");
    const loginStateEl = document.getElementById("loginState");
    if (loginStateEl) {
      loginStateEl.textContent = s.logged_in ? `Logged in as ${s.username}` : "Please log in before generating recommendations.";
    }
  } catch (err) { console.error("Session sync issue:", err); }

  const logoutBtn = document.getElementById("logoutBtn") || document.querySelector("a[href*='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("pocketsmart_token");
      window.location.href = "/static/auth.html";
    });
  }
})();

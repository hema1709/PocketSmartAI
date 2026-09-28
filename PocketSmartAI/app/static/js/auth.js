document.getElementById("loginForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const message = document.getElementById("authMessage") || document.getElementById("message") || { textContent: "" };
    message.textContent = "Logging in...";

    // Smart value collector: Finds the first text input and first password input in the login form
    const usernameInput = e.target.querySelector('input[type="text"]') || e.target.querySelector('input:not([type="password"])');
    const passwordInput = e.target.querySelector('input[type="password"]');

    const usernameValue = usernameInput ? usernameInput.value.trim() : "";
    const passwordValue = passwordInput ? passwordInput.value : "";

    // Build the URL-encoded body explicitly mapping the correct keys FastAPI expects
    const formBody = new URLSearchParams();
    formBody.append("username", usernameValue);
    formBody.append("password", passwordValue);

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formBody
        });

        const data = await response.json();

        if (!response.ok) {
            if (Array.isArray(data.detail)) {
                const errorMessages = data.detail.map(err => `${err.loc.join('.')} : ${err.msg}`).join(', ');
                throw new Error("Validation Error: " + errorMessages);
            }
            throw new Error(data.detail || "Incorrect username or password.");
        }

        if (data && data.access_token) {
            localStorage.setItem("pocketsmart_token", data.access_token);
            window.location.href = "/static/planner.html";
        } else {
            throw new Error("Invalid token format received from the server.");
        }
    } catch (err) {
        message.textContent = err.message;
    }
});

document.getElementById("registerForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const message = document.getElementById("authMessage") || document.getElementById("message") || { textContent: "" };

    // Smart collector for the registration block fields
    const inputs = Array.from(e.target.querySelectorAll('input'));
    const username = inputs.find(i => i.type === 'text')?.value || "";
    const email = inputs.find(i => i.type === 'email')?.value || "";
    const password = inputs.find(i => i.type === 'password')?.value || "";

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            if (Array.isArray(data.detail)) {
                const errorMessages = data.detail.map(err => `${err.loc.join('.')} : ${err.msg}`).join(', ');
                throw new Error("Validation Error: " + errorMessages);
            }
            throw new Error(data.detail || "Registration failed.");
        }
        message.textContent = "Registration successful! Please log in.";
    } catch (err) {
        message.textContent = err.message;
    }
});
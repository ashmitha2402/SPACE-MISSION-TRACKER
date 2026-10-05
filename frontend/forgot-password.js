const forgotPasswordForm = document.getElementById("forgot-password-form");
const forgotPasswordStatus = document.getElementById("forgot-password-status");

if (forgotPasswordForm && forgotPasswordStatus) {
    forgotPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("reset-email");
        const email = (emailInput?.value || "").trim();

        if (!email) {
            forgotPasswordStatus.textContent = "Please enter a valid email address.";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            forgotPasswordStatus.textContent = data.message || "If an account exists for that email, a password reset link has been sent.";
            forgotPasswordForm.reset();
        } catch (error) {
            console.error("Password reset request failed:", error);
            forgotPasswordStatus.textContent = "The reset service is currently unavailable. Please try again later.";
        }
    });
}

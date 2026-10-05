const resetPasswordForm = document.getElementById("reset-password-form");
const resetStatus = document.getElementById("reset-status");

if (resetPasswordForm && resetStatus) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        resetStatus.textContent = "The reset token is missing or invalid. Please request a new password reset link.";
    }

    resetPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const password = document.getElementById("new-password")?.value || "";
        const confirmPassword = document.getElementById("confirm-password")?.value || "";

        if (!token) {
            resetStatus.textContent = "The reset token is missing or invalid. Please request a new password reset link.";
            return;
        }

        if (password.length < 8) {
            resetStatus.textContent = "Password must be at least 8 characters long.";
            return;
        }

        if (password !== confirmPassword) {
            resetStatus.textContent = "Passwords do not match.";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password, confirmPassword })
            });

            const data = await response.json();
            resetStatus.textContent = data.message || "Your password has been reset successfully.";
            if (response.ok) {
                resetPasswordForm.reset();
            }
        } catch (error) {
            console.error("Password reset failed:", error);
            resetStatus.textContent = "The password reset request failed. Please try again later.";
        }
    });
}

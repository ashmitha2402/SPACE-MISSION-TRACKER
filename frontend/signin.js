const signInForm = document.getElementById("signin-form");
const authStatus = document.getElementById("auth-status");
const forgotLink = document.querySelector('.auth-links a[href="forgot-password.html"]');
const createAccountLink = document.querySelector('.auth-links a[href="create-account.html"]');

if (forgotLink) {
    forgotLink.setAttribute("href", "forgot-password.html");
}

if (createAccountLink) {
    createAccountLink.setAttribute("href", "create-account.html");
}

if (signInForm && authStatus) {
    signInForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("email-or-user");
        const passwordInput = document.getElementById("password");

        const hasValue = Boolean(
            (emailInput && emailInput.value && emailInput.value.trim()) ||
            (passwordInput && passwordInput.value && passwordInput.value.trim())
        );

        if (!hasValue) {
            authStatus.textContent = "Please enter an email/username and password to continue.";
            return;
        }

        authStatus.textContent = "This sign-in form is front-end only. Real authentication still needs a backend or authentication provider before it can securely log users in.";
        signInForm.reset();
    });
}

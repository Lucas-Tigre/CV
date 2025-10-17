document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const startGamePrompt = document.getElementById('start-game-prompt');

    // Formulários
    const mainLoginForm = document.getElementById('main-login-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const allForms = [loginForm, registerForm, forgotPasswordForm];

    // Links de Navegação do Modal
    const showRegisterLink = document.getElementById('show-register-link');
    const showForgotPasswordLink = document.getElementById('show-forgot-password-link');
    const showLoginFromRegister = document.getElementById('show-login-link-from-register');
    const showLoginFromForgot = document.getElementById('show-login-link-from-forgot');

    // --- Estado da Aplicação ---
    let isLoggedIn = false;

    // --- Funções ---

    /** Mostra o formulário especificado e esconde os outros. */
    function showForm(formToShow) {
        allForms.forEach(form => {
            if (form) form.style.display = 'none';
        });
        if (formToShow) formToShow.style.display = 'block';
    }

    /** Abre o modal de autenticação. */
    function openModal() {
        if (loginModal) {
            loginModal.style.display = 'flex';
            showForm(loginForm); // Sempre mostra o formulário de login ao abrir
        }
    }

    /** Fecha o modal de autenticação. */
    function closeModal() {
        if (loginModal) loginModal.style.display = 'none';
    }

    /** Atualiza a UI principal após um login bem-sucedido. */
    function updateUIAfterLogin(username) {
        if (startGameBtn) startGameBtn.disabled = false;
        if (loginTriggerBtn) {
            loginTriggerBtn.textContent = `👤 ${username}`;
            loginTriggerBtn.disabled = true;
        }
        if (startGamePrompt) {
            startGamePrompt.textContent = 'Universo aguardando. Pressione Iniciar!';
        }
        closeModal();
    }

    /** Valida a senha com base nos critérios definidos. */
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) errors.push("Pelo menos 8 caracteres.");
        if (!/[a-z]/.test(password)) errors.push("Pelo menos 1 letra minúscula.");
        if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula.");
        if (!/[@$!%*?&]/.test(password)) errors.push("Pelo menos 1 símbolo (@$!%*?&).");
        return errors;
    }

    /** Lida com a submissão de um formulário de login. */
    function handleLogin(event, usernameInput, passwordInput, errorElement) {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const validationErrors = validatePassword(password);

        if (username && validationErrors.length === 0) {
            isLoggedIn = true;
            localStorage.setItem('username', username);
            updateUIAfterLogin(username);
        } else {
            errorElement.textContent = !username ? 'Por favor, insira um nome de usuário.' : 'Senha inválida: ' + validationErrors.join(' ');
        }
    }

    // --- Event Listeners ---
    if (mainLoginForm) {
        const usernameInput = document.getElementById('main-login-username');
        const passwordInput = document.getElementById('main-login-password');
        const errorElement = document.getElementById('main-password-error');
        mainLoginForm.addEventListener('submit', (e) => handleLogin(e, usernameInput, passwordInput, errorElement));
    }

    if (loginForm) {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const errorElement = document.getElementById('password-error');
        loginForm.addEventListener('submit', (e) => handleLogin(e, usernameInput, passwordInput, errorElement));
    }

    if (loginTriggerBtn) loginTriggerBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (loginModal) loginModal.addEventListener('click', (e) => { if (e.target === loginModal) closeModal(); });

    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showForm(registerForm); });
    if (showForgotPasswordLink) showForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showForm(forgotPasswordForm); });
    if (showLoginFromRegister) showLoginFromRegister.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });
    if (showLoginFromForgot) showLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Conta criada com sucesso! (Simulação). Agora faça o login.');
            showForm(loginForm);
        });
    }
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Link de recuperação enviado para o seu email. (Simulação)');
            closeModal();
        });
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (isLoggedIn) window.location.href = 'game.html';
        });
    }
});

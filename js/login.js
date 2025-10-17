document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const startGamePrompt = document.getElementById('start-game-prompt');

    // Formulários
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const allForms = [loginForm, registerForm, forgotPasswordForm];

    // Links de Navegação do Modal
    const showRegisterLink = document.getElementById('show-register-link');
    const showForgotPasswordLink = document.getElementById('show-forgot-password-link');
    const showLoginFromRegister = document.getElementById('show-login-link-from-register');
    const showLoginFromForgot = document.getElementById('show-login-link-from-forgot');

    // Inputs e Erros
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const passwordError = document.getElementById('password-error');

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
        if (passwordError) passwordError.textContent = ''; // Limpa os erros ao fechar
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

    // --- Event Listeners ---

    // Abre o modal ao clicar no botão de login
    if (loginTriggerBtn) loginTriggerBtn.addEventListener('click', openModal);

    // Fecha o modal ao clicar no 'X'
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    // Fecha o modal ao clicar fora da área de conteúdo
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal();
        });
    }

    // Navegação entre formulários
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showForm(registerForm); });
    if (showForgotPasswordLink) showForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showForm(forgotPasswordForm); });
    if (showLoginFromRegister) showLoginFromRegister.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });
    if (showLoginFromForgot) showLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });

    // Lógica de submissão do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;
            const validationErrors = validatePassword(password);

            if (username && validationErrors.length === 0) {
                isLoggedIn = true;
                localStorage.setItem('username', username);
                updateUIAfterLogin(username);
            } else {
                passwordError.textContent = !username ? 'Por favor, insira um nome de usuário.' : 'Senha inválida: ' + validationErrors.join(' ');
            }
        });
    }

    // Lógica (simulada) para os outros formulários
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

    // Lógica do botão de iniciar o jogo
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (isLoggedIn) window.location.href = 'game.html';
        });
    }
});

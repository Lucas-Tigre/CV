document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    const startGameBtn = document.getElementById('start-game-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');

    // Formulários e Links
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link-from-register');

    /** Mostra o formulário especificado dentro do modal. */
    function showForm(formToShow) {
        [loginForm, registerForm].forEach(form => {
            if (form) form.style.display = 'none';
        });
        if (formToShow) formToShow.style.display = 'block';
    }

    /** Inicia o jogo escondendo o login e mostrando o contêiner do jogo. */
    function startGame(username) {
        localStorage.setItem('username', username);
        if (loginContainer) loginContainer.style.display = 'none';
        if (loginModal) loginModal.style.display = 'none';
        if (gameContainer) gameContainer.style.display = 'block';
        // Simula o início do jogo (a lógica do game.js assumiria a partir daqui)
        console.log(`Jogo iniciado para o usuário: ${username}`);
    }

    // --- Event Listeners ---

    // Botão "Entrar ou Cadastrar" abre o modal de login
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'flex';
            showForm(loginForm);
        });
    }

    // Fecha o modal
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'none';
    });

    // Navegação entre login e cadastro
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showForm(registerForm); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });

    // Lógica de submissão do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            if (username) {
                startGame(username);
            }
        });
    }
});

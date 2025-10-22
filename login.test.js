describe('Formulário de Login', () => {
  it('deve ter um label de "E-mail"', () => {
    document.body.innerHTML = `
      <div id="login-pane">
        <form id="loginForm">
          <div class="field">
            <label for="loginUser">E-mail</label>
            <input id="loginUser">
          </div>
        </form>
      </div>
    `;
    const label = document.querySelector('#loginForm label');
    expect(label.textContent).toBe('E-mail');
  });
});

import { chromium } from 'playwright';
import http from 'http';
import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';

const PORT = 8080;

async function run() {
    // Iniciar um servidor web para servir os arquivos estáticos
    const serve = serveStatic('.', { 'index': ['game.html'] });
    const server = http.createServer(function(req, res) {
        serve(req, res, finalhandler(req, res));
    });
    server.listen(PORT);
    console.log(`Servidor rodando em http://localhost:${PORT}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Ouvir os logs do console
    page.on('console', msg => {
        console.log(`[CONSOLE] ${msg.text()}`);
    });

    try {
        await page.goto(`http://localhost:${PORT}/game.html`, { waitUntil: 'networkidle' });

        // Aguardar um pouco para que a lógica do jogo seja executada
        await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
        console.error('Erro ao carregar a página:', error);
    } finally {
        await browser.close();
        server.close();
        console.log('Servidor e navegador fechados.');
    }
}

run();

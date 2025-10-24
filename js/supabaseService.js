import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

// Cria o cliente Supabase apenas se as credenciais estiverem disponíveis e não forem placeholders.
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "https://koliolijmlzifxulyejz.supabase.co" && SUPABASE_ANON_KEY !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGlvbGlqbWx6aWZ4dWx5ZWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEwNDAsImV4cCI6MjA3Mzg2NzA0MH0.s44jYbJDjZqjKwPBCdsJ5WZhmXI9xVggxMgH7IKFGYE") {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Falha ao inicializar o Supabase. Verifique suas credenciais.", error);
    }
} else {
    console.warn("Credenciais do Supabase não encontradas. As funcionalidades do placar estão desativadas.");
}


/**
 * Envia a pontuação de um jogador para a tabela 'leaderboard'.
 * @param {string} username - O nome do jogador.
 * @param {number} score - A pontuação do jogador (partículas absorvidas).
 * @returns {Promise<object|null>} O resultado da inserção ou null em caso de erro.
 */
export async function submitScore(username, score) {
    if (!supabase) return null; // Não faz nada se o Supabase não foi inicializado

    if (!username || typeof score !== 'number') {
        console.error("Nome de usuário ou pontuação inválida.");
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .insert([{ username, score }]);

        if (error) {
            console.error('Erro ao enviar pontuação:', error);
            return null;
        }

        console.log('Pontuação enviada com sucesso:', data);
        return data;
    } catch (error) {
        console.error('Falha inesperada ao enviar pontuação:', error);
        return null;
    }
}

/**
 * Busca os 10 melhores jogadores da tabela 'leaderboard'.
 * @returns {Promise<Array<object>>} Uma lista com os melhores jogadores ou uma lista vazia em caso de erro.
 */
export async function getLeaderboard() {
    if (!supabase) return []; // Retorna uma lista vazia se o Supabase não foi inicializado

    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('username, score')
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Erro ao buscar placar:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Falha inesperada ao buscar placar:', error);
        return [];
    }
}

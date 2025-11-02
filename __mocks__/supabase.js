import { jest } from '@jest/globals';

const mockSupabaseClient = {
    // Os métodos encadeáveis retornam `this` para permitir o encadeamento.
    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    order: jest.fn(function() { return this; }),
    eq: jest.fn(function() { return this; }),
    select: jest.fn(function() { return this; }),
    // Os métodos finais que executam a consulta.
    upsert: jest.fn().mockResolvedValue({ data: 'upserted', error: null }),
    // O método `from` inicia a cadeia.
    from: jest.fn(function() { return this; }),
};

export const createClient = jest.fn(() => mockSupabaseClient);

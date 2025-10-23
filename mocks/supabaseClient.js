
import { jest } from '@jest/globals';

// mocks/supabaseClient.js

// Mock encadeável para simular a API do Supabase
const supabaseMock = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [{ username: 'MockUser', score: 100 }], error: null }),
};

export const createClient = jest.fn(() => supabaseMock);

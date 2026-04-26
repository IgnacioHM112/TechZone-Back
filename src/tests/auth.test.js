const request = require('supertest');
const app = require('../server');
const sequelize = require('../config/database');

describe('Auth Endpoints (Sequelize)', () => {
    
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: `test_${Date.now()}@example.com`,
                password: 'password123'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('userId');
    });

    it('should login an existing user', async () => {
        const email = `login_${Date.now()}@example.com`;
        
        // Registrar primero
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Login User',
                email: email,
                password: 'password123'
            });

        // Intentar login
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: email,
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    afterAll(async () => {
        await sequelize.close(); // Cerrar conexión de Sequelize
    });
});

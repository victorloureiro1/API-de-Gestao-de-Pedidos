const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'chave_secreta_super_segura_para_o_desafio'; // Em produção, usar variáveis de ambiente (.env)

// Middleware para processar JSON no body
app.use(express.json());

// ==========================================
// 1. CONFIGURAÇÃO DO BANCO DE DADOS (SQL)
// ==========================================
// Utilizando SQLite para facilitar a execução local sem necessidade de setups complexos de infraestrutura.
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        inicializarTabelas();
    }
});

function inicializarTabelas() {
    // Usamos aspas em "Order" pois ORDER é uma palavra reservada em bancos SQL.
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS "Order" (
                orderId TEXT PRIMARY KEY,
                value REAL NOT NULL,
                creationDate TEXT NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                orderId TEXT NOT NULL,
                productId INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY (orderId) REFERENCES "Order" (orderId) ON DELETE CASCADE
            )
        `);
    });
}
// ==========================================
// 2. CONFIGURAÇÃO DO SWAGGER (DOCUMENTAÇÃO)
// ==========================================
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Pedidos',
            version: '1.0.0',
            description: 'API para gerenciamento e transformação de pedidos (Desafio Jitterbit)',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['server.js'], // Lê as anotações neste mesmo arquivo
};

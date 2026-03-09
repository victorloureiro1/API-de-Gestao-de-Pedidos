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
// ==========================================
// 3. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
}
// ==========================================
// 4. ROTAS DA API
// ==========================================

/**
 * @swagger
 * /login:
 * post:
 * summary: Gera um token JWT para testes
 * responses:
 * 200:
 * description: Retorna o token JWT
 */
app.post('/login', (req, res) => {
    // Rota simplificada apenas para gerar um token e demonstrar o funcionamento do JWT
    const token = jwt.sign({ user: 'tester' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});
/**
 * Função utilitária para mapeamento/transformação dos dados (De-Para)
 */
function transformarPedido(payloadOrigem) {
    if (!payloadOrigem.numeroPedido || !payloadOrigem.valorTotal || !payloadOrigem.dataCriacao || !payloadOrigem.items) {
        throw new Error("Payload inválido. Faltam campos obrigatórios.");
    }

    return {
        orderId: payloadOrigem.numeroPedido,
        value: payloadOrigem.valorTotal,
        creationDate: payloadOrigem.dataCriacao,
        items: payloadOrigem.items.map(item => ({
            productId: parseInt(item.idItem, 10),
            quantity: item.quantidadeItem,
            price: item.valorItem
        }))
    };
}

/**
 * @swagger
 * /order:
 * post:
 * summary: Cria um novo pedido a partir do JSON em português
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * responses:
 * 201:
 * description: Pedido criado com sucesso (retorna o JSON mapeado)
 * 400:
 * description: Erro de validação
 */
app.post('/order', authenticateToken, (req, res) => {
    try {
        // Transformação dos dados
        const pedidoTransformado = transformarPedido(req.body);

        // Inserção no Banco de Dados (Transação simulada via serialização)
        db.serialize(() => {
            // Insere na Tabela Order
            const stmtOrder = db.prepare('INSERT INTO "Order" (orderId, value, creationDate) VALUES (?, ?, ?)');
            stmtOrder.run([pedidoTransformado.orderId, pedidoTransformado.value, pedidoTransformado.creationDate], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Pedido já existe na base de dados.' });
                    }
                    return res.status(500).json({ error: 'Erro ao salvar o pedido.' });
                }

                // Insere na Tabela Items
                const stmtItems = db.prepare('INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
                pedidoTransformado.items.forEach(item => {
                    stmtItems.run([pedidoTransformado.orderId, item.productId, item.quantity, item.price]);
                });
                stmtItems.finalize();

                // Retorna o JSON com o mapping correto
                return res.status(201).json(pedidoTransformado);
            });
            stmtOrder.finalize();
        });

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/list:
 * get:
 * summary: Lista todos os pedidos cadastrados
 * responses:
 * 200:
 * description: Lista de pedidos
 */
app.get('/order/list', authenticateToken, (req, res) => {
    db.all('SELECT * FROM "Order"', [], (err, orders) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
        if (orders.length === 0) return res.status(200).json([]);

        // Buscar itens para todos os pedidos
        db.all('SELECT * FROM Items', [], (err, items) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar itens.' });

            const pedidosCompletos = orders.map(order => {
                return {
                    ...order,
                    items: items.filter(item => item.orderId === order.orderId).map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        price: i.price
                    }))
                };
            });

            res.status(200).json(pedidosCompletos);
        });
    });
});

/**
 * @swagger
 * /order/{id}:
 * get:
 * summary: Retorna os dados de um pedido específico
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Dados do pedido
 * 404:
 * description: Pedido não encontrado
 */
app.get('/order/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM "Order" WHERE orderId = ?', [id], (err, order) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar o pedido.' });
        if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

        db.all('SELECT productId, quantity, price FROM Items WHERE orderId = ?', [id], (err, items) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar os itens do pedido.' });
            
            res.status(200).json({
                ...order,
                items: items
            });
        });
    });
});

/**
 * @swagger
 * /order/{id}:
 * put:
 * summary: Atualiza um pedido existente
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * responses:
 * 200:
 * description: Pedido atualizado
 */
app.put('/order/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    try {
        const pedidoTransformado = transformarPedido(req.body);

        // Verifica se os IDs batem
        if (id !== pedidoTransformado.orderId) {
            return res.status(400).json({ error: 'O ID da URL não corresponde ao número do pedido no body.' });
        }

        db.get('SELECT * FROM "Order" WHERE orderId = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ error: 'Erro ao validar existência do pedido.' });
            if (!row) return res.status(404).json({ error: 'Pedido não encontrado para atualização.' });

            db.serialize(() => {
                // Atualiza a tabela Order
                db.run('UPDATE "Order" SET value = ?, creationDate = ? WHERE orderId = ?', 
                    [pedidoTransformado.value, pedidoTransformado.creationDate, id]);

                // Exclui os itens antigos e insere os novos
                db.run('DELETE FROM Items WHERE orderId = ?', [id]);
                
                const stmtItems = db.prepare('INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
                pedidoTransformado.items.forEach(item => {
                    stmtItems.run([id, item.productId, item.quantity, item.price]);
                });
                stmtItems.finalize();

                res.status(200).json({ message: 'Pedido atualizado com sucesso.', pedido: pedidoTransformado });
            });
        });

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 * delete:
 * summary: Exclui um pedido
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Pedido deletado
 * 404:
 * description: Pedido não encontrado
 */
app.delete('/order/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM "Order" WHERE orderId = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro interno ao validar exclusão.' });
        if (!row) return res.status(404).json({ error: 'Pedido não encontrado.' });

        db.serialize(() => {
            // Deleta itens e depois o pedido (embora tenhamos ON DELETE CASCADE, fazemos manual para garantir na versão do sqlite)
            db.run('DELETE FROM Items WHERE orderId = ?', [id]);
            db.run('DELETE FROM "Order" WHERE orderId = ?', [id], function(err) {
                if (err) return res.status(500).json({ error: 'Erro ao excluir pedido.' });
                res.status(200).json({ message: 'Pedido excluído com sucesso.' });
            });
        });
    });
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` Documentação Swagger: http://localhost:${PORT}/api-docs`);
});
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const PORT = 3001; 
const SECRET_KEY = 'chave_secreta_super_segura_para_o_desafio'; 

app.use(express.json());

// ==========================================
// CONFIGURAÇÃO DO SWAGGER (DEFINIÇÃO DIRETA)
// ==========================================
// Definimos os caminhos aqui diretamente para evitar erros de parsing de comentários
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pedidos',
      version: '1.0.0',
      description: 'API para gerenciamento e transformação de pedidos',
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
    security: [{ bearerAuth: [] }],
    paths: {
      '/login': {
        post: {
          summary: 'Gera um token JWT para testes',
          responses: { 200: { description: 'Retorna o token JSON' } }
        }
      },
      '/order': {
        post: {
          summary: 'Cria um novo pedido (Transformação de Dados)',
          responses: { 201: { description: 'Pedido criado' } }
        }
      },
      '/order/list': {
        get: {
          summary: 'Lista todos os pedidos',
          responses: { 200: { description: 'Sucesso' } }
        }
      },
      '/order/{id}': {
        get: {
          summary: 'Obtém um pedido específico',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sucesso' } }
        },
        put: {
          summary: 'Atualiza um pedido',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sucesso' } }
        },
        delete: {
          summary: 'Remove um pedido',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sucesso' } }
        }
      }
    }
  },
  apis: [], // Deixamos vazio para não tentar ler comentários do ficheiro
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ==========================================
// BANCO DE DADOS
// ==========================================
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (!err) {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS "Order" (orderId TEXT PRIMARY KEY, value REAL, creationDate TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS Items (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId TEXT, productId INTEGER, quantity INTEGER, price REAL)`);
    });
    console.log('Conectado ao SQLite.');
  }
});

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalido' });
    req.user = user;
    next();
  });
}

// ==========================================
// ROTAS
// ==========================================

app.get('/', (req, res) => {
  res.send('<h1>API Online</h1><a href="/api-docs">Ir para Swagger</a>');
});

app.post('/login', (req, res) => {
  const token = jwt.sign({ user: 'tester' }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

app.post('/order', authenticateToken, (req, res) => {
  const { numeroPedido, valorTotal, dataCriacao, items } = req.body;
  
  const mapped = {
    orderId: numeroPedido,
    value: valorTotal,
    creationDate: dataCriacao,
    items: items.map(i => ({ productId: parseInt(i.idItem), quantity: i.quantidadeItem, price: i.valorItem }))
  };

  db.serialize(() => {
    db.run('INSERT INTO "Order" (orderId, value, creationDate) VALUES (?, ?, ?)', [mapped.orderId, mapped.value, mapped.creationDate], (err) => {
      if (err) return res.status(400).json({ error: 'Pedido duplicado ou erro.' });
      const stmt = db.prepare('INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)');
      mapped.items.forEach(it => stmt.run([mapped.orderId, it.productId, it.quantity, it.price]));
      stmt.finalize();
      res.status(201).json(mapped);
    });
  });
});

app.get('/order/list', authenticateToken, (req, res) => {
  db.all('SELECT * FROM "Order"', (err, orders) => {
    db.all('SELECT * FROM Items', (err, items) => {
      const result = orders.map(o => ({
        ...o,
        items: items.filter(i => i.orderId === o.orderId).map(({productId, quantity, price}) => ({productId, quantity, price}))
      }));
      res.json(result);
    });
  });
});

app.get('/order/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM "Order" WHERE orderId = ?', [req.params.id], (err, order) => {
    if (!order) return res.status(404).json({ error: 'Nao encontrado' });
    db.all('SELECT productId, quantity, price FROM Items WHERE orderId = ?', [req.params.id], (err, items) => {
      res.json({ ...order, items });
    });
  });
});

app.put('/order/:id', authenticateToken, (req, res) => {
  db.run('UPDATE "Order" SET value = ? WHERE orderId = ?', [req.body.valorTotal, req.params.id], () => {
    res.json({ message: 'Atualizado' });
  });
});

app.delete('/order/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM Items WHERE orderId = ?', [req.params.id]);
  db.run('DELETE FROM "Order" WHERE orderId = ?', [req.params.id], () => {
    res.json({ message: 'Removido' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
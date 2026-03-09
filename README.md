# API de Gestão de Pedidos (Desafio Técnico - Jitterbit)

Esta API foi desenvolvida como parte de um desafio técnico focado em integração e transformação de dados. O sistema recebe pedidos via HTTP em formato JSON  e realiza o mapeamento para um esquema de banco de dados relacional.

##  Desenvolvedor
* **Nome:** Victor Loureiro
* **Formação:** Sistemas de Informação - UFJF
* **Perfil:** QA / Analista de Projetos

##  Tecnologias Utilizadas
* **Node.js (v24.14.0)**: Ambiente de execução Javascript.
* **Express**: Framework para roteamento e criação da API.
* **SQLite3**: Banco de dados relacional local (`database.sqlite`).
* **JWT (JSON Web Token)**: Segurança e controle de acesso às rotas.
* **Swagger UI**: Documentação interativa e ambiente de testes integrado.

##  Funcionalidades (CRUD)
A API opera na porta **3001** com os seguintes endpoints:

* **Criar Pedido (Obrigatório)**: `POST /order`
* **Obter Pedido por ID (Obrigatório)**: `GET /order/:numeroPedido`
* **Listar Pedidos (Opcional)**: `GET /order/list`
* **Atualizar Pedido (Opcional)**: `PUT /order/:numeroPedido`
* **Deletar Pedido (Opcional)**: `DELETE /order/:numeroPedido`

##  Mapping de Dados (De/Para)
A API realiza a transformação automática do payload de entrada para o banco de dados:

### Tabela: `Order`
| Campo Origem (JSON) | Campo Destino (SQL) | Tipo SQL |
| :--- | :--- | :--- |
| `numeroPedido` | `orderId` | TEXT (Primary Key) |
| `valorTotal` | `value` | REAL |
| `dataCriacao` | `creationDate` | TEXT |

### Tabela: `Items`
| Campo Origem (JSON) | Campo Destino (SQL) | Tipo SQL |
| :--- | :--- | :--- |
| `idItem` | `productId` | INTEGER |
| `quantidadeItem` | `quantity` | INTEGER |
| `valorUnitario` | `unitPrice` | REAL |

##  Como Executar o Projeto

Siga os comandos abaixo no seu terminal para configurar o ambiente:

1. **Configuração e Inicialização:**
```bash
# Clone o repositório
git clone [https://github.com/victorloureiro1/jitterbit-api-desafio.git](https://github.com/victorloureiro1/jitterbit-api-desafio.git)

# Acesse a pasta do projeto
cd Jitterbit-Teste

# Instale as dependências necessárias
npm install

# Inicie o servidor
npm start

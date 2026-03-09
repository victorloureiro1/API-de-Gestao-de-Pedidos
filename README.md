# API de Gestão de Pedidos (Desafio Técnico)

Esta API foi desenvolvida como parte de um desafio técnico para gerir pedidos. O sistema é responsável por receber um pedido HTTP com dados num formato JSON (com chaves em Português) e realizar a transformação (mapping) desses dados para um esquema de base de dados relacional (com colunas em Inglês).

##  Tecnologias Utilizadas

* **Node.js** com **Express**: Criação do servidor e roteamento da API.

* **SQLite3**: Base de dados relacional leve, a operar num ficheiro local (`database.sqlite`) para facilitar a execução e avaliação.

* **JWT (JSON Web Token)**: Implementação de segurança e controlo de acesso nas rotas.

* **Swagger UI**: Documentação interativa e ambiente de testes integrado.

##  Funcionalidades (CRUD)

A API possui os seguintes endpoints principais:

* `POST /login`: Gera um token JWT de autenticação (simulação de login para testes).

* `POST /order`: Recebe o payload do pedido original, realiza o mapping dos dados e guarda na base de dados.

* `GET /order/list`: Retorna a lista completa de todos os pedidos e os seus respetivos itens.

* `GET /order/{id}`: Retorna os dados detalhados de um pedido específico.

* `PUT /order/{id}`: Atualiza as informações de um pedido existente.

* `DELETE /order/{id}`: Remove um pedido e todos os seus itens associados (utilizando *Delete Cascade*).

##  Mapping de Dados (De/Para)

O requisito central da aplicação é a transformação do payload. A API realiza o seguinte mapeamento:

### Tabela: `Order`

| **Payload Recebido (Origem)** | **Base de Dados (Destino)** | **Tipo SQL** | 
| :--- | :--- | :--- |
| `numeroPedido` | `orderId` | TEXT (Primary Key) | 
| `valorTotal` | `value` | REAL | 
| `dataCriacao` | `creationDate` | TEXT | 

### Tabela: `Items` (Array)

| **Payload Recebido (Origem)** | **Base de Dados (Destino)** | **Tipo SQL** | 
| :--- | :--- | :--- |
| `idItem` | `productId` | INTEGER | 
| `quantidadeItem` | `quantity` | INTEGER | 
| `valorItem` | `price` | REAL | 

## 🛠️ Como Correr o Projeto Localmente

Siga as instruções abaixo para executar o projeto na sua máquina:

1. **Clonar o repositório:**

   ```bash
   git clone <https://github.com/victorloureiro1/API-de-Gestao-de-Pedidos>


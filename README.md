# API de Gestão de Pedidos (Desafio Técnico)

Esta API foi desenvolvida como parte de um desafio técnico para gerir pedidos. O sistema é responsável por receber um pedido HTTP com dados num formato JSON (com chaves em Português) e realizar a transformação (mapping) desses dados para um esquema de base de dados relacional (com colunas em Inglês).

##  Tecnologias Utilizadas

* **Node.js** com **Express**: Criação do servidor e roteamento da API.

* **SQLite3**: Base de dados relacional leve, a operar num ficheiro local (`database.sqlite`) para facilitar a execução e avaliação.

* **JWT (JSON Web Token)**: Implementação de segurança e controlo de acesso nas rotas.

* **Swagger UI**: Documentação interativa e ambiente de testes integrado.

##  Funcionalidades (CRUD)

Foram criados os endpoints para as seguintes operações solicitadas no desafio *(Nota: A API corre na porta 3001)*:

* **Criar um novo pedido. (Obrigatório)**

  * URL: `http://localhost:3001/order` (POST)

* **Obter os dados do pedido passando por parâmetro na URL o número do pedido. (Obrigatório)**

  * URL: `http://localhost:3001/order/v10089015vdb-01` (GET)

* **Listar todos os pedidos. (Opcional)**

  * URL: `http://localhost:3001/order/list` (GET)

* **Atualizar o pedido passando por parâmetro na url o número do pedido que será atualizado. (Opcional)**

  * URL: `http://localhost:3001/order/v10089015vdb-01` (PUT)

* **Delete o pedido passando por parâmetro na url o número do pedido que será deletado. (Opcional)**

  * URL: `http://localhost:3001/order/v10089015vdb-01` (DELETE)

##  Mapping de Dados (De/Para)

O requisito central da aplicação é a transformação do payload. A API realiza o seguinte mapeamento:

### Tabela: `Order`

| Payload Recebido (Origem) | Base de Dados (Destino) | Tipo SQL | 
| ----- | ----- | ----- | 
| `numeroPedido` | `orderId` | TEXT (Primary Key) | 
| `valorTotal` | `value` | REAL | 
| `dataCriacao` | `creationDate` | TEXT | 

### Tabela: `Items` (Array)

| Payload Recebido (Origem) | Base de Dados (Destino) | Tipo SQL | 
| ----- | ----- | ----- | 
| `idItem` | `productId` | INTEGER | 
| `quantidadeItem` | `quantity` | INTEGER | 
| `valorItem` | `price` | REAL | 

## 🛠️ Como Correr o Projeto Localmente

Siga as instruções abaixo para executar o projeto na sua máquina:

1. **Clonar o repositório:**

   ```bash
   git clone [https://github.com/victorloureiro1/API-de-Gestao-de-Pedidos.git](https://github.com/victorloureiro1/API-de-Gestao-de-Pedidos.git)

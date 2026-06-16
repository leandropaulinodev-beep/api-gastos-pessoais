# Meus Gastos - Controle Financeiro Pessoal

Esta é uma API REST desenvolvida em Java com Spring Boot para controle de despesas e receitas pessoais, integrada com um frontend dinâmico (Single Page Application) embutido no backend.

---

## Tecnologias e Bibliotecas

- **Backend**: Java 17, Spring Boot 3.0.0
- **Persistência**: Spring Data JPA, Hibernate, PostgreSQL
- **Mapeamento DTO**: ModelMapper 2.3.8
- **Segurança**: Spring Security, JWT (io.jsonwebtoken 0.11.5)
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6)
- **Banco de Dados Local**: Docker (PostgreSQL)

---

## Melhorias de Segurança Implementadas

- **Correção de Vazamento no Fluxo de Caixa**: 
  Identificamos e corrigimos uma falha de segurança no dashboard onde a consulta do fluxo de caixa (`/api/dashboard`) retornava os títulos de todos os usuários cadastrados no banco de dados.
  Agora, a consulta nativa filtra os lançamentos estritamente pelo ID do usuário atualmente autenticado:
  ```sql
  SELECT * FROM public.titulo WHERE id_usuario = :idUsuario AND data_vencimento BETWEEN ...
  ```
- **Testes Unitários**:
  Adicionamos testes unitários isolados mockando o contexto de segurança e repositórios para garantir o comportamento seguro sem depender do banco de dados ativo.

---

## Interface Gráfica (Frontend)

Criamos uma interface de usuário responsiva e estilizada com **Dark Mode Premium** e **Glassmorphism**, acessível diretamente na raiz do servidor web:
- **Autenticação**: Telas integradas de Login e Cadastro com armazenamento de JWT no `localStorage`.
- **Filtro de Datas**: Visualização dinâmica baseada no período inicial e final selecionado.
- **Resumo Financeiro**: Cards inteligentes com "Total a Receber", "Total a Pagar" e "Saldo Previsto" (que muda de cor se positivo ou negativo).
- **Lançamentos**: Formulário para cadastrar novos títulos financeiros e tabelas para exibir os registros.

---

## Como Executar o Projeto Localmente

### 1. Requisitos
- Java 17 instalado
- Maven 3+ instalado
- Docker Desktop ativo

### 2. Iniciar o Banco de Dados (PostgreSQL) via Docker
Execute o comando abaixo no terminal para subir a base de dados configurada no projeto:
```bash
docker run --name meusgastos-db -p 5433:5432 -e POSTGRES_DB=meusgastos -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=123456 -d postgres:latest
```

### 3. Compilar e Executar os Testes
Para rodar a suíte completa de testes (unitários e integrados):
```bash
mvn clean test
```

### 4. Rodar a Aplicação
Inicie o servidor de desenvolvimento:
```bash
mvn spring-boot:run
```

A API e o frontend estarão disponíveis em:
**[http://localhost:8080](http://localhost:8080)**

---

## Estrutura de Pastas do Frontend

Os recursos visuais estão localizados em:
- `src/main/resources/static/index.html` (Estrutura)
- `src/main/resources/static/css/styles.css` (Estilos)
- `src/main/resources/static/js/app.js` (Lógica e requisições HTTP)

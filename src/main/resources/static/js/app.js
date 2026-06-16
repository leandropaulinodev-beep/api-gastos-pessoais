// Configurações Globais
const API_BASE = '/api';

// Elementos do DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');

const userDisplayName = document.getElementById('user-display-name');
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');

const summaryIncome = document.getElementById('summary-income');
const summaryExpense = document.getElementById('summary-expense');
const summaryBalance = document.getElementById('summary-balance');
const summaryBalanceCard = document.getElementById('summary-balance-card');

const transactionForm = document.getElementById('transaction-form');
const transactionError = document.getElementById('transaction-error');
const transactionSuccess = document.getElementById('transaction-success');

const incomeTableBody = document.getElementById('income-table-body');
const expenseTableBody = document.getElementById('expense-table-body');

// Estado Global
let token = localStorage.getItem('token');
let usuario = JSON.parse(localStorage.getItem('usuario'));

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Configura datas iniciais do filtro (mês atual)
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    filterStart.value = formatLocalDate(primeiroDia);
    filterEnd.value = formatLocalDate(ultimoDia);

    checkAuthState();
});

// Controlar Exibição com base em Autenticação
function checkAuthState() {
    if (token && usuario) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userDisplayName.textContent = usuario.nome;
        loadDashboardData();
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        clearLocalStorage();
    }
}

function clearLocalStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    token = null;
    usuario = null;
}

// Alternar Abas de Autenticação
window.switchAuthTab = function(tab) {
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
};

// Requisição de Login
window.handleLogin = async function(event) {
    event.preventDefault();
    authError.classList.add('hidden');
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const response = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.mensagem || 'E-mail ou senha inválidos.');
        }

        const data = await response.json();
        token = data.token;
        usuario = data.usuario;

        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));

        loginForm.reset();
        checkAuthState();
    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
};

// Requisição de Cadastro
window.handleRegister = async function(event) {
    event.preventDefault();
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');

    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;

    try {
        const response = await fetch(`${API_BASE}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.mensagem || 'Erro ao realizar cadastro.');
        }

        authSuccess.textContent = 'Cadastro realizado com sucesso! Efetue o login.';
        authSuccess.classList.remove('hidden');
        registerForm.reset();
        switchAuthTab('login');
    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
};

// Logout
window.handleLogout = function() {
    clearLocalStorage();
    checkAuthState();
};

// Carregar Dados do Dashboard
window.loadDashboardData = async function() {
    if (!token) return;

    // Formatar datas para bater com o TO_TIMESTAMP do PostgreSQL (YYYY-MM-DD hh24:MI:SS)
    const dtInicial = `${filterStart.value} 00:00:00`;
    const dtFinal = `${filterEnd.value} 23:59:59`;

    try {
        const response = await fetch(`${API_BASE}/dashboard?periodoInicial=${encodeURIComponent(dtInicial)}&periodoFinal=${encodeURIComponent(dtFinal)}`, {
            headers: { 'Authorization': token }
        });

        if (response.status === 401 || response.status === 403) {
            handleLogout();
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do fluxo de caixa.');
        }

        const data = await response.json();
        updateSummary(data);
        renderTables(data);
    } catch (err) {
        console.error(err);
    }
};

// Atualizar Cards de Resumo
function updateSummary(data) {
    const totalApagar = data.totalApagar || 0;
    const totalAreceber = data.totalAreceber || 0;
    const saldo = data.saldo || 0;

    summaryIncome.textContent = formatCurrency(totalAreceber);
    summaryExpense.textContent = formatCurrency(totalApagar);
    summaryBalance.textContent = formatCurrency(saldo);

    // Ajustar card de saldo dinamicamente
    summaryBalanceCard.className = 'summary-card balance';
    if (saldo > 0) {
        summaryBalanceCard.classList.add('positive');
    } else if (saldo < 0) {
        summaryBalanceCard.classList.add('negative');
    }
}

// Renderizar tabelas com os dados do dashboard
function renderTables(data) {
    const aPagar = data.titulosApagar || [];
    const aReceber = data.titulosAreceber || [];

    // Receitas
    if (aReceber.length === 0) {
        incomeTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhuma receita lançada para este período.</td></tr>`;
    } else {
        incomeTableBody.innerHTML = aReceber.map(t => `
            <tr>
                <td>${t.descricao}</td>
                <td>${formatStringDate(t.dataVencimento)}</td>
                <td class="td-val-income">${formatCurrency(t.valor)}</td>
                <td>
                    <button onclick="handleDeleteTransaction(${t.id})" class="btn-delete-row">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    // Despesas
    if (aPagar.length === 0) {
        expenseTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhuma despesa lançada para este período.</td></tr>`;
    } else {
        expenseTableBody.innerHTML = aPagar.map(t => `
            <tr>
                <td>${t.descricao}</td>
                <td>${formatStringDate(t.dataVencimento)}</td>
                <td class="td-val-expense">${formatCurrency(t.valor)}</td>
                <td>
                    <button onclick="handleDeleteTransaction(${t.id})" class="btn-delete-row">Excluir</button>
                </td>
            </tr>
        `).join('');
    }
}

// Cadastrar Nova Transação (Título)
window.handleCreateTransaction = async function(event) {
    event.preventDefault();
    transactionError.classList.add('hidden');
    transactionSuccess.classList.add('hidden');

    const descricao = document.getElementById('tx-descricao').value;
    const tipo = document.getElementById('tx-tipo').value;
    const valor = parseFloat(document.getElementById('tx-valor').value);
    
    // Converte a data selecionada no calendário para formato ISO compatível
    const rawVencimento = document.getElementById('tx-vencimento').value;
    const dataVencimento = new Date(rawVencimento + 'T12:00:00').toISOString();

    const observacao = document.getElementById('tx-observacao').value;

    try {
        const response = await fetch(`${API_BASE}/titulos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                descricao,
                tipo,
                valor,
                dataVencimento,
                observacao
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.mensagem || 'Erro ao salvar transação.');
        }

        transactionSuccess.textContent = 'Transação salva com sucesso!';
        transactionSuccess.classList.remove('hidden');
        transactionForm.reset();
        
        // Recarregar os filtros de data caso a transação caia no range filtrado
        loadDashboardData();

        setTimeout(() => {
            transactionSuccess.classList.add('hidden');
        }, 3000);
    } catch (err) {
        transactionError.textContent = err.message;
        transactionError.classList.remove('hidden');
    }
};

// Excluir Lançamento
window.handleDeleteTransaction = async function(id) {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;

    try {
        const response = await fetch(`${API_BASE}/titulos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir transação.');
        }

        loadDashboardData();
    } catch (err) {
        alert(err.message);
    }
};

// Funções Utilitárias de Formatação
function formatLocalDate(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
}

function formatStringDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dia = String(date.getDate()).padStart(2, '0');
    // Obs: getMonth() é zero-indexado, precisa somar 1
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(val);
}

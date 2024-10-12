"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $transactionForm = document.querySelector("#transactionForm");
const $displayIncomes = document.querySelector("#displayIncomes");
const $displayExpenses = document.querySelector("#displayExpenses");
const $transactionList = document.querySelector("#transactionList");
const $overlay = document.querySelector("#overlay");
const $incomeBtn = document.querySelector("#incomeBtn");
const $expenseBtn = document.querySelector("#expenseBtn");
const $closeBtn = document.querySelector("#closeBtn");
const url = new URL(location.href);
const INCOMES = JSON.parse(localStorage.getItem("incomes")) || [];
const EXPENSES = JSON.parse(localStorage.getItem("expenses")) || [];
String.prototype.seperateCurrency = function () {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};
let totalIncome = 0;
let totalExpense = 0;
const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()} UZS`;
    $displayExpenses.innerHTML = `${totalExpense.toString().seperateCurrency()} UZS`;
};
checkBalance();
let myChartInstance = null;
let myBarChartInstance = null;
const renderChart = () => {
    const $myChart = document.querySelector("#myChart");
    if (myChartInstance) {
        myChartInstance.destroy();
    }
    myChartInstance = new Chart($myChart, {
        type: 'bar',
        data: {
            labels: ['Net Income', 'Total Expenses'], // Add labels for the bar chart
            datasets: [{
                    label: 'Financial Overview',
                    data: [totalIncome - totalExpense, totalExpense], // Use your calculated values
                    backgroundColor: ['#4CAF50', '#F44336'], // Set colors for each bar
                }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    position: 'top',
                },
            },
        }
    });
};
const getTopCategories = () => {
    const categoryTotals = {};
    EXPENSES.forEach((expense) => {
        const { transactionType, transactionAmount } = expense;
        if (transactionType) {
            categoryTotals[transactionType] = (categoryTotals[transactionType] || 0) + transactionAmount;
        }
    });
    return Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
};
const renderBarChart = () => {
    if (myBarChartInstance) {
        myBarChartInstance.destroy();
    }
    const topCategories = getTopCategories();
    const labels = topCategories.map(([type]) => type);
    const data = topCategories.map(([_, total]) => total);
    const $myBarChart = document.querySelector("#myBarChart");
    myBarChartInstance = new Chart($myBarChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                    label: 'Total Expenses by Category',
                    data: data,
                    backgroundColor: '#F44336',
                    borderColor: '#D32F2F',
                    borderWidth: 1
                }],
        },
        options: {}
    });
};
renderChart();
renderBarChart();
const checkModalOpen = () => {
    const openModal = getCurrentQuery();
    const $select = $transactionForm.querySelector("select");
    $overlay.classList.toggle("hidden", openModal === "");
    $select.classList.toggle("hidden", openModal === "income");
};
var TransactionType;
(function (TransactionType) {
    TransactionType["Income"] = "income";
    TransactionType["Expense"] = "expense";
})(TransactionType || (TransactionType = {}));
class Transaction {
    transactionName;
    transactionType;
    transactionAmount;
    type;
    date;
    constructor(transactionName, transactionAmount, transactionType, type) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}
const renderTransactions = () => {
    const $transactionTableBody = document.querySelector("#transactionTableBody");
    $transactionTableBody.innerHTML = "";
    INCOMES.forEach((income) => {
        $transactionTableBody.innerHTML +=
            `<tr class="transactionTable bg-green-100 hover:bg-green-200 transition duration-300">
                <td class="px-4 py-2 border-b">${income.transactionName}</td>
                <td class="px-4 py-2 border-b">${income.transactionAmount.toString().seperateCurrency()} UZS</td>
                <td class="px-4 py-2 border-b text-green-600">Income</td>
                <td class="px-4 py-2 border-b">${new Date(income.date).toLocaleDateString()}</td>
            </tr>`;
    });
    EXPENSES.forEach((expense) => {
        $transactionTableBody.innerHTML +=
            `<tr class="transactionTable bg-red-100 hover:bg-red-200 transition duration-300">
                <td class="px-4 py-2 border-b">${expense.transactionName}</td>
                <td class="px-4 py-2 border-b">${expense.transactionAmount.toString().seperateCurrency()} UZS</td>
                <td class="px-4 py-2 border-b text-red-600">Expense</td>
                <td class="px-4 py-2 border-b">${new Date(expense.date).toLocaleDateString()}</td>
            </tr>`;
    });
};
renderTransactions();
const isValidTransaction = (values) => {
    return values.slice(0, getCurrentQuery() === TransactionType.Income ? -1 : undefined)
        .every((value) => typeof value === "string" ? value.trim().length > 0 : typeof value === "number" && value > 0);
};
const createNewTransaction = (e) => {
    e.preventDefault();
    const inputs = Array.from($transactionForm.querySelectorAll("input, select"));
    const values = inputs.map(input => input.type === "number" ? +input.value : input.value || undefined);
    if (isValidTransaction(values)) {
        const newTransaction = new Transaction(...values);
        if (getCurrentQuery() === TransactionType.Income) {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        }
        else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSES));
        }
        updateUIAfterTransaction();
    }
    else {
        alert("Please fill in all fields correctly!");
    }
};
const updateUIAfterTransaction = () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
    checkBalance();
    renderChart();
    renderBarChart();
    renderTransactions();
};
$incomeBtn.addEventListener("click", () => {
    toggleModal(TransactionType.Income);
});
$expenseBtn.addEventListener("click", () => {
    toggleModal(TransactionType.Expense);
});
$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});
const toggleModal = (type) => {
    url.searchParams.set("modal", type);
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
};
checkModalOpen();
$transactionForm.addEventListener("submit", createNewTransaction);

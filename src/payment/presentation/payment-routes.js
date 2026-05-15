const walletList       = () => import('./views/wallet-list.vue');
const walletView       = () => import('./views/wallet-view.vue');
const transactionList  = () => import('./views/transaction-list.vue');
const transactionForm  = () => import('./views/transaction-form.vue');

const paymentRoutes = [
    { path: 'wallets',                    name: 'payment-wallets',          component: walletList,      meta: { title: 'Wallets'          } },
    { path: 'wallets/:id',                name: 'payment-wallets-view',     component: walletView,      meta: { title: 'Wallet'           } },
    { path: 'transactions',               name: 'payment-transactions',     component: transactionList, meta: { title: 'Transactions'     } },
    { path: 'transactions/new',           name: 'payment-transactions-new', component: transactionForm, meta: { title: 'New Transaction'  } },
    { path: 'transactions/:id/edit',      name: 'payment-transactions-edit',component: transactionForm, meta: { title: 'Edit Transaction' } },
];

export default paymentRoutes;

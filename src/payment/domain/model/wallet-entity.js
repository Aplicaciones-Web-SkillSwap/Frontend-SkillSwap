export class Wallet {
    constructor({ id = null, userId = null, balance = 0, currency = 'USD' }) {
        this.id       = id;
        this.userId   = userId;
        this.balance  = balance;
        this.currency = currency;
    }
}

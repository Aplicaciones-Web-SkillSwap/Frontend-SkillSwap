export class Transaction {
    constructor({
                    id                 = null,
                    transactionId      = null,
                    walletId           = null,
                    amountSent         = 0,
                    platformFee        = 0,
                    amountReceived     = 0,
                    newSenderBalance   = null,
                    newReceiverBalance = null,
                    type               = 'donation',
                    description        = '',
                    createdAt          = null
                }) {
        this.id                 = id ?? transactionId;
        this.walletId           = walletId;
        this.amountSent         = amountSent;
        this.platformFee        = platformFee;
        this.amountReceived     = amountReceived;
        this.newSenderBalance   = newSenderBalance;
        this.newReceiverBalance = newReceiverBalance;
        this.type               = type;
        this.description        = description;
        this.createdAt          = createdAt;
    }
}
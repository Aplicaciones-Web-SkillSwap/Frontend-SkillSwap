export class Transaction {
    constructor({
                    id             = null,
                    walletId       = null,
                    senderId       = null,
                    receiverId     = null,
                    originalAmount = 0,
                    commissionFee  = 0,
                    netAmount      = 0,
                    type           = 'donation',
                    status         = 'pending',
                    description    = '',
                    createdAt      = null
                }) {
        this.id             = id;
        this.walletId       = walletId;
        this.senderId       = senderId;
        this.receiverId     = receiverId;
        this.originalAmount = originalAmount;   // Monto que dona el aprendiz
        this.commissionFee  = commissionFee;    // 5% que retiene SkillSwap
        this.netAmount      = netAmount;        // 95% que recibe el tutor
        this.type           = type;
        this.status         = status;
        this.description    = description;
        this.createdAt      = createdAt;
    }

    static COMMISSION_RATE = 0.05;

    static calculateCommission(originalAmount) {
        const commission = parseFloat((originalAmount * this.COMMISSION_RATE).toFixed(2));
        const net        = parseFloat((originalAmount - commission).toFixed(2));
        return { commissionFee: commission, netAmount: net };
    }
}

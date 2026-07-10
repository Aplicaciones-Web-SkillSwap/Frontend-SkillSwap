export class PaymentMethod {
    constructor({ id = null, userId = null, type = '', displayLabel = '', createdAt = null }) {
        this.id           = id;
        this.userId       = userId;
        this.type         = type;
        this.displayLabel = displayLabel;
        this.createdAt    = createdAt;
    }
}

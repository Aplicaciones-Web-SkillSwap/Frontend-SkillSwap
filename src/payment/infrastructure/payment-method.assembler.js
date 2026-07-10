import {PaymentMethod} from "@/payment/domain/model/payment-method-entity.js";

export class PaymentMethodAssembler {
    static toEntityFromResource(resource) {
        return new PaymentMethod({ ...resource });
    }
}

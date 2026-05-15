import {Wallet} from "@/payment/domain/model/wallet-entity.js";

export class WalletAssembler {

    static toEntityFromResource(resource) {
        return new Wallet({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        let resources = response.data instanceof Array ? response.data : response.data['wallets'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}

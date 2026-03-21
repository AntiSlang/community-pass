import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendParameters, toNano } from '@ton/core';

export type Mint = {
    $$type: 'Mint';
    query_id: bigint;
};

export class CommunityPassCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static fromAddress(address: Address) {
        return new CommunityPassCollection(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: 1,
            body: beginCell().storeUint(0x946a98b6, 32).storeUint(0, 64).endCell(),
        });
    }

    async sendMint(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: 1,
            body: beginCell().storeUint(0x2F47783B, 32).storeUint(0, 64).endCell(),
        });
    }
}
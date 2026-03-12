import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { CommunityPassCollection } from '../build/CommunityPassCollection/CommunityPassCollection_CommunityPassCollection';
import '@ton/test-utils';

describe('CommunityPassCollection', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let communityPassCollection: SandboxContract<CommunityPassCollection>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        communityPassCollection = blockchain.openContract(await CommunityPassCollection.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await communityPassCollection.send(
            deployer.getSender(),
            {
                value: toNano('0.09'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: communityPassCollection.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
    });
});

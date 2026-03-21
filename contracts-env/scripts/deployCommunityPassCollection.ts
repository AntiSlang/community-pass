import { toNano } from '@ton/core';
import { CommunityPassCollection } from '../build/CommunityPassCollection/tact_CommunityPassCollection';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const communityPassCollection = provider.open(await CommunityPassCollection.fromInit());

    await communityPassCollection.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(communityPassCollection.address);
    console.log('✅ НОВЫЙ ЖИВОЙ АДРЕС:', communityPassCollection.address.toString());
}
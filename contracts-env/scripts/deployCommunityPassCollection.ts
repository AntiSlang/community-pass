import { Address, Cell, beginCell, toNano, StateInit, contractAddress, Contract } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

class RawContract implements Contract {
    constructor(readonly address: Address, readonly init: StateInit) {}
}

export async function run(provider: NetworkProvider) {
    const codeB64 = "te6ccgECEAEAAu4AA8z/AI6I9KQT9LzyyAvtUyCPUTAB0HLXIdIA0gD6QCEQNFBmbwT4YQL4Yu1E0NIAAZfTH/pAWWwSlDBw+ELiA5JfA+AB1w0f8uCCIYIQL0d4O7rjAgGCEJRqmLa64wJfA/LAguHtQ9kBAgMCAnEEBQL+W/hBbyQwgV2PM4IK+vCAvhLy9PgoIts8XHBZIPkAIvkAWtdlAddlggIBNMjLF8sPyw/L/8v/cfkEAMh0AcsCEsoHy//J0IIJMS0AJXIGyFmCELsPa9pQA8sfyx/OyUVAQTAQNUFEA3/Iz4WAygDPhEDOAfoCgGnPQAJcbgFusAkKAITTPzDIAYIQr/kPV1jLH8s/yRL4QnBwUAOAQgFQMwTIz4WAygDPhEDOAfoCgGrPQPQAyQH7AMh/AcoAWQLLH87J7VQBN789H2omhpAADL6Y/9ICy2CUoYOHwhcSxtnjYQwGATW8gt9qJoaQAAy+mP/SAstglKGDh8IXFtnjYRwHAWT4KAHbPHBZIPkAIvkAWtdlAddlggIBNMjLF8sPyw/L/8v/cfkEAMh0AcsCEsoHy//J0AkBCIhUYiEIAAABHojIcAHKAFoCzoEBAc8AyQsBSoqdWM+GgM+EgPQA9ADPgeL0AMkB+wCkAch/AcoAWQLLH87J7VQPAur/AI6I9KQT9LzyyAvtUyCO4DAB0HLXIdIA0gD6QCEQNFBmbwT4YQL4Yu1E0NIAAY4V+kDTH9csAZFtk/pAAeIB0gBVMGwUnfpAgQEB1wBZAtEBbXDiMQSSXwTgAtcNH/LgggGCELsPa9q64wJfBPLAguHtQ9kMDQFnpmPz+1E0NIAAY4V+kDTH9csAZFtk/pAAeIB0gBVMGwUnfpAgQEB1wBZAtEBbXDi2zxsRYA4AbtMfMfpAMIEgQfhCI8cF8vSBC6EEsxTy9AJ/yH8BygBVMFA0zssfASBulDDPhICSAc7iygDJ7VQAJCEgbvLQgMhSQMsfySJURTAnWQAGW8+B";
    
    const code = Cell.fromBoc(Buffer.from(codeB64, 'base64'))[0];
    
    const data = beginCell()
        .storeUint(666, 32)
        .storeAddress(provider.sender().address)
        .endCell();

    const stateInit: StateInit = { code, data };
    const address = contractAddress(0, stateInit);

    console.log("НОВЫЙ ЖИВОЙ АДРЕС:", address.toString());

    await provider.deploy(new RawContract(address, stateInit), toNano('0.09'), 
        beginCell().storeUint(0x946a98b6, 32).storeUint(0, 64).endCell()
    );

    await provider.waitForDeploy(address);
    console.log("ДЕПЛОЙ УСПЕШЕН!");
}
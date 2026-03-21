import "@stdlib/deploy";

message InternalLogNft {
    item_index: Int as uint32;
    owner: Address;
}

contract CommunityPassItem {
    collection_address: Address;
    item_index: Int as uint32;
    owner: Address?;
    initialized: Bool = false;

    init(collection_address: Address, item_index: Int) {
        self.collection_address = collection_address;
        self.item_index = item_index;
    }

    receive(msg: InternalLogNft) {
        require(sender() == self.collection_address, "Only collection can init");
        require(!self.initialized, "Already initialized");
        self.owner = msg.owner;
        self.initialized = true;
    }

    get fun get_nft_data(): GetNftData {
        let url1: String = "data:application/json,{\"name\":\"Community Pass #";
        let url2: String = "\",\"description\":\"Official member of the community\",";
        let url3: String = "\"image\":\"https://iili.io/qkkvTpn.md.jpg\"}";

        let tail: Cell = beginCell().storeSlice(url3.asSlice()).endCell();
        let middle: Cell = beginCell().storeSlice(url2.asSlice()).storeRef(tail).endCell();
        let content: Cell = beginCell()
            .storeUint(0x01, 8)
            .storeSlice(url1.asSlice())
            .storeSlice(self.item_index.toString().asSlice())
            .storeRef(middle)
            .endCell();

        return GetNftData{
            is_initialized: self.initialized,
            index: self.item_index,
            collection_address: self.collection_address,
            owner_address: self.owner!!,
            individual_content: content
        };
    }
}

struct GetNftData {
    is_initialized: Bool;
    index: Int;
    collection_address: Address;
    owner_address: Address;
    individual_content: Cell;
}
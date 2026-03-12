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
        return GetNftData{
            is_initialized: self.initialized,
            index: self.item_index,
            collection_address: self.collection_address,
            owner_address: self.owner!!,
            individual_content: beginCell().storeUint(self.item_index, 32).endCell()
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
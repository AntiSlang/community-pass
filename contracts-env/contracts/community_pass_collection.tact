import "@stdlib/deploy";
import "./community_pass_item";

message Mint {
    query_id: Int as uint64;
}

contract CommunityPassCollection with Deployable {
    next_item_index: Int as uint32 = 0;
    owner_address: Address;
    created_at: Int as uint64;

    init() {
        self.owner_address = sender();
        self.created_at = now();
    }

    receive(msg: Slice) {
    let op = msg.loadUint(32);

    if (op == 0x2F47783B) {
        let query_id = msg.loadUint(64);

        let ctx: Context = context();
        require(ctx.value >= ton("0.05"), "Insufficient gas");

        let nft_init: StateInit = initOf CommunityPassItem(myAddress(), self.next_item_index);

        send(SendParameters{
            to: contractAddress(nft_init),
            value: ton("0.2"),
            mode: SendIgnoreErrors,
            code: nft_init.code,
            data: nft_init.data,
            body: InternalLogNft{ item_index: self.next_item_index, owner: ctx.sender }.toCell()
        });

        self.next_item_index = self.next_item_index + 1;
    }
}

    get fun get_collection_data(): CollectionData {
        return CollectionData{
            next_item_index: self.next_item_index,
            collection_content: emptyCell(),
            owner_address: self.owner_address
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address {
        let nft_init: StateInit = initOf CommunityPassItem(myAddress(), item_index);
        return contractAddress(nft_init);
    }
}

struct CollectionData {
    next_item_index: Int;
    collection_content: Cell;
    owner_address: Address;
}
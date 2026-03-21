import "@stdlib/deploy";
import "./community_pass_item";

message Mint {
    query_id: Int as uint64;
}

contract CommunityPassCollection with Deployable {
    next_item_index: Int as uint32 = 0;
    owner_address: Address;
    created_at: Int as uint64;

    votes_yes: Int as uint32 = 0;
    votes_no: Int as uint32 = 0;
    votes_raise: Int as uint32 = 0;
    voted: map<Address, Int>;

    init() {
        self.owner_address = sender();
        self.created_at = now();
    }

    receive(msg: String) {
        let ctx: Context = context();
        require(ctx.value >= ton("0.02"), "Insufficient gas for voting");

        let option: Int = 0;
        if (msg == "vote_yes") { option = 1; }
        else if (msg == "vote_no") { option = 2; }
        else if (msg == "vote_raise") { option = 3; }
        else { require(false, "Invalid vote option"); }

        let prev_vote: Int? = self.voted.get(ctx.sender);

        if (prev_vote != null) {
            if (prev_vote == 1) { self.votes_yes = self.votes_yes - 1; }
            else if (prev_vote == 2) { self.votes_no = self.votes_no - 1; }
            else if (prev_vote == 3) { self.votes_raise = self.votes_raise - 1; }
        }

        if (option == 1) { self.votes_yes = self.votes_yes + 1; }
        else if (option == 2) { self.votes_no = self.votes_no + 1; }
        else if (option == 3) { self.votes_raise = self.votes_raise + 1; }

        self.voted.set(ctx.sender, option);
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
                value: ton("0.02"),
                mode: SendIgnoreErrors,
                code: nft_init.code,
                data: nft_init.data,
                body: InternalLogNft{ item_index: self.next_item_index, owner: ctx.sender }.toCell()
            });

            self.next_item_index = self.next_item_index + 1;
        }
    }

    get fun get_collection_data(): CollectionData {
        let url1: String = "data:application/json,{\"name\":\"Community Pass Collection\",";
        let url2: String = "\"description\":\"Access to our private club\",";
        let url3: String = "\"image\":\"https://genuine-amusement-abf8b52228.media.strapiapp.com/icon_TON_white_d487b1a4b1.png\"}";
        
        let tail: Cell = beginCell().storeSlice(url3.asSlice()).endCell();
        let middle: Cell = beginCell().storeSlice(url2.asSlice()).storeRef(tail).endCell();
        let content: Cell = beginCell()
            .storeUint(0x01, 8)
            .storeSlice(url1.asSlice())
            .storeRef(middle)
            .endCell();

        return CollectionData{
            next_item_index: self.next_item_index,
            collection_content: content,
            owner_address: self.owner_address
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address {
        let nft_init: StateInit = initOf CommunityPassItem(myAddress(), item_index);
        return contractAddress(nft_init);
    }

    get fun get_voting_stats(): VotingStats {
        return VotingStats{
            yes: self.votes_yes,
            no: self.votes_no,
            raise: self.votes_raise,
            total: self.votes_yes + self.votes_no + self.votes_raise
        };
    }

    get fun get_user_vote(voter: Address): Int? {
        return self.voted.get(voter);
    }
}

struct VotingStats {
    yes: Int;
    no: Int;
    raise: Int;
    total: Int;
}

struct CollectionData {
    next_item_index: Int;
    collection_content: Cell;
    owner_address: Address;
}
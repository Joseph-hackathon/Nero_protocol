// contracts/sources/nero_nft.move
// Nero Protocol NFT - Dynamic Learning Companion NFT with XP System

module nero_protocol::nero_nft {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    // ============================================
    // Error Codes
    // ============================================
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_ALREADY_HAS_NFT: u64 = 2;
    const E_NFT_NOT_FOUND: u64 = 3;
    const E_INVALID_LEVEL: u64 = 4;
    const E_MAX_LEVEL_REACHED: u64 = 5;

    // ============================================
    // Constants
    // ============================================
    const MAX_LEVEL: u64 = 10;
    const BASE_XP_REQUIREMENT: u64 = 500;

    // ============================================
    // Structs
    // ============================================

    /// Main NFT resource that represents a Nero learning companion
    struct NeroNFT has key, store {
        token_id: u64,
        platform_id: String,  // "uniswap", "aave", "movement", etc.
        level: u64,
        xp: u64,
        max_xp: u64,
        mint_timestamp: u64,
        last_interaction: u64,
        total_queries: u64,
        metadata_uri: String,
    }

    /// Collection to hold all NFTs for a user
    struct NeroCollection has key {
        nfts: vector<NeroNFT>,
        total_minted: u64,
    }

    /// Global state for the protocol
    struct ProtocolState has key {
        admin: address,
        treasury: address,
        total_nfts_minted: u64,
        query_fee: u64,  // Fee per query in micro-MOVE
        paused: bool,
    }

    /// Events
    struct NFTMintedEvent has drop, store {
        owner: address,
        token_id: u64,
        platform_id: String,
        timestamp: u64,
    }

    struct XPGainedEvent has drop, store {
        owner: address,
        token_id: u64,
        xp_gained: u64,
        new_total_xp: u64,
        timestamp: u64,
    }

    struct LevelUpEvent has drop, store {
        owner: address,
        token_id: u64,
        old_level: u64,
        new_level: u64,
        timestamp: u64,
    }

    struct EventStore has key {
        mint_events: event::EventHandle<NFTMintedEvent>,
        xp_events: event::EventHandle<XPGainedEvent>,
        levelup_events: event::EventHandle<LevelUpEvent>,
    }

    // ============================================
    // Initialization
    // ============================================

    /// Initialize the protocol (called once by deployer)
    public entry fun initialize(admin: &signer, treasury_address: address) {
        let admin_addr = signer::address_of(admin);
        
        // Create protocol state
        move_to(admin, ProtocolState {
            admin: admin_addr,
            treasury: treasury_address,
            total_nfts_minted: 0,
            query_fee: 1000, // 0.001 MOVE (assuming 6 decimals)
            paused: false,
        });

        // Create event store
        move_to(admin, EventStore {
            mint_events: account::new_event_handle<NFTMintedEvent>(admin),
            xp_events: account::new_event_handle<XPGainedEvent>(admin),
            levelup_events: account::new_event_handle<LevelUpEvent>(admin),
        });
    }

    // ============================================
    // NFT Functions
    // ============================================

    /// Mint a new Nero NFT for a platform
    public entry fun mint_nft(
        user: &signer,
        platform_id: String,
    ) acquires ProtocolState, NeroCollection, EventStore {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<ProtocolState>(@nero_protocol);
        
        assert!(!state.paused, E_NOT_AUTHORIZED);

        // Check if user already has NFT for this platform
        if (exists<NeroCollection>(user_addr)) {
            let collection = borrow_global<NeroCollection>(user_addr);
            let has_platform_nft = has_nft_for_platform(collection, &platform_id);
            assert!(!has_platform_nft, E_ALREADY_HAS_NFT);
        } else {
            // Create new collection for user
            move_to(user, NeroCollection {
                nfts: vector::empty(),
                total_minted: 0,
            });
        };

        let collection = borrow_global_mut<NeroCollection>(user_addr);
        let token_id = state.total_nfts_minted + 1;
        
        // Create NFT
        let nft = NeroNFT {
            token_id,
            platform_id: platform_id,
            level: 1,
            xp: 0,
            max_xp: BASE_XP_REQUIREMENT,
            mint_timestamp: timestamp::now_seconds(),
            last_interaction: timestamp::now_seconds(),
            total_queries: 0,
            metadata_uri: construct_metadata_uri(token_id, &platform_id),
        };

        // Add to collection
        vector::push_back(&mut collection.nfts, nft);
        collection.total_minted = collection.total_minted + 1;
        state.total_nfts_minted = state.total_nfts_minted + 1;

        // Emit event
        let event_store = borrow_global_mut<EventStore>(@nero_protocol);
        event::emit_event(&mut event_store.mint_events, NFTMintedEvent {
            owner: user_addr,
            token_id,
            platform_id: platform_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add XP to an NFT (called after successful query)
    public entry fun add_xp(
        user: &signer,
        platform_id: String,
        xp_amount: u64,
    ) acquires NeroCollection, EventStore {
        let user_addr = signer::address_of(user);
        assert!(exists<NeroCollection>(user_addr), E_NFT_NOT_FOUND);

        let collection = borrow_global_mut<NeroCollection>(user_addr);
        let nft_ref = find_nft_mut(collection, &platform_id);
        
        // Update last interaction
        nft_ref.last_interaction = timestamp::now_seconds();
        nft_ref.total_queries = nft_ref.total_queries + 1;
        
        // Add XP
        nft_ref.xp = nft_ref.xp + xp_amount;
        
        // Emit XP event
        let event_store = borrow_global_mut<EventStore>(@nero_protocol);
        event::emit_event(&mut event_store.xp_events, XPGainedEvent {
            owner: user_addr,
            token_id: nft_ref.token_id,
            xp_gained: xp_amount,
            new_total_xp: nft_ref.xp,
            timestamp: timestamp::now_seconds(),
        });

        // Check for level up
        if (nft_ref.xp >= nft_ref.max_xp && nft_ref.level < MAX_LEVEL) {
            level_up_internal(nft_ref, &mut event_store.levelup_events, user_addr);
        };
    }

    /// Internal level up function
    fun level_up_internal(
        nft: &mut NeroNFT,
        levelup_events: &mut event::EventHandle<LevelUpEvent>,
        owner: address,
    ) {
        let old_level = nft.level;
        nft.level = nft.level + 1;
        nft.xp = nft.xp - nft.max_xp; // Carry over excess XP
        nft.max_xp = calculate_xp_for_level(nft.level);
        
        // Emit level up event
        event::emit_event(levelup_events, LevelUpEvent {
            owner,
            token_id: nft.token_id,
            old_level,
            new_level: nft.level,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ============================================
    // View Functions
    // ============================================

    #[view]
    public fun get_nft_info(owner: address, platform_id: String): (u64, u64, u64, u64) acquires NeroCollection {
        assert!(exists<NeroCollection>(owner), E_NFT_NOT_FOUND);
        
        let collection = borrow_global<NeroCollection>(owner);
        let nft_ref = find_nft(collection, &platform_id);
        
        (nft_ref.level, nft_ref.xp, nft_ref.max_xp, nft_ref.total_queries)
    }

    #[view]
    public fun get_user_nfts(owner: address): u64 acquires NeroCollection {
        if (!exists<NeroCollection>(owner)) {
            return 0
        };
        
        let collection = borrow_global<NeroCollection>(owner);
        collection.total_minted
    }

    #[view]
    public fun get_query_fee(): u64 acquires ProtocolState {
        let state = borrow_global<ProtocolState>(@nero_protocol);
        state.query_fee
    }

    // ============================================
    // Helper Functions
    // ============================================

    fun has_nft_for_platform(collection: &NeroCollection, platform_id: &String): bool {
        let i = 0;
        let len = vector::length(&collection.nfts);
        
        while (i < len) {
            let nft = vector::borrow(&collection.nfts, i);
            if (&nft.platform_id == platform_id) {
                return true
            };
            i = i + 1;
        };
        
        false
    }

    fun find_nft(collection: &NeroCollection, platform_id: &String): &NeroNFT {
        let i = 0;
        let len = vector::length(&collection.nfts);
        
        while (i < len) {
            let nft = vector::borrow(&collection.nfts, i);
            if (&nft.platform_id == platform_id) {
                return nft
            };
            i = i + 1;
        };
        
        abort E_NFT_NOT_FOUND
    }

    fun find_nft_mut(collection: &mut NeroCollection, platform_id: &String): &mut NeroNFT {
        let i = 0;
        let len = vector::length(&collection.nfts);
        
        while (i < len) {
            let nft = vector::borrow_mut(&mut collection.nfts, i);
            if (&nft.platform_id == platform_id) {
                return nft
            };
            i = i + 1;
        };
        
        abort E_NFT_NOT_FOUND
    }

    fun calculate_xp_for_level(level: u64): u64 {
        // Exponential growth: base * (1.5 ^ level)
        BASE_XP_REQUIREMENT * power(15, level) / power(10, level)
    }

    fun power(base: u64, exp: u64): u64 {
        if (exp == 0) {
            return 1
        };
        
        let result = base;
        let i = 1;
        
        while (i < exp) {
            result = result * base;
            i = i + 1;
        };
        
        result
    }

    fun construct_metadata_uri(token_id: u64, platform_id: &String): String {
        // TODO: Construct proper IPFS or on-chain metadata URI
        string::utf8(b"ipfs://nero-metadata/")
    }

    // ============================================
    // Admin Functions
    // ============================================

    public entry fun set_query_fee(admin: &signer, new_fee: u64) acquires ProtocolState {
        let state = borrow_global_mut<ProtocolState>(@nero_protocol);
        assert!(signer::address_of(admin) == state.admin, E_NOT_AUTHORIZED);
        state.query_fee = new_fee;
    }

    public entry fun pause_protocol(admin: &signer) acquires ProtocolState {
        let state = borrow_global_mut<ProtocolState>(@nero_protocol);
        assert!(signer::address_of(admin) == state.admin, E_NOT_AUTHORIZED);
        state.paused = true;
    }

    public entry fun unpause_protocol(admin: &signer) acquires ProtocolState {
        let state = borrow_global_mut<ProtocolState>(@nero_protocol);
        assert!(signer::address_of(admin) == state.admin, E_NOT_AUTHORIZED);
        state.paused = false;
    }
}

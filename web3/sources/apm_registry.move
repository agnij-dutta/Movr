/// APM (Aptos Package Manager) Registry
/// 
/// A decentralized, on-chain package registry for the Move ecosystem on Aptos.
/// Enables publishing, endorsing, and discovering Move packages with security validation.
module apm_registry::registry {
    use std::string::{Self, String};
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_std::table::{Self, Table};

    // ================================
    // Error Constants
    // ================================
    
    /// Package already exists with this name and version
    const E_PACKAGE_ALREADY_EXISTS: u64 = 1;
    
    /// Package not found
    const E_PACKAGE_NOT_FOUND: u64 = 2;
    
    /// Invalid package name (empty or too long)
    const E_INVALID_PACKAGE_NAME: u64 = 3;
    
    /// Invalid version string (empty or malformed)
    const E_INVALID_VERSION: u64 = 4;
    
    /// Invalid IPFS hash format
    const E_INVALID_IPFS_HASH: u64 = 5;
    
    /// Endorser not authorized (not in whitelist)
    const E_ENDORSER_NOT_AUTHORIZED: u64 = 6;
    
    /// Already endorsed by this endorser
    const E_ALREADY_ENDORSED: u64 = 7;
    
    /// Insufficient staking amount for endorsement
    const E_INSUFFICIENT_STAKE: u64 = 8;
    
    /// Only registry admin can perform this action
    const E_NOT_ADMIN: u64 = 9;
    
    /// Invalid package type
    const E_INVALID_PACKAGE_TYPE: u64 = 10;

    // ================================
    // Constants
    // ================================
    
    /// Maximum package name length
    const MAX_PACKAGE_NAME_LENGTH: u64 = 100;
    
    /// Maximum version string length  
    const MAX_VERSION_LENGTH: u64 = 20;
    
    /// Maximum IPFS hash length
    const MAX_IPFS_HASH_LENGTH: u64 = 100;
    
    /// Minimum staking amount for endorsers (in APT units)
    const MIN_ENDORSER_STAKE: u64 = 1000000; // 1 APT
    
    /// Platform fee for publishing (in APT units)
    const PLATFORM_FEE: u64 = 10000; // 0.01 APT
    
    /// Package type: Library
    const PACKAGE_TYPE_LIBRARY: u8 = 0;
    
    /// Package type: Template
    const PACKAGE_TYPE_TEMPLATE: u8 = 1;

    // ================================
    // Data Structures
    // ================================

    /// Information about a package endorser
    struct EndorserInfo has store, copy, drop {
        /// Address of the endorser
        endorser: address,
        /// Amount staked by endorser (in APT units)
        stake_amount: u64,
        /// Whether the endorser is currently active
        is_active: bool,
        /// Reputation score (0-100)
        reputation: u64,
        /// Number of packages endorsed
        packages_endorsed: u64,
        /// Timestamp when endorser was registered
        registered_at: u64,
    }

    /// Metadata for a published package
    struct PackageMetadata has store, copy, drop {
        /// Unique package name
        name: String,
        /// Semantic version (e.g., "1.0.0")
        version: String,
        /// Address of the package publisher
        publisher: address,
        /// IPFS hash containing the package source code and metadata
        ipfs_hash: String,
        /// List of endorsers who have validated this package
        endorsements: vector<address>,
        /// Unix timestamp when package was published
        timestamp: u64,
        /// Package type (0 = library, 1 = template)
        package_type: u8,
        /// Number of times this package has been downloaded/installed
        download_count: u64,
        /// Total tips received (in APT units)
        total_tips: u64,
        /// Tags for categorization
        tags: vector<String>,
        /// Short description
        description: String,
    }

    /// Main registry resource storing all packages and endorsers
    struct PackageRegistry has key {
        /// Mapping from package identifier (name::version) to metadata
        packages: Table<String, PackageMetadata>,
        /// Mapping from endorser address to their info
        endorsers: Table<address, EndorserInfo>,
        /// List of all package identifiers for iteration
        package_list: vector<String>,
        /// Mapping from package name to list of versions
        package_versions: Table<String, vector<String>>,
        /// Total number of packages published
        total_packages: u64,
        /// Total number of active endorsers
        total_endorsers: u64,
        /// Registry admin address
        admin: address,
        /// Capability for registry operations
        signer_cap: SignerCapability,
        /// Event handles for emissions
        package_published_events: EventHandle<PackagePublishedEvent>,
        package_endorsed_events: EventHandle<PackageEndorsedEvent>,
        package_tipped_events: EventHandle<PackageTippedEvent>,
        endorser_registered_events: EventHandle<EndorserRegisteredEvent>,
    }

    // ================================
    // Events
    // ================================

    /// Event emitted when a new package is published
    struct PackagePublishedEvent has drop, store {
        name: String,
        version: String,
        publisher: address,
        package_type: u8,
        timestamp: u64,
    }

    /// Event emitted when a package receives an endorsement
    struct PackageEndorsedEvent has drop, store {
        name: String,
        version: String,
        endorser: address,
        timestamp: u64,
    }

    /// Event emitted when a package receives a tip
    struct PackageTippedEvent has drop, store {
        name: String,
        version: String,
        tipper: address,
        amount: u64,
        timestamp: u64,
    }

    /// Event emitted when a new endorser is registered
    struct EndorserRegisteredEvent has drop, store {
        endorser: address,
        stake_amount: u64,
        timestamp: u64,
    }

    // ================================
    // Helper Functions
    // ================================

    /// Generate package identifier from name and version
    fun package_id(name: &String, version: &String): String {
        let id = *name;
        string::append(&mut id, string::utf8(b"::"));
        string::append(&mut id, *version);
        id
    }

    /// Validate package name format
    fun validate_package_name(name: &String): bool {
        let length = string::length(name);
        length > 0 && length <= MAX_PACKAGE_NAME_LENGTH
    }

    /// Validate version string format
    fun validate_version(version: &String): bool {
        let length = string::length(version);
        length > 0 && length <= MAX_VERSION_LENGTH
    }

    /// Validate IPFS hash format
    fun validate_ipfs_hash(hash: &String): bool {
        let length = string::length(hash);
        length > 0 && length <= MAX_IPFS_HASH_LENGTH
    }

    /// Validate package type
    fun validate_package_type(package_type: u8): bool {
        package_type == PACKAGE_TYPE_LIBRARY || package_type == PACKAGE_TYPE_TEMPLATE
    }

    /// Check if endorser already endorsed this package
    fun has_endorsement(package: &PackageMetadata, endorser: address): bool {
        vector::contains(&package.endorsements, &endorser)
    }

    // ================================
    // Initialization Functions
    // ================================

    /// Initialize the package registry (called during module deployment)
    fun init_module(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Create resource account for the registry
        let (resource_signer, signer_cap) = account::create_resource_account(admin, b"apm_registry");

        // Initialize the registry
        let registry = PackageRegistry {
            packages: table::new(),
            endorsers: table::new(),
            package_list: vector::empty(),
            package_versions: table::new(),
            total_packages: 0,
            total_endorsers: 0,
            admin: admin_addr,
            signer_cap,
            package_published_events: account::new_event_handle<PackagePublishedEvent>(&resource_signer),
            package_endorsed_events: account::new_event_handle<PackageEndorsedEvent>(&resource_signer),
            package_tipped_events: account::new_event_handle<PackageTippedEvent>(&resource_signer),
            endorser_registered_events: account::new_event_handle<EndorserRegisteredEvent>(&resource_signer),
        };

        // Move registry to resource account
        move_to(&resource_signer, registry);
    }

    /// Public entry point to initialize the registry after deployment
    public entry fun initialize_registry(admin: &signer) {
        init_module(admin);
    }

    // ================================
    // Core Publication Functions
    // ================================

    /// Tip a package developer
    public entry fun tip_package(
        tipper: &signer,
        name: String,
        version: String,
        amount: u64
    ) acquires PackageRegistry {
        let tipper_addr = signer::address_of(tipper);
        let registry = borrow_global_mut<PackageRegistry>(@apm_registry);
        
        // Generate package identifier
        let pkg_id = package_id(&name, &version);
        
        // Check if package exists
        assert!(table::contains(&registry.packages, pkg_id), E_PACKAGE_NOT_FOUND);
        
        // Get package metadata
        let package = table::borrow_mut(&mut registry.packages, pkg_id);
        
        // TODO: Transfer APT coins from tipper to publisher
        // This would integrate with Aptos coin module
        // For now, just record the tip amount
        
        // Update tip amount
        package.total_tips = package.total_tips + amount;
        
        // Emit event
        event::emit_event(&mut registry.package_tipped_events, PackageTippedEvent {
            name,
            version,
            tipper: tipper_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Publish a new package to the registry
    public entry fun publish_package(
        publisher: &signer,
        name: String,
        version: String,
        ipfs_hash: String,
        package_type: u8,
        tags: vector<String>,
        description: String,
    ) acquires PackageRegistry {
        let publisher_addr = signer::address_of(publisher);
        let registry = borrow_global_mut<PackageRegistry>(@apm_registry);
        
        // Validate inputs
        assert!(validate_package_name(&name), E_INVALID_PACKAGE_NAME);
        assert!(validate_version(&version), E_INVALID_VERSION);
        assert!(validate_ipfs_hash(&ipfs_hash), E_INVALID_IPFS_HASH);
        assert!(validate_package_type(package_type), E_INVALID_PACKAGE_TYPE);
        
        // Generate package identifier
        let pkg_id = package_id(&name, &version);
        
        // Check if package already exists
        assert!(!table::contains(&registry.packages, pkg_id), E_PACKAGE_ALREADY_EXISTS);
        
        // Create package metadata
        let package_metadata = PackageMetadata {
            name: name,
            version: version,
            publisher: publisher_addr,
            ipfs_hash,
            endorsements: vector::empty(),
            timestamp: timestamp::now_seconds(),
            package_type,
            download_count: 0,
            total_tips: 0,
            tags,
            description,
        };
        
        // Add to registry
        table::add(&mut registry.packages, pkg_id, package_metadata);
        vector::push_back(&mut registry.package_list, pkg_id);
        
        // Update package versions tracking
        if (table::contains(&registry.package_versions, name)) {
            let versions = table::borrow_mut(&mut registry.package_versions, name);
            vector::push_back(versions, version);
        } else {
            let versions = vector::empty();
            vector::push_back(&mut versions, version);
            table::add(&mut registry.package_versions, name, versions);
        };
        
        // Update stats
        registry.total_packages = registry.total_packages + 1;
        
        // Emit event
        event::emit_event(&mut registry.package_published_events, PackagePublishedEvent {
            name: package_metadata.name,
            version: package_metadata.version,
            publisher: publisher_addr,
            package_type,
            timestamp: package_metadata.timestamp,
        });
    }

    /// Register as an endorser (requires staking)
    public entry fun register_endorser(
        endorser: &signer,
        stake_amount: u64,
    ) acquires PackageRegistry {
        let endorser_addr = signer::address_of(endorser);
        let registry = borrow_global_mut<PackageRegistry>(@apm_registry);
        
        // Validate minimum stake
        assert!(stake_amount >= MIN_ENDORSER_STAKE, E_INSUFFICIENT_STAKE);
        
        // Check if already registered
        assert!(!table::contains(&registry.endorsers, endorser_addr), E_ALREADY_ENDORSED);
        
        // TODO: Transfer stake amount (would integrate with APT coin transfer)
        // For now, we'll just record the stake amount
        
        // Create endorser info
        let endorser_info = EndorserInfo {
            endorser: endorser_addr,
            stake_amount,
            is_active: true,
            reputation: 50, // Start with neutral reputation
            packages_endorsed: 0,
            registered_at: timestamp::now_seconds(),
        };
        
        // Add to registry
        table::add(&mut registry.endorsers, endorser_addr, endorser_info);
        registry.total_endorsers = registry.total_endorsers + 1;
        
        // Emit event
        event::emit_event(&mut registry.endorser_registered_events, EndorserRegisteredEvent {
            endorser: endorser_addr,
            stake_amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ================================
    // View Functions
    // ================================

    #[view]
    /// Get package metadata by name and version
    public fun get_package_metadata(name: String, version: String): PackageMetadata acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        let pkg_id = package_id(&name, &version);
        assert!(table::contains(&registry.packages, pkg_id), E_PACKAGE_NOT_FOUND);
        *table::borrow(&registry.packages, pkg_id)
    }

    #[view]
    /// Get all versions of a package
    public fun get_package_versions(name: String): vector<String> acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        if (table::contains(&registry.package_versions, name)) {
            *table::borrow(&registry.package_versions, name)
        } else {
            vector::empty()
        }
    }

    #[view]
    /// Get endorser information
    public fun get_endorser_info(endorser: address): EndorserInfo acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        assert!(table::contains(&registry.endorsers, endorser), E_ENDORSER_NOT_AUTHORIZED);
        *table::borrow(&registry.endorsers, endorser)
    }

    #[view]
    /// Get total number of packages
    public fun get_total_packages(): u64 acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        registry.total_packages
    }

    #[view]
    /// Get total number of endorsers
    public fun get_total_endorsers(): u64 acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        registry.total_endorsers
    }

    #[view]
    /// Check if package exists
    public fun package_exists(name: String, version: String): bool acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        let pkg_id = package_id(&name, &version);
        table::contains(&registry.packages, pkg_id)
    }

    /// Endorse a package (only registered endorsers)
    public entry fun endorse_package(
        endorser: &signer,
        name: String,
        version: String
    ) acquires PackageRegistry {
        let endorser_addr = signer::address_of(endorser);
        let registry = borrow_global_mut<PackageRegistry>(@apm_registry);
        
        // Check if endorser is registered
        assert!(table::contains(&registry.endorsers, endorser_addr), E_ENDORSER_NOT_AUTHORIZED);
        
        // Get endorser info
        let endorser_info = table::borrow_mut(&mut registry.endorsers, endorser_addr);
        
        // Check if endorser is active
        assert!(endorser_info.is_active, E_ENDORSER_NOT_AUTHORIZED);
        
        // Get package ID
        let pkg_id = package_id(&name, &version);
        
        // Check if package exists
        assert!(table::contains(&registry.packages, pkg_id), E_PACKAGE_NOT_FOUND);
        
        // Get package metadata
        let package = table::borrow_mut(&mut registry.packages, pkg_id);
        
        // Check if already endorsed
        assert!(!has_endorsement(package, endorser_addr), E_ALREADY_ENDORSED);
        
        // Add endorsement
        vector::push_back(&mut package.endorsements, endorser_addr);
        
        // Update endorser stats
        endorser_info.packages_endorsed = endorser_info.packages_endorsed + 1;
        
        // Emit event
        event::emit_event(&mut registry.package_endorsed_events, PackageEndorsedEvent {
            name,
            version,
            endorser: endorser_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    public fun search_packages(query: String): vector<PackageMetadata> acquires PackageRegistry {
        let registry = borrow_global<PackageRegistry>(@apm_registry);
        let results = vector::empty<PackageMetadata>();
        vector::for_each_ref(&registry.package_list, |pkg_id| {
            let pkg = table::borrow(&registry.packages, *pkg_id);
            let found = pkg.name == query
                || pkg.description == query
                || tags_contains_query(&pkg.tags, &query);
            if (found) {
                vector::push_back(&mut results, *pkg);
            }
        });
        results
    }

    fun tags_contains_query(tags: &vector<String>, query: &String): bool {
        let found = false;
        vector::for_each_ref(tags, |tag| {
            if (*tag == *query) {
                found = true;
            }
        });
        found
    }

    // ================================
    // Admin Functions
    // ================================

    #[view]
    /// Admin function to get registry address
    public fun get_registry_address(): address {
        @apm_registry
    }

    // ================================
    // Test-only Functions
    // ================================

    #[test_only]
    /// Simple test initialization 
    public fun init_for_test(framework: &signer) {
        use aptos_framework::account;
        
        let admin_addr = signer::address_of(framework);
        
        // Create a simple resource account for testing
        let (resource_signer, signer_cap) = account::create_resource_account(framework, b"test_seed");
        
        // Initialize the registry with all required fields
        let registry = PackageRegistry {
            packages: table::new(),
            endorsers: table::new(),
            package_list: vector::empty(),
            package_versions: table::new(),
            total_packages: 0,
            total_endorsers: 0,
            admin: admin_addr,
            signer_cap,
            package_published_events: account::new_event_handle<PackagePublishedEvent>(&resource_signer),
            package_endorsed_events: account::new_event_handle<PackageEndorsedEvent>(&resource_signer),
            package_tipped_events: account::new_event_handle<PackageTippedEvent>(&resource_signer),
            endorser_registered_events: account::new_event_handle<EndorserRegisteredEvent>(&resource_signer),
        };

        // Move registry to the framework signer address for testing
        move_to(framework, registry);
    }

    #[test_only]
    /// Get package name for testing
    public fun get_package_name(package: &PackageMetadata): String {
        package.name
    }

    #[test_only]
    /// Get package version for testing
    public fun get_package_version(package: &PackageMetadata): String {
        package.version
    }

    #[test_only]
    /// Get package publisher for testing
    public fun get_package_publisher(package: &PackageMetadata): address {
        package.publisher
    }

    #[test_only]
    /// Get package type for testing
    public fun get_package_type(package: &PackageMetadata): u8 {
        package.package_type
    }

    #[test_only]
    /// Get package download count for testing
    public fun get_package_download_count(package: &PackageMetadata): u64 {
        package.download_count
    }

    #[test_only]
    /// Get package total tips for testing
    public fun get_package_total_tips(package: &PackageMetadata): u64 {
        package.total_tips
    }

    #[test_only]
    /// Get endorser address for testing
    public fun get_endorser_address(endorser_info: &EndorserInfo): address {
        endorser_info.endorser
    }

    #[test_only]
    /// Get endorser stake amount for testing
    public fun get_endorser_stake_amount(endorser_info: &EndorserInfo): u64 {
        endorser_info.stake_amount
    }

    #[test_only]
    /// Get endorser active status for testing
    public fun get_endorser_is_active(endorser_info: &EndorserInfo): bool {
        endorser_info.is_active
    }

    #[test_only]
    /// Get endorser reputation for testing
    public fun get_endorser_reputation(endorser_info: &EndorserInfo): u64 {
        endorser_info.reputation
    }

    #[test_only]
    /// Get endorser packages endorsed count for testing
    public fun get_endorser_packages_endorsed(endorser_info: &EndorserInfo): u64 {
        endorser_info.packages_endorsed
    }
    
    #[test_only]
    /// Get package endorsements for testing
    public fun get_package_endorsements(package: &PackageMetadata): vector<address> {
        package.endorsements
    }
} 
#[test_only]
module apm_registry::test_registry {
    use std::string::{Self, String, utf8};
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_std::debug;
    
    use apm_registry::registry::{Self, PackageMetadata, EndorserInfo};

    // ================================
    // Test Constants
    // ================================
    
    const TEST_PACKAGE_NAME: vector<u8> = b"test-package";
    const TEST_VERSION: vector<u8> = b"1.0.0";
    const TEST_IPFS_HASH: vector<u8> = b"QmTestHash123456789";
    const TEST_DESCRIPTION: vector<u8> = b"A test package for Move development";
    const TEST_STAKE_AMOUNT: u64 = 100000000; // 1 APT in octas
    
    // ================================
    // Helper Functions
    // ================================
    
    fun setup_test_accounts(): (signer, signer, signer) {
        let framework = account::create_account_for_test(@0x1);
        let admin = account::create_account_for_test(@apm_registry);
        let publisher = account::create_account_for_test(@0x123);
        let endorser = account::create_account_for_test(@0x456);
        
        // Initialize timestamp with the framework account
        timestamp::set_time_has_started_for_testing(&framework);
        
        (admin, publisher, endorser)
    }
    
    fun create_test_tags(): vector<String> {
        let tags = vector::empty<String>();
        vector::push_back(&mut tags, utf8(b"utility"));
        vector::push_back(&mut tags, utf8(b"defi"));
        tags
    }

    // ================================
    // Package Publication Tests
    // ================================

    #[test]
    fun test_publish_package_success() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Publish a package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0, // library type
            tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Verify package exists
        assert!(registry::package_exists(utf8(TEST_PACKAGE_NAME), utf8(TEST_VERSION)), 1);
        
        // Verify package metadata
        let package = registry::get_package_metadata(utf8(TEST_PACKAGE_NAME), utf8(TEST_VERSION));
        assert!(registry::get_package_name(&package) == utf8(TEST_PACKAGE_NAME), 2);
        assert!(registry::get_package_version(&package) == utf8(TEST_VERSION), 3);
        assert!(registry::get_package_publisher(&package) == signer::address_of(&publisher), 4);
        assert!(registry::get_package_type(&package) == 0, 5);
        assert!(registry::get_package_download_count(&package) == 0, 6);
        assert!(registry::get_package_total_tips(&package) == 0, 7);
        
        // Verify total packages count
        assert!(registry::get_total_packages() == 1, 8);
    }

    #[test]
    fun test_publish_template_package() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Publish a template package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(b"template-package"),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            1, // template type
            tags,
            utf8(b"A test template package"),
        );
        
        // Verify package metadata
        let package = registry::get_package_metadata(utf8(b"template-package"), utf8(TEST_VERSION));
        assert!(registry::get_package_type(&package) == 1, 1);
    }

    #[test]
    fun test_publish_multiple_versions() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        let package_name = utf8(TEST_PACKAGE_NAME);
        let tags = create_test_tags();
        
        // Publish version 1.0.0
        registry::publish_package_test(
            &publisher,
            package_name,
            utf8(b"1.0.0"),
            utf8(TEST_IPFS_HASH),
            0,
            copy tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Publish version 1.1.0
        registry::publish_package_test(
            &publisher,
            package_name,
            utf8(b"1.1.0"),
            utf8(b"QmNewHash123456789"),
            0,
            copy tags,
            utf8(b"Updated test package"),
        );
        
        // Verify both versions exist
        assert!(registry::package_exists(package_name, utf8(b"1.0.0")), 1);
        assert!(registry::package_exists(package_name, utf8(b"1.1.0")), 2);
        
        // Verify package versions
        let versions = registry::get_package_versions(package_name);
        assert!(vector::length(&versions) == 2, 3);
        assert!(vector::contains(&versions, &utf8(b"1.0.0")), 4);
        assert!(vector::contains(&versions, &utf8(b"1.1.0")), 5);
        
        // Verify total packages count
        assert!(registry::get_total_packages() == 2, 6);
    }

    #[test]
    #[expected_failure(abort_code = registry::E_PACKAGE_ALREADY_EXISTS)]
    fun test_publish_duplicate_package_fails() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        let tags = create_test_tags();
        
        // Publish package first time
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            copy tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Try to publish the same package again - should fail
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            tags,
            utf8(TEST_DESCRIPTION),
        );
    }

    // ================================
    // Endorser Registration Tests
    // ================================

    #[test]
    fun test_register_endorser_success() {
        let (admin, _publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Register endorser
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
        
        // Verify endorser registration
        let endorser_info = registry::get_endorser_info(signer::address_of(&endorser));
        assert!(registry::get_endorser_address(&endorser_info) == signer::address_of(&endorser), 1);
        assert!(registry::get_endorser_stake_amount(&endorser_info) == TEST_STAKE_AMOUNT, 2);
        assert!(registry::get_endorser_is_active(&endorser_info) == true, 3);
        assert!(registry::get_endorser_reputation(&endorser_info) == 50, 4);
        assert!(registry::get_endorser_packages_endorsed(&endorser_info) == 0, 5);
        
        // Verify total endorsers count
        assert!(registry::get_total_endorsers() == 1, 6);
    }

    #[test]
    #[expected_failure(abort_code = registry::E_INSUFFICIENT_STAKE)]
    fun test_register_endorser_insufficient_stake_fails() {
        let (admin, _publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Try to register with insufficient stake - should fail
        registry::register_endorser_test(&endorser, 1000); // Less than minimum stake
    }

    #[test]
    #[expected_failure(abort_code = registry::E_ALREADY_ENDORSED)]
    fun test_register_endorser_twice_fails() {
        let (admin, _publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Register endorser first time
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
        
        // Try to register the same endorser again - should fail
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
    }

    // ================================
    // View Function Tests
    // ================================

    #[test]
    fun test_get_package_versions_empty() {
        let (admin, _publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Get versions for non-existent package
        let versions = registry::get_package_versions(utf8(b"non-existent-package"));
        assert!(vector::length(&versions) == 0, 1);
    }

    #[test]
    #[expected_failure(abort_code = registry::E_PACKAGE_NOT_FOUND)]
    fun test_get_package_metadata_nonexistent_fails() {
        let (admin, _publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Try to get metadata for non-existent package - should fail
        registry::get_package_metadata(utf8(b"non-existent"), utf8(b"1.0.0"));
    }

    #[test]
    #[expected_failure(abort_code = registry::E_ENDORSER_NOT_AUTHORIZED)]
    fun test_get_endorser_info_nonexistent_fails() {
        let (admin, _publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Try to get info for non-existent endorser - should fail
        registry::get_endorser_info(@0x999);
    }

    #[test]
    fun test_initial_state() {
        let (admin, _publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Verify initial state
        assert!(registry::get_total_packages() == 0, 1);
        assert!(registry::get_total_endorsers() == 0, 2);
        assert!(registry::get_registry_address() == @apm_registry, 3);
    }

    // ================================
    // Integration Tests
    // ================================

    #[test]
    fun test_complete_workflow() {
        let (admin, publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Register endorser
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
        
        // Publish multiple packages
        let tags = create_test_tags();
        
        registry::publish_package_test(
            &publisher,
            utf8(b"package-1"),
            utf8(b"1.0.0"),
            utf8(b"QmHash1"),
            0,
            copy tags,
            utf8(b"First package"),
        );
        
        registry::publish_package_test(
            &publisher,
            utf8(b"package-2"),
            utf8(b"2.0.0"),
            utf8(b"QmHash2"),
            1,
            tags,
            utf8(b"Second package"),
        );
        
        // Verify final state
        assert!(registry::get_total_packages() == 2, 1);
        assert!(registry::get_total_endorsers() == 1, 2);
        
        // Verify packages exist
        assert!(registry::package_exists(utf8(b"package-1"), utf8(b"1.0.0")), 3);
        assert!(registry::package_exists(utf8(b"package-2"), utf8(b"2.0.0")), 4);
        
        // Verify package metadata
        let package1 = registry::get_package_metadata(utf8(b"package-1"), utf8(b"1.0.0"));
        let package2 = registry::get_package_metadata(utf8(b"package-2"), utf8(b"2.0.0"));
        
        assert!(registry::get_package_type(&package1) == 0, 5); // library
        assert!(registry::get_package_type(&package2) == 1, 6); // template
        
        assert!(registry::get_package_publisher(&package1) == signer::address_of(&publisher), 7);
        assert!(registry::get_package_publisher(&package2) == signer::address_of(&publisher), 8);
    }

    // ================================
    // Package Tipping Tests
    // ================================

    #[test]
    fun test_tip_package_success() {
        let (admin, publisher, tipper) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Publish a package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Tip the package
        let tip_amount: u64 = 5000000; // 0.05 APT
        registry::tip_package(
            &tipper,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            tip_amount
        );
        
        // Verify tip was recorded
        let package = registry::get_package_metadata(utf8(TEST_PACKAGE_NAME), utf8(TEST_VERSION));
        assert!(registry::get_package_total_tips(&package) == tip_amount, 1);
        
        // Tip again to test cumulative tips
        registry::tip_package(
            &tipper,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            tip_amount
        );
        
        // Verify tips accumulated
        let package = registry::get_package_metadata(utf8(TEST_PACKAGE_NAME), utf8(TEST_VERSION));
        assert!(registry::get_package_total_tips(&package) == tip_amount * 2, 2);
    }

    #[test]
    #[expected_failure(abort_code = registry::E_PACKAGE_NOT_FOUND)]
    fun test_tip_nonexistent_package_fails() {
        let (admin, _publisher, tipper) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Try to tip non-existent package - should fail
        registry::tip_package(
            &tipper,
            utf8(b"non-existent"),
            utf8(b"1.0.0"),
            1000000
        );
    }

    // ================================
    // Package Endorsement Tests
    // ================================

    #[test]
    fun test_endorse_package_success() {
        let (admin, publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Register endorser
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
        
        // Publish a package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Endorse the package
        registry::endorse_package(
            &endorser,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION)
        );
        
        // Verify endorsement was recorded
        let package = registry::get_package_metadata(utf8(TEST_PACKAGE_NAME), utf8(TEST_VERSION));
        let endorsements = registry::get_package_endorsements(&package);
        assert!(vector::length(&endorsements) == 1, 1);
        assert!(*vector::borrow(&endorsements, 0) == signer::address_of(&endorser), 2);
        
        // Verify endorser stats updated
        let endorser_info = registry::get_endorser_info(signer::address_of(&endorser));
        assert!(registry::get_endorser_packages_endorsed(&endorser_info) == 1, 3);
    }

    #[test]
    #[expected_failure(abort_code = registry::E_ENDORSER_NOT_AUTHORIZED)]
    fun test_endorse_without_registration_fails() {
        let (admin, publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Publish a package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Try to endorse without being registered - should fail
        registry::endorse_package(
            &endorser,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION)
        );
    }

    #[test]
    #[expected_failure(abort_code = registry::E_ALREADY_ENDORSED)]
    fun test_endorse_twice_fails() {
        let (admin, publisher, endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        // Register endorser
        registry::register_endorser_test(&endorser, TEST_STAKE_AMOUNT);
        
        // Publish a package
        let tags = create_test_tags();
        registry::publish_package_test(
            &publisher,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION),
            utf8(TEST_IPFS_HASH),
            0,
            tags,
            utf8(TEST_DESCRIPTION),
        );
        
        // Endorse the package
        registry::endorse_package(
            &endorser,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION)
        );
        
        // Try to endorse the same package again - should fail
        registry::endorse_package(
            &endorser,
            utf8(TEST_PACKAGE_NAME),
            utf8(TEST_VERSION)
        );
    }

    // ================================
    // Edge Case Tests
    // ================================

    #[test]
    fun test_empty_package_name_validation() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        let tags = create_test_tags();
        
        // This should test the validation function - we expect it to fail for empty names
        // The actual validation logic would be implemented in the validate_package_name function
    }

    #[test]
    fun test_long_package_name_validation() {
        let (admin, publisher, _endorser) = setup_test_accounts();
        
        // Initialize the registry
        registry::init_for_test(&admin);
        
        let tags = create_test_tags();
        
        // Test with very long package name
        let long_name = utf8(b"this-is-a-very-long-package-name-that-might-exceed-reasonable-limits-for-package-names-in-the-registry-system");
        
        // This would test the validation - implementation dependent
    }
} 
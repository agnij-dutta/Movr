module demo_package::demo_package {
    use std::signer;
    use std::string::String;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    /// Resource to store module data
    struct ModuleData has key {
        value: u64,
        message: String,
    }

    /// Initialize the module
    public entry fun initialize(account: &signer, initial_value: u64, message: String) {
        let account_addr = signer::address_of(account);
        assert!(!exists<ModuleData>(account_addr), E_ALREADY_INITIALIZED);
        
        move_to(account, ModuleData {
            value: initial_value,
            message,
        });
    }

    /// Update the stored value
    public entry fun update_value(account: &signer, new_value: u64) acquires ModuleData {
        let account_addr = signer::address_of(account);
        assert!(exists<ModuleData>(account_addr), E_NOT_INITIALIZED);
        
        let module_data = borrow_global_mut<ModuleData>(account_addr);
        module_data.value = new_value;
    }

    /// Get the stored value
    #[view]
    public fun get_value(addr: address): u64 acquires ModuleData {
        assert!(exists<ModuleData>(addr), E_NOT_INITIALIZED);
        borrow_global<ModuleData>(addr).value
    }

    /// Get the stored message
    #[view]
    public fun get_message(addr: address): String acquires ModuleData {
        assert!(exists<ModuleData>(addr), E_NOT_INITIALIZED);
        borrow_global<ModuleData>(addr).message
    }
}

#[test_only]
module demo_package::demo_package_tests {
    use demo_package::demo_package;
    use std::string;
    use std::signer;

    #[test(account = @demo_package)]
    public fun test_initialize(account: &signer) {
        let addr = signer::address_of(account);
        demo_package::initialize(account, 42, string::utf8(b"Hello, Aptos!"));
        
        assert!(demo_package::get_value(addr) == 42, 0);
        assert!(demo_package::get_message(addr) == string::utf8(b"Hello, Aptos!"), 1);
    }

    #[test(account = @demo_package)]
    public fun test_update_value(account: &signer) {
        let addr = signer::address_of(account);
        demo_package::initialize(account, 42, string::utf8(b"Hello, Aptos!"));
        demo_package::update_value(account, 100);
        
        assert!(demo_package::get_value(addr) == 100, 0);
    }
}

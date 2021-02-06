Firewall
========

Since we can't trust data coming from other peers, we need a firewall to 
- defend spam attacks, which probably fills up your local DB
- reject invalid data
    - wrong signature
    - wrong formats
    - too large (refers to spam)

Extended Firewall, base firewall @see also /evolux.everblack/doc/firewall.md

## Validator Plugins
Plugins to check if the object to be stored in the local DB
meet (business) requirements. Signatures are already checked,
of course there may be additional signatures to check.
- Plugins for 'put' in everblack firewall
- check if dispatched object content fits to the settings
- settings will be received with the first sync and are signed be the admin

e.g. check if Thatsme Channel is Chat or Comment when received

## Blacklists

Block hashes/addresses from matter (gun,ipfs,ethereum,...)

## Repositories

Block repository entries, keys (signatures)
(Software) components loaded are always under control of the device owner (identity)

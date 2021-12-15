Firewall
========

Akrobath: Akrobath wurde schließlich von Harno zum Wächter über das Tacintherkol (Raumschiffsfriedhof) ernannt

Since we can't trust data coming from other peers, we need a firewall to 
- defend spam attacks, which probably fills up your local DB
- reject invalid data
    - wrong signature
    - wrong formats
    - too large (refers to spam)

Extended Firewall, base firewall @see also /evolux.everblack/doc/firewall.md

- strictly enforce same origin

## Validator Plugins
Plugins to check if the object to be stored in the local DB
meet (business) requirements: Business Firewall
- reject 'put'
- or mark 'put' with additional information (e.g. unwanted content)
    - listen to admin release

Signatures are already checked, of course there may be additional signatures to check.
- Plugins for 'put' in everblack firewall
- check if dispatched object content fits to the settings
- settings will be received with the first sync and are signed by the admin
- ! check attest of modifier if allowed

Value and state permissions (on all listening peers)
- function evaluates -> reject or accept
- reusable in UI and in firewall to reduce transfer and load

e.g. check if Thatsme Channel 
-  is Chat or Comment when received
- forbidden message content ()

## PermissionManager

Hierarchical set of managers
- top: system policy
    - transitions
        - user changes
        - to online/offline
        - start/end progress (requests)
    - states
        - is signed on 
        - online/offline
        - in progress (requests)
- bound to entity
    - transitions
        - changes of properties
        - 
    - states
        - exists
        - value is in domain

## Blacklists

Block hashes/addresses from matter (gun,ipfs,ethereum,...)

## Repositories

Block repository entries, keys (signatures)
(Software) components loaded are always under control of the device owner (identity)

--> see [Java SecurityManager](https://docs.oracle.com/javase/tutorial/essential/environment/security.html)

## Contracts

Evaluate contract to accept a change

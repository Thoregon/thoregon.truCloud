truCloud
========

## Nodes
- define your own nodes
    - each node gets an id and a keypair
    - nameservice for node id's
- offer services to others

## Transactions

sync Entities (snapshots) by an ascending transaction number.
The number is maintained by a [CRDT](https://github.com/yjs/yjs#Yjs-CRDT-Algorithm) COUNTER
neither timestamps nor timearrays are used for sync.  

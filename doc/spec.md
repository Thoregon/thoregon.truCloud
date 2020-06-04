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

## Galaxies

Build your own galaxy with your own stars. A galaxy can be seen for others,
but neither accessed nor discovered. Others can be granted to see some content or
use some functions of your galaxy. 

## Stars

This is a thoregon node, which may belong to a galaxy.  Lone stars can exist, but it should
do backups of its local DB because there may no replication on another node.

## Webapps (PWA)

The truCloud enables a URL/URI mapping to publish multiple Webapps from one star (thoregon node)
or a galaxy.

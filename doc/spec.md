truCloud
========

## Nodes
- define your own nodes
    - each node gets an id and a keypair
    - nameservice for node id's
- offer services to others

## Repository
Provides a public universe wide but structured repository for components.
--> see homebrew as example 

## Transactions

sync Entities (snapshots) (ascending transaction number?).
Transactions are maintained by using [CRDT](https://github.com/yjs/yjs#Yjs-CRDT-Algorithm) (COUNTER?)
neither timestamps nor timearrays are used for sync.  

Tacintherkol ... name of the Repositories   (https://www.perrypedia.de/wiki/Tacintherkol)
Akrobath     ... permission system          (Wächter über Tacintherkol)

## Galaxies

Build your own galaxy with your own stars. A galaxy can be seen for others,
but neither accessed nor discovered. Others can be granted to see some content or
use some functions of your galaxy. 

A galaxy can be seen similar to a repository.

The galaxy Ammandul is the public library/repository. 

## Stars

This is a thoregon node, which may belong to a galaxy.  Lone stars can exist, but it should
do backups of its local DB because there may no replication on another node.

## Webapps (PWA)

The truCloud enables a URL/URI mapping to publish multiple Webapps from one star (thoregon node)
or a galaxy.

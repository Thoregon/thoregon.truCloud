truCloud
========

TruCloud integrates persistent Objects of any kind to the universe
- DB                persistent data, GUN
- Files             persistent files, IPFS, FileCoin
- Transactions      persistent guarantied transations, Tendermint (Ethereum, Bitcoin, ...)

## Repository
Provides a public universe wide but structured repository for components.
--> see homebrew as example 
In the repository all published components are available.
Components can be:
- apps
- bounded contexts
- source codes and versions (git)

DORIFER     ... name of the Repositories   (https://www.perrypedia.de/wiki/DORIFER)
ARCHETIM    ... permission system          (https://www.perrypedia.de/wiki/ARCHETIM, der Beschützer, Einleitung der Retroversion von DORIFER)

## Transactions

sync Entities (snapshots) (ascending transaction number?).
Transactions are maintained by using [CRDT](https://github.com/yjs/yjs#Yjs-CRDT-Algorithm) (COUNTER?)
neither timestamps nor timearrays are used for sync.  


## Galaxies

Build your own galaxy with your own stars. A galaxy can be seen for others,
but neither accessed nor discovered. Others can be granted to see some content or
use some functions of your galaxy. 

A galaxy can be seen as a cluster of peers owned an operated by someone 

The galaxy Ammandul provides the public library/repository.

### Stars

This is a thoregon node, which may belong to a galaxy.  Lone stars can exist, but it should
do backups of its local DB because there may no replication on another node.

There are storage space providers doing this. they get incentives to backup your data.

## Webapps (PWA)
--> KARTE
The truCloud enables a URL/URI mapping to publish multiple Webapps from one star (thoregon node)
or a galaxy.
Adding a URL to KARTE requires a singature matching the registered URL at the CA

## Components 

## Versions


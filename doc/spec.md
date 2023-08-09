truCloud
========

TruCloud integrates persistent Objects of any kind to the universe
- DB                persistent data, GUN
- Files             persistent files, IPFS, FileCoin
- Transactions      persistent guarantied transactions, own CRDT, Tendermint (Ethereum, Bitcoin, ...)


## Repositoies
Provides a public universe wide but structured repository for components.
--> see homebrew as example 
In the repository all published components are available.
Components can be:
- apps
- bounded contexts
- source codes and versions (git)


Names
- DORIFER     ... name of the Repositories   (https://www.perrypedia.de/wiki/DORIFER)
- ARCHETIM    ... persitence and permission system          (https://www.perrypedia.de/wiki/ARCHETIM, der Beschützer, Einleitung der Retroversion von DORIFER)
- Akrobath    ... firewall framework (Akrobath wurde schließlich von Harno zum Wächter über das Tacintherkol (Raumschiffsfriedhof) ernannt)


### Component Shop

A tool offering search features and categories (tags) to find components.

Includes a component manager for local peer. Each user has full control over the
local installation. Components can offer an emergency update.

Everblack components form an own category. The have to undergo a review process before
the can be published. 

### Signatures

A repository features a developer registry. Publishing components requires
the component to have a valid signature. Updates can only be published 
with a signature.

## Transactions

sync Entities (snapshots) (ascending transaction number?).
Transactions are maintained by using [CRDT](https://github.com/yjs/yjs#Yjs-CRDT-Algorithm) (COUNTER?)
neither timestamps nor time arrays used for sync.  


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
- https://www.heise.de/news/Safari-So-nutzt-man-kuenftig-Web-Apps-unter-macOS-14-9188466.html

## Components 

## Versions


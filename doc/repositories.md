Repositories
============

## Concept

### Evolux & Thoregon Components

### Terra Components

### Components & Modules

Each component/module can specify a mapping for 'import' to repository entries. 
The file 'repos.mjs' contains the mapping:

map a component with its name w/o a leading '/'
to a component path in a named repository

    export default {
        'component-name' : 'repo:reponame:/component/path',
        'component-name' : 'repo:reponame@version:/component/path',
        'component-name' : 'repo:reponame@latest:/component/path'
    }

use in code with import:

    import Component from '/component-name/lib/component.mjs'
    
resolves to: 'repo:reponame:/component/path/lib/component.mjs'

a SHA512 hash of the reponame - with the version if provided - prefixed with 'trepo:' will be used as content address (soul).
    reponame            ->  'trepo:reponame@root'
    reponame@version    ->  'trepo:reponame@version'
    reponame@latest     ->  'trepo:reponame@versionTaggedLatest'
    
new souls for new versions can only be occupied with a signature signed by the same key that was used for the root version.
the root entry also contains a list of available versions, tags for versions and a 'latest' (latest released) item. 

a component once released may be tagged as deprecated, but never can be withdrawn! This is to avoid invalidation
of other components relying on this component version.

caution: the 'latest' reference should only be used during dev & testing. production releases of components should
always reference to a version with which it was sucessfully tested. 

The component will be included (by AppStructure/Dorifer) when the component initially is loaded.
Unknown repos must be confirmed by the user. 
For each import, also for each partial import of just one file of a component, the 'repos.mjs' from the component
will be considered and used to resolve other imports.  

A mapping for the dev server can override the repo mapping to a local mapping for dev & testing. 

## Loaders

Repo Loaders:
- node: bootloader.addLoader RepoLoader
- browser: serviceworker register RepoLoader

registered in DORIFER
top thoregon repo in DORIFER -> AMMANDUL

persistent in MATTER
soul directly as constant in DORIFER
can only be maintained by THOREGON

For registering a domain as an app (component) reference
there must be a DNS entry a proof:
- TBD

Auto update
- malware check
- check for spy & surveillance functions 

Sticky versions
- define some components as sticky 
- Don't update, always requires manual action

Component Mapping 
- replace a component with another
- support user with API check
- version compatibility check  

! user always has  

REPOs can be free defines and referenced
Just 'tap' the repository on your device or your (private) galaxy
and also galaxies managed by you. 

## Directory

A repository is a Directory with a specialized schema

- everblack PublicStore (only owner can modify)
- references to repos
    - name, soul
    - description
- searchable

soul directly as constant in DORIFER
can only be maintained by THOREGON

## Structure 

- everblack PublicStore (only owner can modify)
- meta
    - repo name
    - dates: created, modified
    - owner, signature
    - description
    - licence
    - schema
        -> see addons
- availability
    - public
    - price
    - subscription
- entries
- URI

- addons
    - queries
    - commands
    - views
    - ...


## RepoEntry

- name
- version -> [semantic versioning](https://semver.org/)
- versionname
- content
    - specifies 

### Entry Classes
- DNS: a mapping from a DNS entry to a component
- APP: a unique name within this repo for an app. has access to UI. can provide an API
- SRV: a service component. no (direct) access to UI. provides an API
- LIB: a library component, can be referenced ba any other compoent, also libraries, but can't run standalone. can run only embedded in another (APP or SRV) component  

## Deploy to a REPO

- create a package (zip) or reference a directory

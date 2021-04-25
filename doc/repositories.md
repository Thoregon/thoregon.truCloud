Repositories
============

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

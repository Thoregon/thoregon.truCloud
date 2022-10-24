Repositories
============

!!! rename Component --> Library

## Concept

each SSI has an order list of repositories.
the repositories and entries will be loaded at start to the PULS.
to boot, the repositories with ist will be stored on each device on a local storage.
the entries will be synchronized once the universe (matter) is available 
- shelter  ... local on the device, can only be maintained by the user (SSI) and override every module
- thoregon ... system libs
- thatsme  ... SSI libs
- neuland  ... public repository 

when the SSI signs in the additional repos will be added
- xyz

the loaders will lookup where to get a component if not in cache.

each app can specify a mapping which version from a component it uses. (see components & modules)
if a repository is referenced which is not in the repos list of the SSI, the user must be asked
if it should be added 

## How it works

scenario A: unstained environment


scenario B: a local 'copy' of the repository list exists
- the repository entries of a referenced contains only 'used' components
- 

scenario C: enviroment is a service agent
- an SA is dedicated to an SSI
- on install it will get a reposiory list from the SA

- all loaders except the devloader maintains local caches to provide components faster
- updates for entries will need the allowance of the user 
  - auto update presets for some components
  - ask user to execute updates

### Protouniverse
- provides a boot repository 
  - default structure if nothing is available locally
  - get a local 'copy' of the repository list
    - only if this device is assigned to a single SSI
    - if multiple SSI use this device, it contains only public system entries from thoregon and thatsme
      - no shelter respo can be used in this case, it can only be applied when an SSI signs on
- hand over repository structure to puls (loaders) 

### Puls
- Loaders 
  - devloader
    - only in dev  mode
    - tries to get the requried modules from dev server, usually modules will be referenced on localhost
  - shelterloader
  - thoregonloader
    - loads all thoregon system modules
    - packaged to one single archive containing all modules for the target platform
    - platforms are 
  - repositoryloader

### SSI
- maintains a repository list
  - maintain entries in puls (loaders)
    - updates in repository entris
    - when adding apps/components
- can be adjusted on each device

### Repositories
- collection of components
- description, metainfo and sources for component

### App Store
- manage one or more repositories
- provides additional descriptions and documents
- enables composition for components
  - to higher level applications



## Formats

### Repository

Sample Repository Entry for the thatsme
````
// 
{
    modules    : [ 'thatsme-application', 'thatsme-module-messageprovider' ],
    publisher  : { 
        name: 'thatsme.plus',
        pubkeys : {
            spub: "aYuWl5u0rXkRApuhAv-eS-hrdrb4YXpAYJWinUUgmug.Nzw6iVxluP2apytVKx-d2BvQ5_8KyZOlEaT0bXgOFHg",
            epub: "HU5SfoYC8drGbybExYFA_4b5hC0gMdvEgEjGgvRXyaI.37719Ua1-wtW5I34ks0DcSBH1hb60c1tJOPoucaEbq0",
            apub: "21BDxXRPlb_hx1t0MGcbmTg6B8ZAdBxcZvhacN-sv_YfMLLLOaP-jFPysT_uw0ut3TW1NfbNAf4Z6hgFp7WIE-4KrBy56J_31DvNiomw6q7dnTKElr6M6cO45_ZGPwdLkUxMtuGfzA51dpHJ-35uSIHx_UKux0lGUQYdTSDQUABh4ou6o5nEjz3Wkmh8ecgm0BMCHyVT_rXT1TT8bjhHgXi5RSJIBzDTDjhJOyl7oMvfZo6-o2G7Xsek3Sxz2jSpuK2TxrSNvCPr8JTNjhfAr4UqQZL_-BYT1csCsiKyvUJt0WfFnRdGiXsFLobT7nyvgVYJjz8q5PB9pnmmzOOlTq4Nkbzkl_JCC8JUMQKOWgDNQmq8Fzv5D51v4Xsu2smPs7ItfnRSNcpk0LpBu_tIPa8eJ-AiY89QZNrkI3w6tRtYc-nebc4k7nh7Q3j9uZnKUeugiXuf1W2LOFGOPS99grXyfm8b14nxis-ggDnGZvNQRN1_pEilli0zcee4zQ57"
        },
    },
    licence    : 'MIT',
    description: '',
    latest     : '1.0.0',
    images     : {},
    notes      : [],
    issues     : [],
    versions: [
        {
            version  : '1.0.0',
            images   : {},      // each version may provide its own images
            notes    : [],
            tags     : [],
            sources  : [ 'https://thatsme.plus/modules/thatsme-application.zip' ],
            digest   : '',  // SHA256 digets of all components in the archive
            signature: '',  // the digest signed by publisher (verify with publisher public key)
        }
    ]
}
````

## User (SSI) Repo Collection

each SSI has its collection of repositories.
by default, the 'ssirepo', 'ammandul' and the 'neuland' repositories are available.

the user can add arbitrary repositories provided by others. this always involves the risk of installing malware.
we introduced a dashboard 'neuland extension repositories' where repositories can be rated and warnings can be posted.

the user can order the repositories, after 'ssirepo' and 'ammandul', the first repo which provides the component wins.
'ssirepo' and 'ammandul' always comes first.

the 'ssirepo' is the private repo of the SSI. the SSI can maintain this repo, add own components 
and also override components from other repos, also system modules from ammandul.  

for development there exists also a dev repository provider to
enable developers to code and debug on localhost. the dev repo always comes first.

### Evolux & Thoregon Components

### Terra Components

### Components & Modules

Each component/module can specify a mapping for 'import' to repository entries. 
The file 'libraries.mjs' contains the mapping:
--> puls: check with the referrer which app requires the import 


map a component with its name w/o a leading '/'
to a component path in a named repository

    export default {
        // lookup via name in thoregon main directory 
        'component-name' : 'repo:reponame:/component/path',
        'component-name' : 'repo:reponame@version:/component/path',
        'component-name' : 'repo:reponame@latest:/component/path'
        // via a directory registered in thoregon main directory
        'component-name' : 'repo:dirname:reponame:/component/path'
        'component-name' : 'repo:dirname:reponame@version:/component/path'
        'component-name' : 'repo:dirname:reponame@latest:/component/path'
        // direct access to soul (address), no version specified
        'component-name' : 'repo:#reposoul:/component/path',        
        // lookup via name -> build soul (address) with SHA512(name) 
        'component-name' : 'repo:&reponame:/component/path',        
    }

use in code with import:

    import Component from '/component-name/lib/component.mjs'
    
resolves to: 'repo:reponame:/component/path/lib/component.mjs'

when there is no directory specified to lookup the repository, a SHA512 hash 
of the reponame - with the version if provided - prefixed with 'repo:' will be used as content address (soul).

    reponame            ->  'repo:reponame@root'
    reponame@version    ->  'repo:reponame@version'
    reponame@latest     ->  'repo:reponame@versionTaggedLatest'
    
new souls for new versions can only be occupied with a signature signed by the same key that was used for the root version.
(caution: may need a consensus mechanism and/or a registry)
the root entry also contains a list of available versions, tags for versions and a 'latest' (latest released) item. 

a component once released may be tagged as deprecated, but never can be withdrawn! This is to avoid invalidation
of other components relying on this component version.

caution: the 'latest' reference should only be used during dev & testing. production releases of components should
always reference to a version with which it was sucessfully tested. 

The component will be included (by AppStructure/Dorifer) when the component initially is loaded.
Unknown repos must be confirmed by the user. 
For each import, also for each partial import of just one file of a component, the 'libraries.mjs' from the component
will be considered and used to resolve other imports.  

A mapping for the dev server can override the repo mapping to a local mapping for dev & testing. 

## Library (Archive) Structure

- archive as ZIP
- dirs
  - etc  ... meta info about the library
    - lib.json    ... properties from this library, shoul be the same as in the repository entry except the contained components
    - sig.json    ... contains the digest (SHA256) from all Components in this library signed by publisher (verify with public key) 
  - {componentName}  ... name of the component with this library
  - {componentName2} ... name of the component with this library
  - {componentName3} ... name of the component with this library

## Repository & Entries

- standard repos
  - thoregon
  - thatsme
  - neuland

- extended repos

### Entries

- Publisher must be allowed to add/modify entries
- Entry/Library Properties
  - name
  - description
  - version
  - tags
  - image (multiformat)
  - licence
  - contributors
  - digest     ... the digest (SHA256) from all Components in this library
  - signature  ... the digest (SHA256) signed by publisher (verify with public key)
  - urn to archive
- Archive
  - see [Library (Archive) Structure](./#Library-(Archive)-Structure)

### Namespaces

Repos offers namespaces to register multiple packages within one namespace

### Multipackages

one ZIP can contain multiple packages.
the repo will register all packages within the multi package.

### Versions

- The repos always delivers :latest if no version specified
- versions can be specified in 'libraries.mjs'

### Overrides

- users (ssi) can override repo entries
  - ssi overall
  - for a device
  - for an agent

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

Mediathek
=========

- for SSI
- for App

!! application designer decides if mediathek is 'used' or to which degree

- mediathek used
    - other SAs listens on mediathek, does quality encodings and pinning
- no mediathek (embedded)
    - api to request pinning/unpinning from SAs
- pinning will always be initiated by invoking the Mediathek

- private (encrypted)
- public (not encrypted)
- temp (?)

reuse media entries for same content id 

MediaEntity
- Content Hash (ID) to keep it unique (source)
- name
- description
- mimetype
    -> https://www.iana.org/assignments/media-types/media-types.xhtml
- preview
    - thumbnail
    - trailer
    - -> alt source
    - local file system -> chached, always available
    - browser: ask user for file access
- tags
    - multiple
- properties (key/value)
    - arbitrary
    - mime specific
        - mp3
        - exif
- date
    - created
    - modified
    - (deleted)
- permissions --> certs for  SSI's
    - owner(s)
    - editors
    - buyers 
- licences
- version history
    - migration history, e.g. deprecated urls 
- hidden/archive/attic

Additional properties, references the file descriptor, additional functionality by another component/app 
- CID (IPFS)
- folders (FileSystem App)
    - file in multiple folders (like symlink)
- notes (list): personal notes for SSI,  
- usage
    - embedded -> can not be referenced 
    - references to this entity -> garbage collection
    - statistics
        - at all
        - per device to optimize locale memory

to user (interface)
- app mappings: which apps can handle/edit this resource
    - e.g. document -> excel 

to storage        
- storages --> resolver!
    - list of multiple storages (URLs)
        - https 
        - ipfs, webtorrent, hypercore, ...
        - messengers: telegram, signal, ...
        - other video/media services (martin) e.g. vimeo, youtube, ...
            - credentials for read/write !
- alternative storage
    - e.g. multiple qualities 
    - alternative streams (see NTFS: https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/b134f29a-6278-4f3f-904f-5e58a713d2c5)
        - access with <URL>#<altname>
- alternative formats
    - set of formats 
        - per tag, e.g. 'icon'
        - per mimetype    
        - app defines alt formats
    - e.g. icon sizes
    - will be built for every/selected source/alt source
        - at first access
        - at once, sync change of alt formats --> NO 

## Registry for Adapters

View
- DisplayAdapter (App mapping)
- StorageAdapter (storages, alt storages)

Edit
- EditAdapter
- StorageAdapter (storages, alt storages)

## Use Cases

### use image

- file prompter with
    - from camera
    - mediathek
    - local
    - other storage services

### replace

- upload to storage(s)
- old add to history
- exchange hash
- edit properties 
    
## Storages

a content can be stored im multiple storage (same content)
used for migration and fault tolerance

### Credentials

for 'external' services credentials may be required

the SSI has a directory for credentials/certificates. the source stores a 'key' (random value)
to map to the credentials needed to access teh service (like vimeo, youtube, ...)

### Connect Store

- define (all) your accounts (credentials) for the store service
- list all content, don't create an entry everything to the mediathek
- user decides what to add to the mediathek
    - active by command
    - at first use

### Limits

- upload limit
- duration limit
- storage size 

--> alternative formats

### Select Storage

- exception e.g. not found
- app decides e.g. for summit from torrent
- max views
- manual select

## Mime Mapping

mapping mime to impl (class) to handle media data e.g. video player
(Martins MediaService)

- predefined mapping  
- app mapping: additionally provided by an app
- user overrides: user decides to use another impl

--> Repository!

## Folders & Tags

- folder: fix defined list of descriptors
- tags: virtual (search) folder with variable content
    - tag mapping will be stored: code <-> tag
    - tag management (similar to CID's)

## Migrations

create of new storages and migrations are user/admin decisions
--> credentials to other storage services

- migrate content to another storage
- select files
    - by tag(s)

## All Files Directory

- keep a directory in the mediathek for all file hashes with soul
- also 'embedded' files
- maintain usage (or define a query: where is the soul referenced)
    - garbage collection

## Alternatives to encryption

- 2 pieces
    - first 10 seconds, rest in another stream

## Video Players

--> https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API

- https://github.com/video-dev/hls.js/
    - https://github.com/moshisushi/hlsjs-ipfs-loader

- https://videojs.com/
    http://www2.videojs.com/
- https://mafintosh.github.io/playback/

--> https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
    https://developer.chrome.com/blog/media-session/

? can we use the hash fn from ipfs w/o add/upload
    -> apply the hash fn to the url to find out if it is used/pinned already 

## Media Specific Data & Features

### Streams & Collections

- Chapter
    - timecode
    - name, description
- Likes
    - timecode
    - who
    - overall
- Comments
    - timecode
    - who
    - overall
- Usage
    - statistics which sections will be viewed by the audience
    - overall

### Podcast Sources

## Adapters

### Storage

- source (storage system) defines adapter
- specifies a storage system
- PUT, GET, DELETE
    - PUT & DEL optional
- may need credentials 
    - for all
    - for a root in the storage system, if multiple accounts

#### HTTPS

- fetch/POST option keepalive (do the request even when the tab is closed)

#### IPFS & Pinning

Garbage Collection
- take usage (references to) 
- unpin/remove local

Pinning
- ServiceAgent of SSI
- Pinning Service from a Provider 

### UI

## Resumable Uploads

- upload to Service Agent (resumable)
- SA add to IPFS, Torrent, S3
- Storage! POC -> 2000 Videos
    
## Stockexchange for storage

- automated agents/bots

Mediathek
=========

application designer decides if mediathek is used or to which degree

- mediathek used
    - other SAs listens on mediathek, does quality encodings and pinning
- no mediathek (embedded)
    - api to request pinning/unpinning from SAs

- private (encrypted)
- public (not encrypted)
- temp (?)

reuse media entries for same content id 

MediaEntity
- name
- description
- mimetype
- source --> resolver!
    - https 
    - ipfs
    - messengers: telegram, signal, ...
- thumbnail/preview/trailer
- tags
    - multiple
- folders
    - file in multiple folders (like symlink)
- properties
    - arbitrary
    - mp3
    - exif
- date
    - created
    - modified
    - deleted
- content
    - multiple, different qualities
- meta content
    - alternative streams
- version history


? can we use the hash fn from ipfs w/o add/upload
    -> apply the hash fn to the url to find out if it is used/pinned already 

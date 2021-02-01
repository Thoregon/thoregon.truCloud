Persistent Content
==================

Thoregon uses content addressing in contrast to the WWW, where location addressing is used to identify data, 

URI's

## IPFS
uses content hashes as addresses, CIDv0 and CIDv1 formats [Base64 w/o '+' and '/', no padding]
- CID (content identifiers):    ipfs:cid:QmcRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF
- IPNS (Name Service):          ipfs:ns:QmcRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF

the CID format see:
the IPNS format see:

## Thoregon (Universe)
uses random generated addresses, 32 byte Base62 w/o padding [Base64 w/o '+' and '/']
- Data in Universe:             thoregon:universe:liwNpeSbxVMT8s8csrHuhOmFMdJ2AfmL     
- Thoregon Repository Entries:  thoregon:dorifer:liwNpeSbxVMT8s8csrHuhOmFMdJ2AfmL
uses public key JWT formated 
- Self Sovereign Identites:     did:thoregon:x-R54LXTEB_XUPn1FKeIVnJWTvDxyHNVe15_yXkNnO4.4fBdJmPJu-fU4hBWJputJB9337nUcH2DvNgB5aKF0tU

Thoregon uses also a CID (content identifier):
- the property '' at the spcified address
- in the property 'c' the content is available encrypted

## Ethereum
uses hash of public key hex formated with prefix "0x". 
- ethereum:0xb794f5ea0ba39494ce839613fffba74279579268


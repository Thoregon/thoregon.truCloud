PWA's
=====

1) browser redirect to ID url e.g.:

    http://pwa.thoregon.io  ->  http://pwa.thoregon.io/8Jur6PS4r0QEKvIybNzfXrOP
    
prevent reusing the URL e.g. if the user shares the URL 
How? Control the share API and send only URLs w/o the ID

Persistent codes stored in the local storage may be purged from the browser/system.

2) User required, store device information on the users universe entry
Device ID is stored in localStorage
If unkown device ask user
- is this any of the known  -> not a good idea
- or a new one

How to avoid sharing device settings between many devices.
How to avoid that someone else couple to the device




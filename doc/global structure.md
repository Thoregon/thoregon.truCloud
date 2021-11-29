# Global structure

+ universe    ... the global variable in Thoregon
    + dorifer           ... top level repository, provides access to modules and app and the app structure
    + Identity          ... interface for creating and handling identities
    + me                ... the current identity (interface)
    + app               ... the current app 
    + Everblack         ... crypto API's
        + SEA           ... low level but comfortable crypto API 
    + uiroter           ... router for userinterface
    + logger            ... use instead of 'console'
    + matter            ... direct access to stored objects. Does not perform any encryption/decryption, use for dev. 
    + Gun               ... Gun utils API
    + env               ... environment variable, typically only 
    - (availability, use w/o import) 
    + ThoregonObject    ... 
    + timeout()         ... await universe.timeout(ms)
    + doAsync()         ... await universe.doAsync()
    + className()       ... get the class name of an object
    + aurora
        + ViewModel     ... get a generic ViewModel instance: let vm = await universe.aurora.ViewModel();

+ thoregon    ... information settings
    + ui                is a UI available, true or false
    + isBrowser         is a Browser enviroment, true or false
    + isReliant         is Browser reliant, same as 'isBrowser' 
    + isNode            is a NodeJS environment, true or false
    + isSovereign       is Sovereign, runs standalone in a NodeJS environment. same as 'isNode'
    + nature            'reliant' or 'sovereeign' as text
    + density           in browser 'rich' or 'lite', in node 'headed' or 'headless'
    + embedded          , true or false
    + uitheme           : { value: 'material', configurable: false, enumerable: true, writable: false },
    + isDev             is in development mode, true or false
    + debug             is in debug mode, more verbose, true or false
    + birth             milliseconds when the instance has started
    + since             milliseconds since start
    + checkpoint        prints milliseconds since start + information text
    
## Toplevel Globals

+ universe              ... the global variable
+ thoregon              ... information settings
+ dorifer               ... top level repo
+ me                    ... the current identity (API)
    + ssi               ... the SSI (storeage)
+ app                   ... the current app (API)
    + current           ... the current app instance (storeage)
+ device                ... the current device (API)
    + current             ... the current device instance (storeage)

## Identity

+ me
    + ssi
        - (collections & directories)
        + credentials
        + contacts
        + agents
        + devices
        + repositories
        + properties  ? other name
        + apps
        -  (mappings & queries)
        + device        ... the current device  => device.current
        + app           ... the current app     => qpp.current
   + aliases --> future  ? which level

- hosted ssi -> key pairs from host system
- guest ssi  -> local keypairs, may be deleted later

## Application

+ app
    + current           ... the current app instance
    + widget            ... current widget
    + instances         ... collection of all instances for the user (= me.ssi.apps)
        + <instanceid>      ... an app instance referenced by its id
        + <instanceid>...

    

## Device

+ device
    + current           ... current device instance
    + instances         ... collection of device instances (= me.ssi.devices)

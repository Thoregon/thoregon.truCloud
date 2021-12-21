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
        + credentials   ... for each credential, a set of key pairs will be created. An alias can be attached to a credential if the provider is greedy (im terms of collecting personal data) 
        + contacts      ... there is also a channel for each contact implicit
        + channels      ... message channels subscribed by the user
        + wallets       ... check if it is a wallet is a credential
        + agents
        + devices
        + repositories
        + collections   ... an abritrary collection of objects and other sub collections collected by the user
        + apps
        + aliases       ... already created aliases with 'personal data'. use for greedy service providers.
        -  (mappings & queries)
        + device        ... the current device  => device.current
        + app           ... the current app     => qpp.current

- hosted ssi -> key pairs from host system
- guest ssi  -> local keypairs, may be deleted later, 

## Application

+ app
    + current           ... current app instance
    + widget            ... current widget
    + instances         ... collection of all instances for the user (= me.ssi.apps)
        + <instanceid>      ... an app instance referenced by its id
        + <instanceid>...

the structure inside the 'instance' is defined by the app developer

## Device

+ device
    + current           ... current device instance
    + instances         ... collection of device instances (= me.ssi.devices)

## Service Agent
- is only available on a node running as service agent

+ agent
    + current           ... current service agent
        + services      ... installed services available on this agent. On the service side the 'producer' will be delivered on access, on client side the 'consumer' will be instantiated
        + repositories  ... taped repositories used in this agent
        + device        ... the device the agent resides on, may also be a virtual machine or a container with limited resources
        + collection    ... an abritrary collection of objects and other subcollections collected by the user
    + instance          ... the other service agents belonging to the SSI. agents can communicate
        
A service is simmilar to an app. a service can also serve multiple instances (tenents).
the difference to the app in the UI is that all instances of the service are available.

+ service               ... simmilar to 'app'
    + current
    + instances

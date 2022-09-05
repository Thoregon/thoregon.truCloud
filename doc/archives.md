Archives
========

Don't bloatware. 
import finegrain, don't import huge modules for just one function

## Event Registries

### Dorifer

Dorifer is the main registry. Filters and Actions can be 
added in the 'index.mjs' of the component/app

### AuroraElement

Registry for UI element and setup events. 

## Subscriptions

dorifer.addAction()
dorifer.doAction()

- 
(UFD = UnifiedFileDescriptor)

UFD will always 'doAction' when it needs display/storage adapters

- UFD.displayAdapters
    - param: display adapter registry
    - add the display adapters provided by the module    
- UFD.storageAdapters
    - param: storage adapter registry
    - add the display adapters provided by the module   
    
     

dorifer.addAction('dvvfv', [obj, 'fnName']);
dorifer.addAction('dvvfv', fn);

dorifer.addAction('UFD.displayAdapters', (ufd, selector) => {
    if (VimeoAdapter.canHandle(ufd.store.url)) return VimeoAdapter;
})

### Mediathek

const media = universe.mediathek;

media.addAction('...', () => {});

media.addDisplayAdapter(adapter, { opts });     // opts.prority 1..10
media.addStorageAdapter(adapter, { opts });

----------------------
- Repository
    - lookup component (app)
    - has component.mjs -> import
    - else has index.mjs -> import
    - else analyse package

- ComponentDescriptor
    - from component.mjs if exists
    - create descriptor based on package analysis 
- ComponentStructure
    - name convention 
    - overridable by component
    - analyse package
- ThoregonApplication (thoregon.truCloud) instance
    - if implementation (subclass) exist use it
    - else create instance of ThoregonApplication with ComponentDescriptor and ComponentStructure
    - supply queries nd commands
    - prpare test data if missing
- AuroraApp (thoregon.aurora) instance
    - if implementation (subclass) exist use it (must register custom element)
    - else create instance of AuroraApp with ComponentDescriptor and ComponentStructure
        - register custom element, tag will be to app id
    - add as child to <thoregon-app> placeholder

----------------------

- mapping module/component to location
- each app supplies its own mapping
    - like package.lock with refernces to the used versions
- management
    - version updates
    
- extends evolux.dyncomponents by metadata
    - specify API
    - how it can be instantiated from matter (encrypted storage)

Persistent objects
- metadata
    - storage version to reinstantiate th right class or to adjust behavior 
- Completely encrypted storage, also metadata

## Repository

To use a repo just tap it. List existing entries in the repo.

Repo Entry Format


Versions

## User sovereignty

All components which are used (installed/cached) can be managed self-determined.
Repositories shows alternatives for components implementing the same API.
Updates can only be done with the consent of the user.

### Component Translation
In the local installation, there can be multiple components refernced for 
the same component id/version. 
- A default is defined
- A default translation can be defined
- A translation for each dependency can defined

## Sandbox

Components runs in a sandbox.
There is only the 'universe' read only, except a namespace for the component, available.
If the component needs document or window, the user must grant permission.

An API providing selected document and window function and properties must be used instead.
This API can be requested by the component and injected with their original names (document, window, global, globalThis)
into the components sandbox to avoid code changes.

There is only an exception for thoregon system components, and components
additionally signed by thoregon.
This applies only for components fetched from Dorifer. 

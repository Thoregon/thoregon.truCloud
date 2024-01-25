Versions & Migration
====================

## Define successor for a class

Import predecessor in new class, and specify it a checkin.

```JavaScript
// this file e.g.: lib/001.002.00/myclass.mjs

import PreMyClass from "../001.001.000/myclass.mjs";

export class MyClassMeta { /* ... */ }

export default class MyClass extends ThoregonEntity() { /* ... */ }

async function migrate(target, data, util) { /* ... */ };

MyClass.checkIn(import.meta, CheckoutSessionMeta, PreMyClass, migrate);

```

## Migration

when an entity should be restored:
- check class in dorifer
- is there a successor
  - create instance of successor
  - invoke migration with params
    - new instance of sucessors class
    - predecessor data as Object (not of predecessors class!)
      - note: references are not resolved to the entity
    - a util object wich provides helper methods:
- return restores entity

```JavaScript

```

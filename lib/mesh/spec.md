Mesh
====

A mesh defines peer-to-peer collaborations between participants. 
A logical set of services/producers working together.
Often a mesh represents a bounded context. 
It is defines for an identity - can also be a machine identity - and may
spread over all agents and devices of that identity.

Within a choreography, information is always exchanged between participants within or across trust boundaries.
The mesh connects the services/producers as defined. A relationship specification
defines which services/producers work together in which relation.
The connection is established by dependency injection.

A mesh has a lifecycle operated by a statemachine. 
The services/producers will be managed by the component manager (evolux.dyncomponents)
the mesh waever (mesh manager) sits on top of it.

The mesh is secured by strong authentication using credentials.

A service/producer can be part of multiple meshes.

A mesh can be spread over many agents. It may also include the 'current' device
the user is working with. 

Services/producers from other identities can also be part of the mesh. Authorization by credentials
can be required. Public/global services/producers can be discovered on public  

A mesh has no global description (orchestration). Instead each service/producer
expresses its required endpoints as a logical description. 
By dependency injection the physical endpoint will then be provided by the local mesh controller.

Reference services/producers by their ids/names, with 'instance' when required. 
Via lookup to all agents the service/producer will be discovered. The mesh weaver is a
service providing these lookups.

The same service/producer can be deployed on mutiple agent.

A mesh offers failover, starting/using a service/producer from another agent.

Work will be distributed with load balancing.

The mesh itself offers an API facade.
Offers also subscriptions.

The mesh provides observability by providing metrics. 

Wrapper to include [OpenAPI](https://www.openapis.org/) and a [AsyncAPI](https://www.asyncapi.com/)
as services/producers
The mesh facade API can itself be defined as OpenAPI (REST) and AsyncAPI to support legacy systems.

A mesh can also have multiple instances. This is analogous to app instances.
If an app instance is created, also a mesh instance will be created.

An application can provide a declaration which services/producers is needs to work.
--> see WS-CDL entities and declarations 
--> evolve to BPMN (2.0)
    - https://github.com/bpmn-io

  
## Classes

### MeshController

Manages the mesh on every agent/device by choreography (not orchestration). This is the preferred way in
a peer to peer environment.
Each mesh controller is responsible to instantiate/activate the parts of the mesh on the agent/device it is located.

--> https://geekexplains.blogspot.com/2008/07/ways-of-combining-web-services.html
 
### MeshWeaver

A singleton providing commands to control and create a mesh

- create mesh   with a JSON definition
- add service (producer)
- attach consumer 
- remove service (producer)
- detach consumer
- drop mesh

Stores and updates the mesh definitions.
Works with all mesh controllers on the agents to establish the mesh.

But keep in mind, there is no orchestration, the collaboration is done with choreography!
Each consumer must 'discover' its producers using the mesh weaver.
Discovery API for consumers to find the producers
- 

### Mesh Definition, each class is a ThoregonEntity and has a MetaClass 

- Mesh 

## Info

- https://training-course-material.com/index.php?title=WS-CDL&action=slide

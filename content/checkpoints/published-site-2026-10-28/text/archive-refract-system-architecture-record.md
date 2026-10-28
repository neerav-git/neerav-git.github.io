# Neerav Chaudhary

Source: https://neerav-git.github.io/archive/refract-system-architecture-record
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

ARCHITECTURE DIAGRAM
Refract system architecture

Frontend, FastAPI services, PostgreSQL state, ChromaDB retrieval, and file storage connected through the research-session model.

RELATED WORK
Refract project page
PRODUCT WORKFLOW, SCREENSHOTS, METHODOLOGY, AND EVALUATION.
Repository
IMPLEMENTATION SOURCE AND ARCHITECTURE DIAGRAM.
ON THIS PAGE
SYSTEM MAP
Five components share one research-session identifier

The diagram maps the React interface, FastAPI endpoints, PostgreSQL records, ChromaDB vectors, and stored files used by each research session.

Session IDs connect uploaded papers, extracted passages, saved evidence, datasets, and analysis runs.

SYSTEM READING
The architecture answers four practical questions

The diagram shows which component owns each interface, service, storage, and retrieval responsibility.

INTERFACE
Where does the research interaction happen?

The React interface provides Reader, Index, Compare, Review, and Stats workspaces.

WORKFLOW
Where is application logic coordinated?

FastAPI endpoints coordinate PDF ingestion, retrieval, saved evidence, comparisons, datasets, and analysis runs.

PERSISTENCE
What kinds of state need to survive?

PostgreSQL stores relational state, object storage holds uploaded files, and ChromaDB indexes document chunks for retrieval.

SESSION MODEL
How are records connected?

A shared session identifier associates papers, evidence, files, comparisons, and model outputs.

IMPLEMENTED RESPONSIBILITIES
The architecture follows the product workflow

Reader, comparison, and statistics screens each read and write session-scoped data.

The frontend selects the active session and presents each workspace. FastAPI routes validate requests and coordinate services. PostgreSQL stores structured relationships, ChromaDB retrieves document passages, and file storage retains uploaded papers and datasets.

Product screenshots demonstrate the implemented workspaces. Repository code and recorded analysis runs provide implementation evidence for the service and storage responsibilities shown here.

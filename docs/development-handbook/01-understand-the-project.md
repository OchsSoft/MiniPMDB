# Understand the project

## What MiniPMDB is for

MiniPMDB is a local notebook for facts that software assistants and people need to share without quietly turning every suggestion into a rule. It stores project decisions, constraints, risks, bugs, and evidence. A human reviews candidates before they become active guidance. Its dashboard lets you see the review queue, project records, relationships between projects, and an audit report.

Think of a workshop with labelled folders. A project is a folder; a memory is a written claim; a source is the receipt that supports the claim. A touchpoint is a note saying that two folders depend on the same agreement. The context builder packs selected notes into a small briefing for the next piece of work. The audit checks whether those notes and agreements are internally consistent. Neither operation proves that a claim is true in the outside world.

This is a standalone memory-governance product. It is not an autonomous coding runner, shell executor, deployment service, transcript collector, or remote hosting platform. Connecting an assistant through MCP gives it a defined memory interface. It does not give MiniPMDB authority to execute the assistant's proposed work.

## The three interfaces

The browser dashboard, CLI, and MCP server all use one foreground HTTP service. That service owns the MongoDB connection. The browser is the human review surface. The CLI is useful for repeatable, explicit commands. MCP is a line-oriented JSON-RPC interface used by an assistant application. MCP means Model Context Protocol: a common way for an assistant to discover named tools and call them.

There is no second private memory store inside the CLI or MCP process. If the service is stopped, those clients cannot read live records. Offline snapshot audit commands are a deliberate exception: they inspect an exported JSON file without contacting the service.

MongoDB is the canonical store, meaning it is the authoritative saved data. Context text is a derived view, like a printed agenda made from a filing cabinet. Do not edit a copied context pack and expect the database to change. The managed runtime uses persistent WiredTiger files under the application data directory. Despite the dependency's name, `mongodb-memory-server-core`, this configuration is not intended as a throwaway in-memory database.

## Vocabulary you will meet in the code

A schema defines the allowed shape of a record. Normalization cleans and checks an input before storage. An index helps MongoDB locate records and, for unique indexes, prevent duplicate identities. A snapshot is an export of all five collections at schema version 2. Provenance means where a claim came from and how it was reviewed. Supersession means a newer record replaces an older one while preserving the older record as history.

A candidate has status `draft` or `unreviewed`. Active statuses include `current`, `reviewed`, `open`, and `resolved`, subject to review metadata. A warning record may be draft, unreviewed, stale, or superseded. Archived and rejected records are excluded from ordinary context selection. Confidence is a separate field: `high` is an assertion of confidence, not a substitute for evidence or review.

A conflict link says that two claims disagree. Resolving it requires a reviewed active resolution record, rather than hiding the old disagreement. A touchpoint describes a cross-project API, shared library, data contract, workflow, deployment relationship, or other connection. Its project keys and referenced memories must belong together.

## Current implementation and evidence boundary

The source implements a loopback dashboard/API, persistent managed or external MongoDB storage, project registration, candidate capture, evidence attachment, human review, supersession, touchpoints, three context profiles, and structural governance audits. Node's built-in test runner covers service, API, MCP, runtime, context, and audit behavior. The application dependencies include the MongoDB driver and the managed MongoDB lifecycle library; this is not a dependency-free program.

This handbook is a source investigation at the pinned revision in the final chapter. It does not claim that a new database was launched, an assistant was connected, or the MongoDB binary was qualified on this NixOS machine while the handbook was written. The documentation's build and formatting checks are separate from those runtime acceptance tests. The existing short operations guide remains the quick reference once you know the system.

## Trust and privacy

The server binds to `127.0.0.1` and has no user login or per-user access-control system in the inspected API. A process that can reach the loopback API can call human-powerful routes, including review and demo reset. Restricting MCP to draft writes protects that MCP interface; it does not turn the underlying local HTTP API into an authenticated multi-user service.

Use a trusted local account, avoid port forwarding or public reverse proxies, and store only appropriate project facts. A source reference should point to evidence, not embed credentials or private transcripts. Export files contain the stored material and local project paths; treat them as private backups. This trust model is appropriate to explain clearly before expanding the product, rather than assuming loopback means every possible local caller is harmless.

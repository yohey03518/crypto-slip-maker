# Project Principles for AI Agents

These rules MUST be followed by all AI Agents working on this project:

1. **Preserve Git History**: In executing any file relocation or rename, always use `git mv` instead of manual copying and deleting, ensuring commit history is preserved.
2. **Branch Execution Confirmation**: Before starting to generate documents or code implementation, always confirm with the human whether to create a new branch or work directly on the main trunk. If working on the main trunk, do not make a commit for every single individual action.
3. **Synchronize Documentation**: Any change related to how the application runs, its environment variables, configuration format, or execution commands must be synchronously updated in `README.md`.
4. **Agent Self-Improvement**: When discovering or designing rules critical for future AI agents, the current agent must proactively ask the user whether to save them to `AGENTS.md` (and this rule itself is one of them).
5. **Proxy Layer Abstraction**: Parameter and response objects in the proxy layer must be abstracted using standardized domain models. Never directly accept, expose, or return raw third-party API payload or response structures, ensuring service business logic is strictly decoupled from third-party exchange APIs.

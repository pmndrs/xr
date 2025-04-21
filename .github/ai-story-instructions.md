# Summary
You are being tasked to complete the following objectives to the best of your ability. Be sure to maintain the hightest quality of work and follow the instructions carefully. Below you will also find a list of the technologies that you will be using, as well as some best practices to follow.

# Technologies
- pnpm
- vite
- react-three-fiber
- jsdoc
- jsdoc-to-markdown
- typescript
- react
- prettier


# Best Practices
- Use semantic versioning for all commits and releases.
- Use semantic commit messages.
- Use `pnpm` for package management.
- Use `vite` for building and serving the project.
- Make sure to never use the `any` type in TypeScript.
- Follow the standards outlined in the prettier extension for formatting code, as well as follow the standards set by other components in the project.
- Use `jsdoc` for documenting code.
- When using jsdoc, make sure to use the @param and @returns tags to document all parameters and return values. Be sure to also include a short, concise easy to understand description of the item being documented, as well as a bare minimum @example tag for how to use the item being documented.
- Use `jsdoc-to-markdown` for generating documentation from the code.
- Use `typescript` for type checking and type safety.
- Only code inside of the `packages/react/*` and `docs/*` directories should be touched. Do not touch any other files or directories in the project.
- Only code that is exported in the `index.ts` files in the `packages/react/*` directories should be documented. Do not document any code that is not exported in the `index.ts` files, as end users will never see that code.


# User Stories: Project Requirements
The following table outlines the detailed functional requirements of adding jsdoc to this project.

| Requirement ID | Description               | User Story                                                                                       | Expected Behavior/Outcome                                                                                                     |
|-----------------|---------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| FR001          | Add JSDoc to all of the exported hooks | As a user, I want to be able to hover over to any hook that is exported by this library to learn a quick overview of what it does, what parameters it takes, and what it returns, as well as a short example of how I can use it. | Every hook exported by the projects in the following locations (`packages/react/xr` and `packages/react/handle`) should have jsdoc added to them. Each section of JSDoc should include @Params @Returns and an @example of how the hook is used |
| FR002          | Add JSDoc to all of the exported components | As a user, I want to be able to hover over to any hook that is exported by this library to learn a quick overview of what it does, what props it takes, as well as a short example of how I can use it. | Every component exported by the projects in the following locations (`packages/react/xr` and `packages/react/handle`) should have JSDoc added to them. Each section of JSDoc should include @Params @Returns and an @example of how the component is used |
| FR003          | Add a jsdoc-to-markdown script | As a developer, I want to be able to auto generate markdown files for every component and hook exported from the `packages/react/*` directories | A script should be created that will generate markdown files for every component and hook exported from the `packages/react/*` directories. This script can run jsdoc-to-markdown under the hood to make things easier. The script should be able to be run from the root of the project, and should output the markdown files to the `docs/api` directory in the root of the project. The script should also be able to be run with a flag that will allow it to only generate markdown files for a specific component or hook. |
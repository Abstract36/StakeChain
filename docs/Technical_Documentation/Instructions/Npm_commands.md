https://docs.npmjs.com/cli/v10/commands/npm-access

The Node Package Manager (npm) provides a variety of commands for managing packages in Node.js projects. Here's a comprehensive list of common npm commands:

1. **npm init**: Initializes a new Node.js project, creating a `package.json` file.

2. **npm install [package-name]**: Installs a package. If `[package-name]` is omitted, it installs all dependencies listed in `package.json`.

3. **npm uninstall [package-name]**: Removes a package from the node_modules directory and updates the `package.json`.

4. **npm update [package-name]**: Updates a package to its latest version. If `[package-name]` is omitted, it updates all packages.

5. **npm list**: Lists installed packages and their dependencies.

6. **npm search [query]**: Searches for packages related to the given query.

7. **npm run [script-name]**: Runs a script defined in the `package.json`'s "scripts" section.

8. **npm start**: A shortcut to run the "start" script from `package.json`.

9. **npm test**: Runs the "test" script specified in `package.json`.

10. **npm publish**: Publishes a package to the npm registry.

11. **npm cache clean --force**: Clears the npm cache.

12. **npm audit**: Scans the project for vulnerabilities in installed packages.

13. **npm config [set/get/list]**: Manages npm configuration settings.

14. **npm version [update-type]**: Bumps the version of your project based on the `update-type` (major, minor, patch).

15. **npm pack**: Creates a tarball from a package.

16. **npm ci** (clean install): Similar to `npm install`, but designed for automated environments.

17. **npm rebuild [package-name]**: Rebuilds a package.

18. **npm dedupe**: Reduces duplication in the dependency tree.

19. **npm link [package-name]**: Symlinks a package folder for local development.

20. **npm outdated**: Checks for outdated packages.

21. **npm prune**: Removes unused packages.

22. **npm view [package-name]**: Shows information about a package.

23. **npm whoami**: Displays the npm username of the current user.

24. **npm adduser/login**: Logs in to your npm account.

25. **npm logout**: Logs out of your npm account.

26. **npm owner [add/remove/list] [user] [package]**: Manages package owners on the npm registry.

27. **npm token [create/delete/list]**: Manages authentication tokens.

28. **npm doctor**: Checks for common issues in your npm setup.

29. **npm help [command]**: Provides help for a specific npm command.

30. **npm fund**: Displays information about funding for installed packages.

31. **npm explain [package/id]**: Explains why a package is installed.

32. **npm repo [package-name]**: Opens the repository page of a package.

These commands cover most of the typical operations you'll perform with npm in Node.js projects. Remember that some of these commands may have additional flags or options for more specific tasks.
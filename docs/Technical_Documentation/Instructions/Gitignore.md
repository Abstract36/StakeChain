To ensure that your `.env` file, which contains sensitive credentials, is not committed to a public repository, you need to add it to the `.gitignore` file in your project. The `.gitignore` file specifies intentionally untracked files that Git should ignore. Files already tracked by Git are not affected by `.gitignore`. Here's how you can do it:

1. **Create or Open Your .gitignore File**: 
   - If you don't already have a `.gitignore` file in your project, create one in the root directory of your project.
   - If you already have a `.gitignore` file, open it for editing.

2. **Add .env to the .gitignore File**:
   - Add a line containing `.env` to the `.gitignore` file. This tells Git to ignore your `.env` file in all commits.
   - The `.gitignore` file should look something like this:

     ```
     # other ignored files and directories
     .env
     ```

3. **Save the .gitignore File**:
   - After adding `.env` to the `.gitignore` file, save and close the file.

4. **Commit the Updated .gitignore File**:
   - Commit the updated `.gitignore` file to your repository. This ensures that the ignore rules are applied in your repository.

     ```bash
     git add .gitignore
     git commit -m "Update .gitignore to exclude .env file"
     git push
     ```

5. **If .env Was Already Committed**:
   - If you previously committed the `.env` file, it will continue to be tracked by Git even after you add it to `.gitignore`. To remove it from the repository, while keeping it in your local directory, run:

     ```bash
     git rm --cached .env
     git commit -m "Remove .env from the repository"
     git push
     ```

    This removes the `.env` file from the repository but keeps it in your working directory.

By following these steps, you can ensure that your `.env` file is not accidentally committed to the public repository, which helps maintain the security of your credentials.
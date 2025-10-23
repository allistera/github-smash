# GitHub Repository Cleanup Workflow

This workflow automatically deletes GitHub repositories that are not in your whitelist.

## ⚠️ Important Safety Notice

**This workflow permanently deletes repositories.** Deleted repositories cannot be recovered unless you have backups. Always run in dry-run mode first.

## Setup

### 1. Create Personal Access Token

Create a GitHub Personal Access Token with the following permissions:

- `repo` (Full control of private repositories)
- `delete_repo` (Delete repositories)

Steps:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select the scopes above
4. Copy the token

### 2. Add Token as Repository Secret

1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `REPO_CLEANUP_TOKEN`
4. Value: Paste your Personal Access Token
5. Click "Add secret"

### 3. Configure Whitelist

Edit `repo-whitelist.yml` and add repositories you want to keep:

```yaml
# Repository Whitelist
# Add repository names in 'owner/repo' format
# These repositories will NOT be deleted

repositories:
  - username/repo-to-keep-1
  - username/repo-to-keep-2
  - username/important-project
```

**Format:** Use `owner/repo` format (for example: `octocat/hello-world`)

## Usage

### Running the Workflow

1. Go to the "Actions" tab in your GitHub repository
2. Select "Repository Cleanup" workflow
3. Click "Run workflow"
4. Choose dry-run mode:
   - **true** (recommended): Preview what would be deleted without actually deleting
   - **false**: Actually delete repositories not in whitelist

### Dry Run (Recommended First Step)

Always run in dry-run mode first to see what would be deleted:

1. Set `dry_run` to `true`
2. Review the output in the workflow logs
3. Update your whitelist if needed
4. Run dry-run again to verify

### Actual Deletion

Only after verifying the dry-run output:

1. Set `dry_run` to `false`
2. Click "Run workflow"
3. The workflow will permanently delete all repositories not in the whitelist

## What Gets Deleted

The workflow will delete:
- ✓ All repositories owned by the authenticated user
- ✓ Both private and public repositories
- ✓ Repositories not listed in the whitelist

The workflow will NOT delete:
- ✗ Repositories listed in the whitelist
- ✗ Repositories you don't own (forked repos where you're not the owner)

## Output Example

```
=== GitHub Repository Cleanup ===
Mode: DRY RUN

Authenticated as: your-username

Loading whitelist...
Whitelist contains 3 repositories

Fetching all repositories...
Found 25 total repositories

=== Summary ===
Repositories to keep: 3
Repositories to delete: 22

Keeping:
  ✓ username/important-project (private)
  ✓ username/repo-to-keep-1 (public)
  ✓ username/repo-to-keep-2 (private)

Will delete:
  ✗ username/old-project (public)
  ✗ username/test-repo (private)
  ...

DRY RUN: No repositories were deleted.
Set dry_run to "false" to actually delete these repositories.
```

## Troubleshooting

### "GITHUB_TOKEN environment variable is required"

The `REPO_CLEANUP_TOKEN` secret is not set or is named incorrectly. Follow setup step 2.

### "Whitelist file not found"

The `repo-whitelist.yml` file is missing. Commit this file to your repository.

### "Request failed with status 403"

Your Personal Access Token doesn't have the required permissions. Create a new token with `repo` and `delete_repo` scopes.

### "Request failed with status 404"

The repository might already be deleted, or the token doesn't have access to it.

## Security Considerations

- Store the Personal Access Token as a repository secret, never commit it to code
- The token has powerful permissions, treat it like a password
- Consider using a dedicated automation account for this workflow
- Review the dry-run output carefully before actual deletion
- Keep your whitelist file up to date

## Files

- `.github/workflows/cleanup-repos.yml` - GitHub Actions workflow definition
- `.github/scripts/cleanup-repos.js` - Deletion logic script
- `repo-whitelist.yml` - List of repositories to keep
- `.github/CLEANUP_README.md` - This documentation

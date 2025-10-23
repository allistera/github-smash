# GitHub Smash

Automatically delete GitHub repositories that are not in your allowlist.

## ⚠️ Warning

**This tool permanently deletes repositories.** Deleted repositories cannot be recovered unless you have backups. Always run in dry-run mode first.

## Quick Start

1. **Create a Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` and `delete_repo` scopes
   - Copy the token

2. **Add Token as Repository Secret**
   - Go to repository Settings → Secrets and variables → Actions
   - Create new secret named `REPO_CLEANUP_TOKEN`
   - Paste your token as the value

3. **Configure Allowlist**
   - Edit `repo-whitelist.yml` and add repositories to keep:

```yaml
repositories:
  - username/repo-to-keep-1
  - username/repo-to-keep-2
  - username/important-project
```

4. **Run the Workflow**
   - Go to Actions tab → Repository Cleanup
   - Click "Run workflow"
   - Set `dry_run` to `true` (recommended first)
   - Review output, update allowlist if needed
   - Run with `dry_run` set to `false` to delete

## How It Works

The workflow:
- Fetches all repositories owned by the authenticated user
- Compares them against the allowlist in `repo-whitelist.yml`
- Deletes repositories NOT in the allowlist (when dry-run is disabled)
- Preserves all repositories listed in the allowlist

## Dry Run Mode

Always run in dry-run mode first:
```
Mode: DRY RUN
Found 25 total repositories
Repositories to keep: 3
Repositories to delete: 22
```

Review the output carefully before running with dry-run disabled.

## Files

- `repo-whitelist.yml` - List of repositories to keep
- `.github/workflows/cleanup-repos.yml` - GitHub Actions workflow
- `.github/scripts/cleanup-repos.js` - Deletion logic
- `.github/CLEANUP_README.md` - Detailed documentation

## Security

- Store token as repository secret, never commit it
- Consider using a dedicated automation account
- Keep your allowlist file up to date
- Always verify dry-run output before deletion

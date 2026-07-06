# Essential Git Commands

## Basic Configuration

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name to main
git config --global init.defaultBranch main

# Set default editor (e.g., VS Code)
git config --global core.editor "code --wait"
```

## Repository Setup

```bash
# Initialize a new repository
git init

# Clone a repository
git clone <repository-url>

# Clone a specific branch
git clone -b <branch-name> <repository-url>

# Add a remote repository
git remote add origin <repository-url>
```

## Making Changes

```bash
# Check status of working directory
git status

# Stage changes
git add <file>        # Stage specific file
git add .             # Stage all changes
git add -p            # Interactive staging

# Commit changes
git commit -m "Commit message"

git commit -am "Commit message"  # Add and commit tracked files
```

## Branching

```bash
# List branches
git branch           # Local branches
git branch -a        # All branches (including remote)

# Create and switch to new branch
git checkout -b <branch-name>

# Switch to existing branch
git checkout <branch-name>

# Delete a branch
git branch -d <branch-name>      # Safe delete
git branch -D <branch-name>      # Force delete

# Rename current branch
git branch -m <new-branch-name>
```

## Merging & Rebasing

```bash
# Merge a branch into current branch
git merge <branch-name>

# Rebase current branch onto another
git rebase <branch-name>

# Interactive rebase (last 3 commits)
git rebase -i HEAD~3

# Abort a rebase/merge
git rebase --abort
git merge --abort
```

## Remote Operations

```bash
# Fetch changes from remote
git fetch

git pull  # Fetch and merge remote changes

git pull --rebase  # Fetch and rebase local changes

# Push changes to remote
git push origin <branch-name>

git push -u origin <branch-name>  # Set upstream

# Delete remote branch
git push origin --delete <branch-name>
```

## Undoing Changes

```bash
# Undo unstaged changes
git restore <file>

# Unstage a file
git restore --staged <file>

# Amend last commit
git commit --amend

# Reset to previous commit (soft - keeps changes staged)
git reset --soft HEAD~1

# Reset to previous commit (hard - discards all changes)
git reset --hard HEAD~1
```

## Stashing

```bash
# Stash changes
git stash

git stash save "Message"  # Stash with message

# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply specific stash
git stash apply stash@{n}

# Drop a stash
git stash drop stash@{n}

# Clear all stashes
git stash clear
```

## Tags

```bash
# List tags
git tag

# Create a lightweight tag
git tag <tag-name>

# Create an annotated tag
git tag -a v1.0.0 -m "Release 1.0.0"

# Push tags to remote
git push origin --tags
```

## Log & History

```bash
# View commit history
git log

git log --oneline      # Compact view
git log --graph       # Show branch structure
git log -p            # Show changes
git log --stat        # Show stats

# Search commit messages
git log --grep="search term"

# Show changes between commits
git diff <commit1> <commit2>
```

## Submodules

```bash
# Add a submodule
git submodule add <repository-url> <path>

# Initialize and update submodules
git submodule update --init --recursive

# Update all submodules
git submodule update --remote
```

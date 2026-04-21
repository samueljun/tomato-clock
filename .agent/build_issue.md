---
description: Read a GitHub issue, implement the feature for the browser extension
---

# /build_issue

1. Ask the user for the GitHub issue URL or issue number.
2. Read the issue details using the built-in browser or GitHub MCP server.
3. Create a new Git branch named `feature/issue-[number]`.
4. Analyze the existing browser extension architecture, specifically checking `manifest.json` and background/content scripts to ensure no permission regressions.
5. Implement the code changes required to resolve the issue.
6. If UI changes were made, prompt the user to load the unpacked extension in the browser to visually verify.
7. Format the code and ensure there are no linter warnings.

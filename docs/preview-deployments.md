# 🌐 Ephemeral PR Preview Deployments Engine

The PR Preview Deployment Engine provisions an isolated, ephemeral dashboard environment for every pull request opened across repositories utilizing the Ricky Friadi CI/CD Toolkit.

---

## 📌 Architecture & Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant GitHub as GitHub PR
    participant Actions as CI Pipeline
    participant Preview as Preview Engine
    participant Teardown as Teardown Workflow

    Developer->>GitHub: Open or Update Pull Request
    GitHub->>Actions: Trigger preview-deploy.yml
    Actions->>Actions: Build dist/ & run test coverage
    Actions->>Preview: Generate interactive preview dashboard
    Preview->>GitHub: Create Deployment & Deployment Status (success)
    Preview->>GitHub: Post / Update PR Preview comment with URL
    Developer->>GitHub: Merge or Close PR
    GitHub->>Teardown: Trigger preview-teardown.yml
    Teardown->>GitHub: Mark Deployment as 'inactive' & teardown
```

---

## 🛠️ Dashboard & Contents

Each ephemeral preview packages:
1. **Interactive Metrics Dashboard (`index.html`)**: Summarizing commit SHA, PR number, build timestamp, bundle analysis, and gate statuses.
2. **Live HTML Test Coverage Report (`coverage/`)**: Browsable Istanbul coverage tree showing statement, function, and branch coverage per file.
3. **Production Bundle Breakdown**: Live minified and gzip metrics.

---

## 🔄 Automatic Teardown
To avoid orphaned environments and resources, `.github/workflows/preview-teardown.yml` listens for `pull_request: [closed]`. When triggered, it automatically deactivates the corresponding GitHub Deployment environment.

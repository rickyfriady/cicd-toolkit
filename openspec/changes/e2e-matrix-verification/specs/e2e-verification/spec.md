# Spec Delta

## Purpose

Validates reusable CI/CD workflows and composite actions across a comprehensive matrix of framework archetypes, package managers, and Node.js runtime versions to prevent downstream consumer regressions.

## ADDED Requirements

### Requirement: Cross-Framework Consumer Matrix Execution
The system SHALL execute automated end-to-end integration tests across consumer archetypes, package managers, and Node.js runtime versions.

#### Scenario: Multi-dimension matrix execution
- **WHEN** the E2E verification workflow is triggered
- **THEN** it executes tests against `examples/vue3-vite`, `examples/distroless-node`, and `examples/distroless-bun` across `pnpm` and `bun` with `fail-fast: false`

### Requirement: Flexible Workflow Triggers
The system SHALL trigger the E2E verification workflow automatically on schedule, on sensitive path changes, and manually on demand.

#### Scenario: Nightly schedule trigger
- **WHEN** the scheduled cron job runs nightly
- **THEN** the full consumer verification matrix executes against the default branch

#### Scenario: Pull request path-filtered trigger
- **WHEN** a pull request modifies files in `.github/workflows/**` or `composite/**`
- **THEN** the E2E verification matrix executes to validate reusable workflow integrity

#### Scenario: Manual workflow dispatch
- **WHEN** a maintainer triggers the workflow via `workflow_dispatch`
- **THEN** the matrix executes with optional parameter overrides

### Requirement: End-to-End Reusable Workflow Integration Assertions
The system SHALL verify that downstream consumers successfully execute quality gates and secure container packaging using the toolkit's actions.

#### Scenario: Web application quality gate execution
- **WHEN** the `vue3-vite` consumer job runs
- **THEN** it invokes `composite/setup-runtime`, verifies dependencies, runs lint, builds the bundle, and validates the output

#### Scenario: Container security and packaging validation
- **WHEN** the `distroless-node` or `distroless-bun` consumer job runs
- **THEN** it builds the container image using Buildx and validates container security configurations

### Requirement: Matrix Telemetry and Step Summary Reporting
The system SHALL collate matrix test outcomes into a markdown report published to the GitHub Actions job step summary.

#### Scenario: Matrix results step summary generation
- **WHEN** all matrix jobs finish
- **THEN** the summary job aggregates the status of each framework and runtime permutation into a markdown table in `$GITHUB_STEP_SUMMARY`

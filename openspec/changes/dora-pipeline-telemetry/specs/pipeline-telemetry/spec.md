# Spec Delta

## Purpose

Provides continuous computation and visualization of the 4 core DORA engineering metrics and pipeline performance telemetry across releases and pull requests.

## ADDED Requirements

### Requirement: DORA Four Keys Computation Engine
The system SHALL compute the four core DORA metrics (Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Restore) from Git repository history, release tags, and CI logs.

#### Scenario: Computing delivery velocity and stability metrics
- **WHEN** the telemetry measurement script executes against the repository history
- **THEN** it calculates Deployment Frequency, Lead Time for Changes in hours, Change Failure Rate percentage, and Mean Time to Restore in minutes, classifying each into DORA performance tiers

### Requirement: Structured Telemetry Artifact Serialization
The system SHALL serialize calculated pipeline performance and DORA telemetry metrics into a machine-readable JSON report.

#### Scenario: Generating structured telemetry JSON
- **WHEN** pipeline metrics calculation completes
- **THEN** the system writes the results to `reports/telemetry/dora-metrics.json` containing timestamped metrics, performance classifications, and release history summaries

### Requirement: GitHub Step Summary Visual Telemetry
The system SHALL generate visual telemetry summaries including Markdown tables and Mermaid diagrams for the GitHub Actions Step Summary.

#### Scenario: Visual summary report rendering
- **WHEN** the pipeline metrics workflow completes
- **THEN** it appends a DORA metrics tier scorecard, pipeline duration breakdown, and Mermaid status chart to `$GITHUB_STEP_SUMMARY`

### Requirement: In-PR Code Review Telemetry Card
The system SHALL surface change lead time, commit dispersion, and file impact telemetry within Danger pull request code reviews.

#### Scenario: PR review bot posts telemetry card
- **WHEN** Danger review executes on an open pull request
- **THEN** it includes a pipeline telemetry card detailing commit age, lead time estimate, and change blast radius

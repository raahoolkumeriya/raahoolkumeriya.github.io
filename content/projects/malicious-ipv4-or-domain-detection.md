+++
title = "Malicious IPv4 or Domain Detection"
description = "Automated Threat Intelligence scanner combining VirusTotal and URLScan APIs built with FastAPI and Docker."
weight = 3
date = 2021-07-10

[extra]
badge = "Cybersecurity API"
github = "https://github.com/raahoolkumeriya/malicious_detection"
tags = ["Cybersecurity", "FastAPI", "VirusTotal", "URLScan", "Docker", "Python", "REST API"]
+++

## Overview

A high-throughput threat intelligence microservice engineered to evaluate whether an inbound IPv4 address or hostname domain poses an active security risk. By aggregating and normalizing live threat intelligence from **VirusTotal** and **URLScan** REST APIs, this engine provides immediate risk scoring for Security Operations Center (SOC) analysts and automated incident response orchestration workflows.

### Architectural Capabilities

- **Multi-Source Threat Aggregation**: Queries both VirusTotal and URLScan engines in parallel to inspect domain reputation scores, SSL certificate history, DNS routing anomalies, and known malicious payload signatures.
- **Asynchronous FastAPI Microservice**: Implemented with Python's asynchronous `asyncio` and `httpx` within FastAPI, achieving sub-second query response times without blocking the event loop, accompanied by interactive OpenAPI / Swagger specifications.
- **Containerized Deployment Architecture**: Fully packaged with Docker and multi-stage Dockerfiles for minimal production images, integrated with Docker Compose and GitHub Actions CI pipelines for automated linting and packaging.
- **Automated Pytest Coverage**: Comprehensive test suites covering network timeout resilience, edge-case URL formats, payload verification, and mock API response mocking.

### Technology Stack

- **API Framework**: Python 3.9+, FastAPI, Pydantic, Uvicorn
- **Threat Feeds**: VirusTotal API v3, URLScan.io API
- **DevOps & QA**: Docker, Docker Compose, Pytest, GitHub Actions
- **Repository**: [GitHub - malicious_detection](https://github.com/raahoolkumeriya/malicious_detection)

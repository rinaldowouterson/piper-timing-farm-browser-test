# Piper Timing Farm Browser Test

Integrated verification suite for the `piper-timing-farm-browser` library. This platform provides a robust environment for validating real-time speech synthesis performance, high-concurrency orchestration, and runtime reliability across diverse browser environments.

## Live Verification

The latest stable version of the verification console is available at:
**[https://rinaldowouterson.github.io/piper-timing-farm-browser-test/](https://rinaldowouterson.github.io/piper-timing-farm-browser-test/)**


## Overview

This repository serves as the canonical verification platform for the Piper Timing Farm Browser library. It implements a suite of integrated scenarios designed to verify:

- **FIFO Sequencer Integrity**: Ensures audio playback maintains strict chronological order under parallel synthesis.
- **Extended Concurrency**: Validates worker thread pool management during high-load burst scenarios.
- **Runtime Promotion**: Verifies surgical and hotswap model updates without system interruption.
- **Asset Gateway Reliability**: Validates Service Worker-based asset interception and caching logic.

## Technical Stack

- **Framework**: Vite + Vanilla TypeScript
- **State Management**: Event-driven observability model
- **UI**: High-fidelity dashboard with real-time telemetry
- **Verification**: Integrated scenario orchestration

## Getting Started

### Installation

```bash
npm install
```

### Execution

Launch the verification dashboard:

```bash
npm run dev
```

## Verification Scenarios

The platform includes several pre-defined scenarios:

- **Standard Extended**: Sequential verification of core synthesis features.
- **High-Concurrency Burst**: Stress verification of worker pool saturation.
- **Memory Pressure**: Validation of resource cleanup during intensive operations.
- **Lifecycle Pivot**: Real-time parameter update verification for pending requests.

## License

MIT

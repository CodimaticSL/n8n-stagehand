# Changelog

## [0.2.19] - 2025-10-21

### Fix: Add GPT-OSS-120B Model to Model List

- **Added:** `openai/gpt-oss-120b` to the available models list
- **Note:** Requires Base URL configured in OpenAI credentials (`https://llm.chutes.ai/v1`)
- Works with the simplified OpenAI-compatible API approach introduced in v0.2.18

## [0.2.18] - 2025-10-21

### Improvement: Simplified OpenAI-Compatible API Support

- **Change:** Removed separate "Chutes" AI provider option
- **New Approach:** Use OpenAI credentials with custom Base URL for any OpenAI-compatible API
  - Configure Base URL in OpenAI credentials (e.g., `https://llm.chutes.ai/v1`)
  - Specify custom model name in Advanced Options (e.g., `openai/gpt-oss-120b`)
  - Works with Chutes, LocalAI, LM Studio, or any OpenAI-compatible endpoint

- **Benefits:**
  - Cleaner UI - no separate provider option
  - More flexible - works with any OpenAI-compatible API
  - Less confusion - reuses existing OpenAI credential type
  - No duplicate credential management

## [0.2.17] - 2025-10-20

### Fix: Include Missing Stagehand PeerDependencies

- **Problem:** Stagehand v2.5.2 has peerDependencies that weren't included: dotenv@^16.4.5 and deepmerge@^4.3.1
- **Solution:** Added missing peerDependencies as regular dependencies
  - Added: dotenv@^16.4.5 (required by Stagehand)
  - Added: deepmerge@^4.3.1 (required by Stagehand)

- **Final Dependency Set:**
  - @browserbasehq/stagehand@2.5.2
  - ai@^4.3.19
  - @ai-sdk/openai@^1.3.24
  - zod@3.25.67 (exact version to avoid conflicts)
  - playwright@1.56.0
  - dotenv@^16.4.5
  - deepmerge@^4.3.1
  - json-schema-to-zod@2.6.1
  - json-to-zod@1.1.2

- **Verified:** 
  - ✓ Local test with n8n succeeds
  - ✓ All dependencies load correctly
  - ✓ Stagehand node instantiates without errors
  - ✓ Module resolution hierarchy is clean

## [0.2.16] - 2025-10-20

### MAJOR FIX: Resolve Nested Module Resolution Issue

- **Problem:** n8n error: Cannot find module '/home/node/.n8n/nodes/node_modules/n8n-nodes-stagehand-browser/node_modules/@browserbasehq/stagehand/node_modules/ai/dist/index.js'
- **Root Cause:** Packaging all dependencies caused npm to create deeply nested node_modules structures when installed via n8n

- **Solution:** Attempted to move large dependencies to peerDependencies (later reversed in v0.2.17)
- **Result:** Led to discovery that Stagehand's peerDependencies needed to be included

## [0.2.15] - 2025-10-20

### Fix: Resolve Zod Version Conflict

- **Problem in n8n:** Cannot find module '@browserbasehq/stagehand/node_modules/ai/dist/index.js' - caused by module duplication
- **Root Cause Analysis:**
  - Stagehand v2.5.2 requires: zod@>=3.25.0 <3.25.68 (exact constraint)
  - npm was resolving zod@^3.25.0 to zod@3.25.76 (latest patch)
  - Version 3.25.76 violates Stagehand constraint (exceeds <3.25.68 limit)
  
- **Solution:** Anchor zod to exact version 3.25.67
  - Satisfies: zod@>=3.25.0 <3.25.68 (Stagehand requirement)
  - Compatible with: ai@^4.3.19 and @ai-sdk/openai@^1.3.24
  - Eliminates version conflicts and module duplication

- **Verified Dependencies:**
  - ai@^4.3.19 (deduped correctly via Stagehand)
  - @ai-sdk/openai@^1.3.24 (deduped correctly via Stagehand)
  - zod@3.25.67 (exact, within Stagehand constraint)
  - All 1000 packages resolve without conflicts
  - Published successfully to npm

## [0.2.14] - 2025-10-20

### Technical Changes

- **Fix:** Resolved zod dependency conflict between @ai-sdk/openai and @browserbasehq/stagehand
- Reverted @ai-sdk/openai to ^1.3.24 (compatible with zod 3.25.x required by Stagehand)
- Reverted ai to ^4.3.19 (compatible with @ai-sdk/openai 1.3.24)
- Updated zod from ^3.25.76 to ^3.25.0 for compatibility
- Result: Installation without ERESOLVE errors (FIXED)

## [0.2.12] - 2025-10-20

### New Features

- **Chutes and GPT-OSS-120B Support:** Integration of Chutes as AI provider with support for GPT-OSS-120B model
- **OpenAI-Compatible API:** Chutes uses OpenAI-compatible API, allowing integration without architecture changes
- **Custom Endpoint:** Automatic support for https://llm.chutes.ai/v1 with custom baseURL

### Technical Changes

- Added dependencies: ai and @ai-sdk/openai (Vercel AI SDK)
- New provider option in selector: "Chutes (OpenAI-Compatible)"
- New model option: "Chutes: GPT-OSS-120B"
- Added aiProvider field to StagehandSession interface for session persistence
- Automatic modelClientOptions configuration with baseURL when Chutes is selected
- OpenAI credentials reused for Chutes (API-compatible)

### Documentation

- Added CHUTES_INTEGRATION.md with detailed integration information

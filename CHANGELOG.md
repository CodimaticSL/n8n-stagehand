# Changelog

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

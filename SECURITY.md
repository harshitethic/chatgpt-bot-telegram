# Security policy

## Historical pull requests containing credential-like tokens

On 14 October 2026, unmerged public PRs proposing API and Telegram bot credentials in a tracked `.env` file were closed. The PRs were not merged into the default branch, but **closed PR histories may still expose credential-looking strings**. Any real API keys or bot tokens committed by a contributor should be immediately revoked.

- Revoke exposed **OpenAI API keys** in the provider's API-key dashboard and inspect usage.
- Rotate exposed **Telegram bot tokens** through the official @BotFather token-management/revoke flow.
- Update only your private, ignored `.env`, following [`.env.example`](.env.example); never commit local `.env`, chat logs or QR/session material.
- Public source history and forks cannot be made secret by simply deleting a file from the latest commit. Prioritize rotation; contact GitHub Support for help with sensitive-data removal if required.

## Responsible disclosure

Please do not post real tokens, personal information, private conversations or exploit payloads containing live credentials in public issues or PR comments. Report reproducible security concerns to `contact@harshitethic.com` with a minimal **redacted** reproduction and affected version.

## AI-spend admission

The bot now rejects excess paid requests **before** calling the provider:
five accepted text and one image request per user per hour by default,
one in-flight request per user, and three concurrent operations per process.
Missing identity and invalid configuration fail closed. No more than 4,096
user-budget entries are tracked by default, with expired idle entries purged.

**Not a guaranteed financial cap:** budgets are memory-only and reset on
restart. Separate processes do not coordinate. Users can create additional
Telegram accounts. An allowed request still uses paid OpenAI APIs; apply
actual billing limits and operational monitoring.

## Public deployment limits

This is a sample bot, not an audited multi-tenant service. Production deployments need **durable cross-process** quotas, abuse controls, safe logging, monitoring, consent and key management. GitHub Actions passing tests does not establish that a production bot is secure.

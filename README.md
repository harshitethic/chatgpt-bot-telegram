# Telegram AI Bot

[![CI](https://github.com/harshitethic/chatgpt-bot-telegram/actions/workflows/ci.yml/badge.svg)](https://github.com/harshitethic/chatgpt-bot-telegram/actions/workflows/ci.yml)

A small, open-source **Node.js Telegram bot** with two commands:

- **/ask** asks a question through OpenAI's Responses API.
- **/image** generates an image and sends the resulting file to the Telegram chat.

> **Version 2 upgrade:** The original 2023 example used the retired OpenAI Node SDK v3 and legacy completion/image endpoints. This update uses a supported SDK shape, safer configuration and regression tests. Existing deployments must update their environment variables and dependencies. This is a sample bot, not a production multi-tenant service.

[Release history and upgrade notes](CHANGELOG.md) · [Latest release](https://github.com/harshitethic/chatgpt-bot-telegram/releases/latest)

## Requirements

- Node.js 20 or later
- A Telegram bot token from [BotFather](https://t.me/BotFather)
- An OpenAI API key with access to the selected text/image models

## Quick start

```bash
git clone https://github.com/harshitethic/chatgpt-bot-telegram.git
cd chatgpt-bot-telegram
npm ci
cp .env.example .env
# Edit .env locally, replacing the placeholder keys with your own.
npm start
```

Do **not** commit your `.env`, post keys in issues, or put API keys into JavaScript source files. Real API usage may incur charges.

## Configuration

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API credential (required) |
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather token (required) |
| `OPENAI_TEXT_MODEL` | Responses API model (default `gpt-4.1-mini`) |
| `OPENAI_IMAGE_MODEL` | Image model (default `gpt-image-1`) |

The bot uses long polling. Each deployed instance should be the **only** active long-polling process using that Telegram token.

### Default paid-request admission limits

To reduce accidental API bills and request storms, the bot enforces the
following **process-local** budgets:

| Setting | Default | Meaning |
| --- | ---: | --- |
| BOT_MAX_TEXT_PER_HOUR | 5 | Accepted /ask requests per Telegram user per rolling hour |
| BOT_MAX_IMAGES_PER_HOUR | 1 | Accepted /image requests per Telegram user per rolling hour |
| BOT_MAX_CONCURRENT | 3 | AI/Telegram reply operations admitted at once globally |
| BOT_MAX_TRACKED_USERS | 4096 | Maximum retained user counters before expired idle entries are purged |

One AI request per user can execute at a time, across both commands. Requests
over budget receive a clear reply **without invoking OpenAI**. Missing user
IDs fail closed. Invalid, zero or excessive configuration values prevent bot
startup instead of disabling limits. The hour budget is counted on admission,
**including upstream failures**; retrying a failed operation cannot bypass
usage accounting.

Image responses are also validated and capped at **10 MiB decoded** before
sending to Telegram. The provider SDK can still buffer network responses
before that validation; this is not a transfer-byte cap.

These are not currency quotas or absolute financial guarantees. The limits
reset when the process restarts; multiple independently launched bot
instances **do not share counters**. Each accepted request may still incur
provider costs. Telegram users can create multiple accounts, and the global
guard cannot prevent distributed abuse. Public services also require durable
cross-process accounting, operator alerts, billing controls and moderation.

## How it works

```text
Telegram user
    |
    v
Telegraf command handler (/ask or /image)
    |
    +--> input parsing and prompt validation
    |
    +--> isolated AI service
              |
              +--> Responses API --> text reply
              |
              +--> Images API --> base64 --> Telegram photo
```

The API client lives in `src/ai.js`, Telegram handling in `src/bot.js`, and parsing in `src/commands.js`. Missing keys fail at startup. Commands catch upstream errors and show a user-safe message rather than leaking raw API responses. Telegram text is capped to its 4,096-character message limit.

**Limits:** This sample has process-local per-user rate limits and concurrent-request admission, but **not** persistent quotas, a distributed queue, content moderation, billing controls, or deployment monitoring. Add those before public deployment. Image generation requires a model enabled for your API account.

## Development and checks

```bash
npm ci
npm run check
npm test
```

Node's built-in test runner validates prompt parsing, input bounds, API payloads, image decoding, usage admission, error paths, and the real Telegraf update-handler flow **without network calls or secrets**. [GitHub Actions](https://github.com/harshitethic/chatgpt-bot-telegram/actions) runs these checks on pull requests. CI also checks for high-severity npm production-dependency advisories and runs JavaScript CodeQL security-extended analysis. Passing CI does not guarantee the absence of security issues.

## License

[ISC](LICENSE), matching the license declaration in package.json.

## Migration from the 2023 example

1. Back up your existing `.env` locally; do not commit it.
2. Replace `API` with `OPENAI_API_KEY` and `TG_API` with `TELEGRAM_BOT_TOKEN`.
3. Run `npm ci` to install SDK v7.
4. Ensure your OpenAI account permits the configured text and image models.

This sample is community-maintained; please report reproducible issues with version numbers and **redacted** logs.

# Telegram AI Bot

[![CI](https://github.com/harshitethic/chatgpt-bot-telegram/actions/workflows/ci.yml/badge.svg)](https://github.com/harshitethic/chatgpt-bot-telegram/actions/workflows/ci.yml)

A small, open-source **Node.js Telegram bot** with two commands:

- **/ask** asks a question through OpenAI's Responses API.
- **/image** generates an image and sends the resulting file to the Telegram chat.

> **Version 2 upgrade:** The original 2023 example used the retired OpenAI Node SDK v3 and legacy completion/image endpoints. This update uses a supported SDK shape, safer configuration and regression tests. Existing deployments must update their environment variables and dependencies. This is a sample bot, not a production multi-tenant service.

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

**Limits:** This sample does not implement per-user rate limiting, persistence, queues, content moderation, or deployment monitoring. Add those before public deployment. Image generation requires a model enabled for your API account.

## Development and checks

```bash
npm ci
npm run check
npm test
```

Node's built-in test runner validates prompt parsing, input bounds, Responses API payloads, image decoding, error paths, and configuration guards **without network calls or secrets**. [GitHub Actions](https://github.com/harshitethic/chatgpt-bot-telegram/actions) runs these checks on pull requests.

## Migration from the 2023 example

1. Back up your existing `.env` locally; do not commit it.
2. Replace `API` with `OPENAI_API_KEY` and `TG_API` with `TELEGRAM_BOT_TOKEN`.
3. Run `npm ci` to install SDK v7.
4. Ensure your OpenAI account permits the configured text and image models.

This sample is community-maintained; please report reproducible issues with version numbers and **redacted** logs.

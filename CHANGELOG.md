# Changelog

## Unreleased

- Split long AI text into a maximum of four sequential, bounded Telegram messages instead of silently cutting it off at 4,096 characters.
- Preserve Unicode surrogate pairs and mark intentionally shortened responses.
- Add splitter and live Telegraf handler regression tests.

## 2.1.0 — 17 October 2026

**Paid-request guardrails for the local Telegram bot sample.**

- Per-user rolling hourly allowances, defaulting to five text and one image
  requests, with configurable bounded limits and one in-flight request per
  user across both commands.
- Process-wide limit of three concurrent admitted AI/reply operations and
  bounded user accounting (4,096 records by default).
- Invalid bot user identity and invalid limit settings fail closed. Rejected
  requests never call the OpenAI API; admitted attempts count even if the
  upstream API fails.
- Validate base64 and cap decoded image bytes at 10 MiB before uploading
  to Telegram.
- Real Telegraf update-path tests, bringing the suite to 16 scenarios.
- First independent JavaScript CodeQL security-extended workflow and
  production dependency audit in Node 20/22 CI.
- Include the ISC license file matching the existing npm package metadata.

[Implementation and test review](https://github.com/harshitethic/chatgpt-bot-telegram/pull/13).

### Upgrade guidance

This minor version changes bot behavior by **enabling rate limiting by
default**. Existing users may set BOT_MAX_TEXT_PER_HOUR,
BOT_MAX_IMAGES_PER_HOUR, BOT_MAX_CONCURRENT and BOT_MAX_TRACKED_USERS
in their local, ignored .env file. Invalid values stop startup instead of
disabling guardrails. The new limits do not require a persistent database.

These safeguards are **process-local**, reset on restart, and do **not**
provide a monetary spending cap or protection against distributed account
abuse. Review actual OpenAI billing limits; run only one long-polling instance
per Telegram bot token. No publicly running bot or provider account has
been tested or deployed as part of this release.

## 2.0.0 — 13 October 2026

Migrated the original 2023 sample to OpenAI Responses and modern Images API
client shapes, safer environment configuration, mockable handler/service
boundaries, regression tests and Node CI.

[Prior release](https://github.com/harshitethic/chatgpt-bot-telegram/releases/tag/v2.0.0).

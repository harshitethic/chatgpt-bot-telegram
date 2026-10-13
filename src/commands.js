'use strict';

function commandPayload(text, command) {
  if (typeof text !== 'string') return '';
  const escaped = command.replace(/[.*+?^$()|[\]{}]/g, '\\$&');
  // Accept /ask and /ask@BotUsername, but never strip a command from prose.
  const match = text.match(new RegExp('^/' + escaped + '(?:@[A-Za-z0-9_]+)?(?:\\s+|$)', 'i'));
  return match ? text.slice(match[0].length).trim() : '';
}

function errorMessage(error) {
  if (error instanceof RangeError) return 'Your prompt is too long. Keep it under 4,000 characters.';
  if (error instanceof TypeError) return 'Please include a description after the command.';
  return 'The AI request failed. Please try again shortly.';
}

module.exports = { commandPayload, errorMessage };

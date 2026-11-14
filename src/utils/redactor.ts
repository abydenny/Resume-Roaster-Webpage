/**
 * Auto-redacts personal contact info (emails, phone numbers, personal links, candidate name)
 * so that user privacy is strictly protected before sending to AI or generating public share cards.
 */

export function autoRedactResumeText(text: string): { redactedText: string; count: number } {
  let count = 0;
  let result = text;

  // Redact Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  result = result.replace(emailRegex, () => {
    count++;
    return '[REDACTED_EMAIL]';
  });

  // Redact Phone numbers (international, US, with dashes/spaces/parentheses)
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}|\b\d{10}\b)/g;
  result = result.replace(phoneRegex, (match) => {
    // Only match strings that look like actual phone numbers (at least 7 digits)
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      count++;
      return '[REDACTED_PHONE]';
    }
    return match;
  });

  // Redact LinkedIn / Discord / GitHub personal handles if formatted like links or tags
  const handleRegex = /(?:linkedin\.com\/in\/[a-zA-Z0-9-_]+|github\.com\/[a-zA-Z0-9-_]+|discord:[a-zA-Z0-9_#]+)/gi;
  result = result.replace(handleRegex, () => {
    count++;
    return '[REDACTED_HANDLE]';
  });

  // Attempt to redact candidate name from the very first line if it looks like a person's name
  const lines = result.split('\n');
  if (lines.length > 0) {
    const firstNonEmptyIndex = lines.findIndex((l) => l.trim().length > 0);
    if (firstNonEmptyIndex !== -1) {
      const firstLine = lines[firstNonEmptyIndex].trim();
      // If first line is 2-4 words, under 40 chars, doesn't contain common resume header keywords
      const headerKeywords = ['resume', 'curriculum', 'vitae', 'summary', 'profile', 'experience', 'education'];
      const isHeaderWord = headerKeywords.some((k) => firstLine.toLowerCase().includes(k));
      const words = firstLine.split(/\s+/);
      if (!isHeaderWord && words.length >= 2 && words.length <= 4 && firstLine.length <= 40) {
        lines[firstNonEmptyIndex] = '[REDACTED_CANDIDATE_NAME]';
        count++;
        result = lines.join('\n');
      }
    }
  }

  return { redactedText: result, count };
}

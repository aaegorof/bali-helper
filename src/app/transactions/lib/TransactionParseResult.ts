interface TransactionParseResult {
  time: string | null;
  cleanDescription: string;
}

export const parseTimeFromDescription = (description: string): TransactionParseResult => {
  if (!description) return { time: null, cleanDescription: '' };

  const timeRegex = /(\d{2}:\d{2}:\d{2})/;
  const match = description.match(timeRegex);
  if (match) {
    return {
      time: match[1],
      cleanDescription: description.replace(timeRegex, '').trim(),
    };
  }
  return {
    time: null,
    cleanDescription: description,
  };
};
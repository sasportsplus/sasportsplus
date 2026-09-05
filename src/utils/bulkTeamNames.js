export const parseTeamNames = (value) => {
  const seen = new Set();
  return String(value)
    .split(/[,\n]+/)
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLocaleLowerCase();
      if (name.length < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

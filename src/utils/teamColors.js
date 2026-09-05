export const TEAM_COLOR_PALETTE = [
  '#2563EB',
  '#DC2626',
  '#059669',
  '#7C3AED',
  '#EA580C',
  '#0891B2',
  '#C026D3',
  '#4D7C0F',
  '#B45309',
  '#4338CA',
  '#BE123C',
  '#0F766E',
  '#9333EA',
  '#0369A1',
  '#A16207',
  '#15803D',
];

export const getTeamColor = (team, teams = []) => {
  if (team?.color) return team.color;
  const index = Math.max(0, teams.findIndex((candidate) => candidate.id === team?.id));
  return TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length];
};

export const getNextTeamColor = (teams = []) => {
  const usedColors = new Set(teams.map((team) => team.color).filter(Boolean));
  return TEAM_COLOR_PALETTE.find((color) => !usedColors.has(color))
    || TEAM_COLOR_PALETTE[teams.length % TEAM_COLOR_PALETTE.length];
};

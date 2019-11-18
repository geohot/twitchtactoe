import determineStatus from './determine-status';

describe('determineStatus', () => {
  it('should return winner if a status is found', () => {
    expect(determineStatus('x', 'x')).toBe('Winner: x');
  });
  it('should return the next player if status is null', () => {
    expect(determineStatus(null, 'x')).toBe('Next player: x');
  });
  it('should return draw if status is draw', () => {
    expect(determineStatus('draw', '')).toBe('Game is a draw');
  });
});

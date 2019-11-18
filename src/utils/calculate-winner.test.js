import calculateWinner from './calculate-winner';

// pretty meh.
describe('calculateWinner', () => {
  it('should return x if winner is x', () => {
    expect(calculateWinner(["X", "X", "X", "O", null, null, "O", "O", "X"])).toBe('X');
  });
  it('should return o if winner is o', () => {
    expect(calculateWinner(["O", "O", "O", "O", null, null, "O", "O", "O"])).toBe('O');
  });
  it('should return draw if draw', () => {
    expect(calculateWinner(["O", "X", "O", "O", "X", "X", "X", "O", "X"])).toBe('draw');
  });
  it('should return null if game is still in progress', () => {
    expect(calculateWinner([null, null])).toBeNull()
  });
});

export default (status, next) => ({
  [status]: `Winner: ${status}`,
  [null]: `Next player: ${next}`,
  'draw': 'Game is a draw',
})[status];

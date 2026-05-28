
describe('Frontend Core', () => {
  test('localStorage works', () => {
    localStorage.setItem('test', 'ok');

    expect(localStorage.getItem('test'))
      .toBe('ok');
  });
});

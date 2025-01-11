import { setup } from 'xstate';

export const gameMachine = setup({
  types: {} as {
    events:
      { type: 'game.start' } |
      { type: 'game.play' } |
      { type: 'game.pause' };
  },
}).createMachine({
  id: 'game',
  initial: 'initial',
  states: {
    initial: {
      on: {
        'game.start': 'playing'
      }
    },
    paused: {
      on: {
        'game.play': 'playing'
      }
    },
    playing: {
      on: {
        'game.pause': 'paused'
      }
    }
  }
});

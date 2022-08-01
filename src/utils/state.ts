window.subscribers = [];

const defaultState: State = {
  loading: false,
  isAuthorising: false,
  accessToken: null,
  showExpiredMessage: false,
  // Projects part
  projects: [],
  currentProject: undefined,

};

export const state = new Proxy(defaultState, {
  set(state, key, value) {
    const oldState = { ...state };

    state[key] = value;

    window.subscribers.forEach(callback => callback(state, oldState));

    return !!state;
  }
});
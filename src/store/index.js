/**
 * Simple state management inspired by Zustand
 */
export function createStore(initialState) {
    let state = initialState
    const listeners = new Set()

    return {
        getState: () => state,

        setState: (newState) => {
            state = typeof newState === 'function'
                ? newState(state)
                : { ...state, ...newState }
            listeners.forEach(listener => listener(state))
        },

        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },

        reset: () => {
            state = initialState
            listeners.forEach(listener => listener(state))
        }
    }
}

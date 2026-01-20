import { createStore } from './index'

export const uiStore = createStore({
    activeSection: 'dashboard',
    sidebarOpen: false,
    modal: null
})

export const uiActions = {
    setActiveSection: (section) => {
        uiStore.setState({ activeSection: section })
    },

    toggleSidebar: () => {
        uiStore.setState((state) => ({ ...state, sidebarOpen: !state.sidebarOpen }))
    },

    openModal: (modalName) => {
        uiStore.setState({ modal: modalName })
    },

    closeModal: () => {
        uiStore.setState({ modal: null })
    }
}

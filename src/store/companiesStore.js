import { createStore } from './index'
import { FirestoreService } from '../services/firestoreService'

const initialState = {
    companies: [],
    currentCompany: null,
    loading: false,
    error: null
}

export const companiesStore = createStore(initialState)

export const companiesActions = {
    fetchCompanies: async () => {
        companiesStore.setState({ loading: true, error: null })
        try {
            // This would normally be restricted to Super Admin
            const companies = await FirestoreService.getCompanies()
            companiesStore.setState({ companies, loading: false })
            return true
        } catch (e) {
            companiesStore.setState({ error: 'Failed to fetch companies', loading: false })
            return false
        }
    },

    setCurrentCompany: (companyId) => {
        const company = companiesStore.getState().companies.find(c => c.id === companyId)
        companiesStore.setState({ currentCompany: company })
    },

    addCompany: async (companyData) => {
        companiesStore.setState({ loading: true, error: null })
        const newCompany = {
            id: `co_${Date.now()}`,
            status: 'active',
            plan: 'starter',
            createdAt: new Date().toISOString(),
            ...companyData
        }

        try {
            await FirestoreService.saveCompany(newCompany)
            companiesStore.setState(state => ({
                companies: [...state.companies, newCompany],
                loading: false
            }))
            return true
        } catch (e) {
            companiesStore.setState({ error: e.message, loading: false })
            return false
        }
    }
}

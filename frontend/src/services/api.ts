import axios from 'axios'

const API_BASE = 'http://localhost:4000'

export const api = {
    async createDeployment(gitUrl: string) {
        const { data } = await axios.post(`${API_BASE}/deployments`, { gitUrl })
        return data
    },

    async listDeployments() {
        const { data } = await axios.get(`${API_BASE}/deployments`)
        return data
    },

    async getDeployment(id: string) {
        const { data } = await axios.get(`${API_BASE}/deployments/${id}`)
        return data
    },

    async streamLogs(id: string): Promise<string[]> {
        return new Promise((resolve) => {
            const eventSource = new EventSource(`${API_BASE}/deployments/${id}/logs`)
            const logs: string[] = []

            eventSource.onmessage = (event) => {
                logs.push(event.data)
            }

            eventSource.onerror = () => {
                eventSource.close()
                resolve(logs)
            }

            // Timeout after 500ms to return accumulated logs
            setTimeout(() => {
                resolve(logs)
            }, 500)
        })
    },
}
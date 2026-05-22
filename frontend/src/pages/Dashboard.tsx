import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
    const [gitUrl, setGitUrl] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Fetch deployments
    const { data: deployments = [] } = useQuery({
        queryKey: ['deployments'],
        queryFn: api.listDeployments,
        refetchInterval: 2000,
    })

    // Fetch logs for selected deployment
    const { data: logs = [] } = useQuery({
        queryKey: ['logs', selectedId],
        queryFn: () => selectedId ? api.streamLogs(selectedId) : Promise.resolve([]),
        enabled: !!selectedId,
        refetchInterval: 500,
    })

    // Create deployment mutation
    const createMutation = useMutation({
        mutationFn: (url: string) => api.createDeployment(url),
        onSuccess: () => {
            setGitUrl('')
            queryClient.invalidateQueries({ queryKey: ['deployments'] })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (gitUrl.trim()) {
            createMutation.mutate(gitUrl)
        }
    }

    return (
        <div className="dashboard">
            <header className="header">
                <h1>🚀 Brimble Deployments</h1>
                <p>Deploy containerized apps with a single command</p>
            </header>

            <div className="container">
                <div className="left-panel">
                    <form onSubmit={handleSubmit} className="deploy-form">
                        <h2>New Deployment</h2>
                        <input
                            type="text"
                            placeholder="https://github.com/user/repo"
                            value={gitUrl}
                            onChange={(e) => setGitUrl(e.target.value)}
                            disabled={createMutation.isPending}
                        />
                        <button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Deploying...' : 'Deploy'}
                        </button>
                    </form>

                    <div className="deployments-list">
                        <h2>Deployments ({deployments.length})</h2>
                        {deployments.length === 0 ? (
                            <p className="empty">No deployments yet</p>
                        ) : (
                            deployments.map((dep: any) => (
                                <div
                                    key={dep.id}
                                    className={`deployment-item ${dep.status} ${selectedId === dep.id ? 'selected' : ''
                                        }`}
                                    onClick={() => setSelectedId(dep.id)}
                                >
                                    <div className="dep-header">
                                        <span className={`status badge-${dep.status}`}>
                                            {dep.status}
                                        </span>
                                        <span className="id">{dep.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="dep-body">
                                        <p className="source">{dep.source}</p>
                                        {dep.url && (
                                            <a href={dep.url} target="_blank" rel="noopener noreferrer">
                                                {dep.url}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="right-panel">
                    {selectedId ? (
                        <>
                            <h2>Logs</h2>
                            <div className="logs-container">
                                {logs.length === 0 ? (
                                    <p>No logs yet...</p>
                                ) : (
                                    logs.map((log: string, i: number) => (
                                        <div key={i} className="log-line">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Select a deployment to view logs</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
    const [gitUrl, setGitUrl] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [logs, setLogs] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const queryClient = useQueryClient()

    // Fetch deployments
    const { data: deployments = [] } = useQuery({
        queryKey: ['deployments'],
        queryFn: api.listDeployments,
        refetchInterval: 2000,
    })

    // SSE: subscribe to logs for selected deployment
    useEffect(() => {
        setLogs([])
        if (!selectedId) return

        const es = new EventSource(`${apiBase()}/deployments/${selectedId}/logs`)

        es.onmessage = (evt) => {
            setLogs((prev) => [...prev, evt.data])
        }

        es.onerror = () => {
            es.close()
        }

        return () => {
            es.close()
        }
    }, [selectedId])

    // Create deployment mutation (git URL)
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.split(',')[1]
            setUploading(true)
            try {
                await fetch(`${apiBase()}/deployments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uploadBase64: base64, filename: file.name }),
                })
                queryClient.invalidateQueries({ queryKey: ['deployments'] })
            } catch (err) {
                console.error('Upload failed', err)
                alert('Upload failed')
            } finally {
                setUploading(false)
            }
        }
        // Read as data URL so we can extract base64 safely
        reader.readAsDataURL(file)
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
                            disabled={createMutation.isPending || uploading}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button type="submit" disabled={createMutation.isPending || uploading}>
                                {createMutation.isPending ? 'Deploying...' : 'Deploy'}
                            </button>
                            <label className="file-upload">
                                <input type="file" accept=".tar.gz,.tgz,.zip" onChange={handleFileChange} disabled={uploading || createMutation.isPending} />
                                <span>{uploading ? 'Uploading...' : 'Upload & Deploy'}</span>
                            </label>
                        </div>
                    </form>

                    <div className="deployments-list">
                        <h2>Deployments ({deployments.length})</h2>
                        {deployments.length === 0 ? (
                            <p className="empty">No deployments yet</p>
                        ) : (
                            deployments.map((dep: any) => (
                                <div
                                    key={dep.id}
                                    className={`deployment-item ${dep.status} ${selectedId === dep.id ? 'selected' : ''}`}
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

// helper to match api.ts API_BASE
function apiBase() {
    return 'http://localhost:4000'
}

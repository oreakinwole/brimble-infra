import { RootRoute, Router } from '@tanstack/react-router'
import Dashboard from './pages/Dashboard'

const rootRoute = new RootRoute({
    component: () => <Dashboard />,
})

const routeTree = rootRoute.addChildren([])

export const router = new Router({ routeTree })
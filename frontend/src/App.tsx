import { RecoilRoot } from 'recoil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import AppRoutes from './router/Router.index'
import RecoilNexus from 'recoil-nexus'

const queryClient = new QueryClient()

function App() {

  return (
    <>
    <RecoilRoot>
    <RecoilNexus />
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="bottom-right" />
      <AppRoutes />
    </QueryClientProvider>
    </RecoilRoot>
    </>
  )
}

export default App

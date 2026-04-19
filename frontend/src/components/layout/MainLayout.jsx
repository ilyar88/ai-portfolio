import PropTypes from 'prop-types'
import { NavBar } from './NavBar'

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a3a5c_0%,_#0a0f1e_65%)] text-white overflow-hidden">
      <div className="fixed inset-0 bg-grid-pattern opacity-10" />
      <NavBar />
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired
} 
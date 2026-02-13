import { useState, useEffect } from 'react'
import { fetchUserRepos } from '../services/github'

export const useGithubRepos = (username, limit = 6) => {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRepos = async () => {
      try {
        const data = await fetchUserRepos(username)
        const filtered = data.filter(repo => !repo.fork || repo.name === 'ai-portfolio')
        const aiPortfolio = filtered.find(repo => repo.name === 'ai-portfolio')
        const others = filtered.filter(repo => repo.name !== 'ai-portfolio')
        const ordered = [...others.slice(0, limit - 1), ...(aiPortfolio ? [aiPortfolio] : [])].slice(0, limit)
        setRepos(ordered)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadRepos()
  }, [username, limit])

  return { repos, loading, error }
} 
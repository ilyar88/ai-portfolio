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
        const pinnedForks = ['Dockerized_Flask_Mongo_App_Project', 'ai-portfolio']
        const filtered = data.filter(repo => !repo.fork || pinnedForks.includes(repo.name))
        const pinned = pinnedForks.map(name => filtered.find(repo => repo.name === name)).filter(Boolean)
        const others = filtered.filter(repo => !pinnedForks.includes(repo.name))
        const ordered = [...others.slice(0, limit - pinned.length), ...pinned].slice(0, limit)
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
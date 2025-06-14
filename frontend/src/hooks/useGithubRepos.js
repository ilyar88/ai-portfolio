import { useState, useEffect } from 'react'
import { fetchUserRepos } from '../services/github'

export const useGithubRepos = (username, includeForkName = null, limit = 6) => {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRepos = async () => {
      try {
        const data = await fetchUserRepos(username)

        // Filter non-forked repos
        let filtered = data.filter(repo => !repo.fork)

        // Optionally include a specific fork by name
        if (includeForkName) {
          const fork = data.find(
            repo => repo.fork && repo.name.toLowerCase() === includeForkName.toLowerCase()
          )
          if (fork && !filtered.some(r => r.id === fork.id)) {
            filtered.push(fork)
          }
        }

        setRepos(filtered.slice(0, limit))
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    loadRepos()
  }, [username, includeForkName, limit])

  return { repos, loading, error }
}

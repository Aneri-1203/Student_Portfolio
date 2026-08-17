import { useEffect, useState } from 'react';
import Spinner from '../components/spinner';
import ErrorMessage from '../components/errormessage';

const GITHUB_USERNAME = 'Aneri-1203';
const GITHUB_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(GITHUB_API);

        if (!response.ok) {
          throw new Error(
            `GitHub request failed with status ${response.status}`
          );
        }

        const repositories = await response.json();

        // Only show public repositories that are not forks.
        const publicRepositories = repositories.filter(
          (repo) => !repo.fork
        );

        const projectsWithLanguages = await Promise.all(
          publicRepositories.map(async (repo) => {
            try {
              const languageResponse = await fetch(repo.languages_url);

              if (!languageResponse.ok) {
                return {
                  ...repo,
                  technologies: repo.language ? [repo.language] : [],
                };
              }

              const languages = await languageResponse.json();

              const technologies = Object.keys(languages).slice(0, 6);

              return {
                ...repo,
                technologies,
              };
            } catch {
              return {
                ...repo,
                technologies: repo.language ? [repo.language] : [],
              };
            }
          })
        );

        setProjects(projectsWithLanguages);
      } catch (err) {
        console.error(err);
        setError(
          'Unable to load your GitHub projects. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [reloadKey]);

  const handleRetry = () => {
    setReloadKey((previous) => previous + 1);
  };

  return (
    <section id="projects" className="projects">
      <div className="projects-heading">
        <div>
          <p className="section-label">Projects</p>
          <h2>Things I have built</h2>
        </div>

        <a
          className="github-profile-link"
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View GitHub ↗
        </a>
      </div>

      <p className="projects-intro">
        My public GitHub projects 
       
      </p>

      {loading && <Spinner />}

      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="empty-state">
          <p>No public projects found yet.</p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map((project) => (
            <a
              key={project.id}
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card"
            >
              <div className="project-card-top">
                <span className="project-folder">
                  PROJECT
                </span>

                <span className="project-arrow">
                  ↗
                </span>
              </div>

              <h3>{project.name}</h3>

              <p>
                {project.description ||
                  'A project built while learning and exploring software development.'}
              </p>

              <div className="project-techs">
                {project.technologies.length > 0 ? (
                  project.technologies.map((technology) => (
                    <span key={technology}>
                      {technology}
                    </span>
                  ))
                ) : (
                  <span>Technology not specified</span>
                )}
              </div>

              <div className="project-meta">
                <span>
                  ⭐ {project.stargazers_count}
                </span>

                <span>
                  Forks: {project.forks_count}
                </span>

                <span>
                  {project.visibility}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default Projects;
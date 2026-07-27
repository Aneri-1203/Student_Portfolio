import { useState, useEffect } from 'react';
import Spinner from '../components/spinner';
import ErrorMessage from '../components/errormessage';

// title/description/tech are yours — just fill in each repo as "owner/repo-name"
// exactly as it appears in the GitHub URL, e.g. github.com/OWNER/REPO
const projects = [
  {
    title: 'SkillSync',
    description: 'A full-stack web application that enables users to connect, exchange skills, and collaborate through a secure and interactive skill-sharing platform.',
    tech: ['React.js', 'FastAPI', 'MongoDB', 'Tailwind', 'Python'],
     repo: 'mahek-40/SkillSync',

  },
  {
    title: 'Fleet Management System',
    description: 'A full-stack web application that streamlines fleet operations through vehicle tracking, trip management, maintenance monitoring, and role-based access control.',
    tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'HTML', 'CSS'],
    repo: 'PatelSaumya-hub/odoo-Hackathon--26Gvp',
  },
  {
    title: 'AI Supply Chain Risk',
    description: 'An AI-powered web dashboard that automatically classifies pharmaceutical supply chain records into risk categories and severity levels using machine learning.',
    tech: ['Python', 'Flask', 'Machine Learning', 'HTML', 'CSS'],
    repo: '24AIML048-Vidhi/AI_SupplyChain_Risk',
  },
];


function Projects() {
  const [repoData, setRepoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.allSettled(
      projects.map((project) =>
        fetch(`https://api.github.com/repos/${project.repo}`).then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
      )
    ).then((results) => {
      const map = {};
      let anySucceeded = false;

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          map[projects[i].repo] = result.value;
          anySucceeded = true;
        }
      });

      setRepoData(map);
      if (!anySucceeded) setError('Could not reach GitHub for any project.');
      setLoading(false);
    });
  }, [reloadKey]);

  const handleRetry = () => setReloadKey((prev) => prev + 1);

  if (loading) {
    return (
      <section id="projects" className="projects">
        <p className="section-label">Projects</p>
        <Spinner />
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="projects">
        <p className="section-label">Projects</p>
        <ErrorMessage message={error} onRetry={handleRetry} />
      </section>
    );
  }

  return (
    <section id="projects" className="projects">
      <p className="section-label">Projects</p>
      <div className="projects-grid">
        {projects.map((project) => {
          const repo = repoData[project.repo];
          return (
            <a
              key={project.title}
              href={repo ? repo.html_url : `https://github.com/${project.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card"
            >
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <ul className="skills-grid">
                {project.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {repo && <span className="repo-stars">⭐ {repo.stargazers_count}</span>}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default Projects;
const projects = [
  {
    id: 1,
    name: 'Student Portfolio',
    description:
      'A personal portfolio website built to showcase my projects, skills, and academic work.',
    technology: 'JavaScript',
    github:
      'https://github.com/Aneri-1203/Student_Portfolio',
  },

  {
    id: 2,
    name: 'BrainBuddy',
    description:
      'An application project focused on building a useful and interactive software solution.',
    technology: 'Python',
    github:
      'https://github.com/Aneri-1203/BrainBuddy',
  },

  {
    id: 3,
    name: 'Simple Chat Application',
    description:
      'A simple chat application developed to understand communication between users and application components.',
    technology: 'JavaScript',
    github:
      'https://github.com/Aneri-1203/simple-chat-application',
  },

  {
    id: 4,
    name: 'Backend AWDF',
    description:
      'Backend development work using Node.js, Express and MongoDB for web application functionality.',
    technology: 'Node.js',
    github:
      'https://github.com/Aneri-1203/backend_awdf',
  },

  {
    id: 5,
    name: 'Git Session',
    description:
      'A project created while learning and practicing Git and GitHub version control concepts.',
    technology: 'Git',
    github:
      'https://github.com/Aneri-1203/git-session',
  },

  {
    id: 6,
    name: 'Assignment W4',
    description:
      'Academic assignment project developed as part of my coursework and practical learning.',
    technology: 'JavaScript',
    github:
      'https://github.com/Aneri-1203/assignment-w4-24aiml031',
  },
];

function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="projects-heading">
        <div>
          <p className="section-label">Projects</p>

          <h2>Things I have built</h2>
        </div>

        <a
          className="github-profile-link"
          href="https://github.com/Aneri-1203"
          target="_blank"
          rel="noopener noreferrer"
        >
          View GitHub ↗
        </a>
      </div>

      <p className="projects-intro">
        A collection of projects I have built while learning
        software development and exploring different technologies.
      </p>

      <div className="projects-grid">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.github}
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

            <p>{project.description}</p>

            <div className="project-techs">
              <span>{project.technology}</span>
            </div>

            <div className="project-meta">
              <span>GitHub</span>

              <span>Public Repository</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default Projects;
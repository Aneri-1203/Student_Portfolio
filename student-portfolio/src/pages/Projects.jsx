const projects = [
  {
    title: 'SkillSync',
    description: 'A full-stack web application that enables users to connect, exchange skills, and collaborate through a secure and interactive skill-sharing platform.',
    tech: ['React.js','FastAPI','MongoDB','Tailwind','Python'],
  },
  {
    title: 'Fleet Management System',
    description: 'a full-stack web application that streamlines fleet operations through vehicle tracking, trip management, maintenance monitoring, and role-based access control.',
    tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'HTML', 'CSS'],
  },
  {
    title: 'AI Supply chain Risk',
    description: 'An AI-powered web dashboard that automatically classifies pharmaceutical supply chain records into risk categories and severity levels using machine learning.',
    tech: ['Python', 'Flask', 'Machine Learning', 'HTML', 'CSS']
  },
];

function Projects() {
  return (
    <section id="projects" className="projects">
      <p className="section-label">Projects</p>
      <div className="projects-grid">
        {projects.map((project) => (
          <div className="project-card" key={project.title}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <ul className="skills-grid">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Projects;
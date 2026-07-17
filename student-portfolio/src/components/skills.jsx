function Skills({ skillList }) {
  return (
    <section id="skills">
      <p className="section-label">Skills</p>
      <ul className="skills-grid">
        {skillList.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;

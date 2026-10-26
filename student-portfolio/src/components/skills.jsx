import { memo } from 'react';

/**
 * Skills — receives a skillList array prop.
 * Wrapped in React.memo so it only re-renders when skillList actually changes.
 * In Home.jsx the skillList is defined as a module-level constant, so its
 * reference never changes between renders. Without memo, Skills re-renders
 * on every Home render even though the list is always the same.
 */
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

export default memo(Skills);

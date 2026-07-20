import Header from '../components/Header';
import About from '../components/About';
import Skills from '../components/Skills';

const skillList = ['HTML', 'CSS', 'Git','C++', 'Python', 'MongoDB'];

function Home() {
  return (
    <>
      <Header name="Patel Aneri" themeColor="#f2a65a" />
      <About />
      <Skills skillList={skillList} />
    </>
  );
}

export default Home;
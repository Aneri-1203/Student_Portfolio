import NavBar from './components/NavBar';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import Footer from './components/Footer';
import './App.css';

const skillList = ['JavaScript', 'React', 'Vite', 'HTML', 'CSS', 'Git', 'Node.js'];

function App() {
  return (
    <div className="app">
      <NavBar />
      <Header name="Patel Aneri" themeColor="#f2a65a" />
      <About />
      <Skills skillList={skillList} />
      <Footer />
    </div>
  );
}

export default App;

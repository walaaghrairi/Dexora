import Navbar from "./components/layout/Navbar";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import Stats from "./components/landing/Stats";
import About from "./components/landing/About";
import CTA from "./components/landing/CTA";

function App() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Stats />
                <About />
                <CTA />
            </main>
        </>
    );
}

export default App;
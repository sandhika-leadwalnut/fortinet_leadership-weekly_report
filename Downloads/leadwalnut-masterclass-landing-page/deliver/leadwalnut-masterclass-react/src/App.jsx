import "./styles.css";
import { Header, Band3x, Reality, Clock, Audience, Cover, Proof, Host, Agents, CtaBanner, Footer } from "./components/Sections";
import Hero from "./components/Hero";
import Register from "./components/Register";
import Faq from "./components/Faq";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Band3x />
        <Reality />
        <Clock />
        <Audience />
        <Cover />
        <Register />
         <Agents />
        <Proof />
        <Host />
      
        <CtaBanner />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

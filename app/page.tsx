import { Hero } from "@/components/landing/hero";
import { PerceptionGap } from "@/components/landing/perception-gap";
import { Features } from "@/components/landing/features";
import { Village } from "@/components/landing/village";
import { Research } from "@/components/landing/research";
import { Quickstart } from "@/components/landing/quickstart";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/ui/nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PerceptionGap />
        <Features />
        <Village />
        <Research />
        <Quickstart />
      </main>
      <Footer />
    </>
  );
}

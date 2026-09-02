import { motion } from "framer-motion";
import {
  ArrowRight,
  Upload,
  Wand2,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: Upload,
    title: "Upload Any Photo",
    description:
      "Start with a photo of yourself or anyone. Our AI detects subjects automatically and handles the rest.",
  },
  {
    icon: Wand2,
    title: "Describe Your Vision",
    description:
      "Type what you want — a red evening gown, a tailored navy suit, streetwear, or anything else. Natural language, no prompts to memorize.",
  },
  {
    icon: Layers,
    title: "Multiple Subjects",
    description:
      "One photo, multiple people? Each person gets their own outfit change, independently styled and generated.",
  },
  {
    icon: Sparkles,
    title: "Chat to Refine",
    description:
      "Not quite right? Chat with the editor to adjust colors, fit, fabric, or try something completely different — iteration until it's perfect.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload your photo",
    description: "Drag and drop or click to upload. Supports all common formats.",
  },
  {
    number: "02",
    title: "Describe the outfit",
    description:
      'Type a natural description like "flowing white summer dress" or "structured black blazer with jeans".',
  },
  {
    number: "03",
    title: "Get your result",
    description:
      "AI generates the new outfit on your photo in seconds. Refine with chat until it's exactly right.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCta = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <Wand2 className="size-4 text-background" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Outfit Studio
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="cursor-pointer gap-2"
            onClick={handleCta}
          >
            Get Started
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.85_0_0/40%),transparent)]" />
        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-3" />
              AI-Powered Outfit Changes
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight sm:text-7xl"
          >
            Change any outfit
            <br />
            <span className="text-muted-foreground">in any photo</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Upload a photo, describe the outfit you want, and let AI do the
            rest. Natural language editing, multiple subjects, infinite
            possibilities.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-10 flex justify-center">
            <Button
              size="lg"
              className="cursor-pointer gap-2 px-8 text-base"
              onClick={handleCta}
            >
              Start Creating
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="border-t border-border/50 bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps. That's it.
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <span className="mb-4 inline-block text-4xl font-bold text-border">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for precision
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-xl border border-border/60 bg-card p-8 transition-colors hover:border-border"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-border/50 bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              Why Outfit Studio
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The outfit change tool that just works
            </h2>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              {[
                "Natural language — no prompt engineering",
                "Multiple subjects in one photo",
                "Iterative chat-based refinement",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to try it?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Upload a photo and see what's possible. No account required to
            start.
          </p>
          <Button
            size="lg"
            className="mt-8 cursor-pointer gap-2 px-8 text-base"
            onClick={handleCta}
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-foreground">
              <Wand2 className="size-3 text-background" />
            </div>
            <span className="font-medium">Outfit Studio</span>
          </div>
          <span>© {new Date().getFullYear()} Outfit Studio</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Dice1, Dice2, Dice3, Sword, Shield, Crown, Users, Map, BookOpen, Sparkles, ChevronDown, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/hivium-logo.png";

function useCounter(target: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    let animationFrame: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) animationFrame = requestAnimationFrame(step);
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, start]);
  return count;
}

function FloatingDice() {
  const dice = [
    { Icon: Dice1, delay: 0, x: "10%", y: "20%", size: 48, opacity: 0.08 },
    { Icon: Dice2, delay: 0.5, x: "80%", y: "15%", size: 36, opacity: 0.06 },
    { Icon: Dice3, delay: 1, x: "70%", y: "70%", size: 52, opacity: 0.07 },
    { Icon: Sword, delay: 1.5, x: "20%", y: "75%", size: 40, opacity: 0.05 },
    { Icon: Shield, delay: 2, x: "85%", y: "45%", size: 32, opacity: 0.06 },
    { Icon: Crown, delay: 0.8, x: "50%", y: "85%", size: 44, opacity: 0.05 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dice.map(({ Icon, delay, x, y, size, opacity }, i) => (
        <motion.div
          key={i}
          className="absolute text-primary"
          style={{ left: x, top: y, opacity }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 6 + delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

function HeroSection() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  async function handleStart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/hive");
    } else {
      router.push("/cadastro");
    }
  }

  return (
    <motion.section
      style={{ y, opacity }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <ParticleField />
      <FloatingDice />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <img src={logoImg.src} alt="HIVIUM" className="h-20 w-20 mx-auto object-contain mb-6" />
        </motion.div>

        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-none tracking-tight"
        >
          <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            HIVIUM
          </span>
        </motion.h1>

        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Encontre sua mesa. Conecte-se com mestres e jogadores.
          <br />
          <span className="text-foreground font-medium">Sua próxima aventura começa aqui.</span>
        </motion.p>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="h-5 w-5" />
            Começar Agora
            <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-8 py-4 text-lg font-medium text-foreground hover:bg-card hover:border-border transition-all duration-300"
          >
            <Play className="h-5 w-5" />
            Ver Mais
          </button>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 animate-bounce"
        >
          <ChevronDown className="h-6 w-6 mx-auto text-muted-foreground/50" />
        </motion.div>
      </div>
    </motion.section>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const mesas = useCounter(2847, 2500, inView);
  const jogadores = useCounter(12500, 2500, inView);
  const sessoes = useCounter(45000, 2500, inView);

  const stats = [
    { label: "Mesas Ativas", value: mesas.toLocaleString("pt-BR"), icon: Map },
    { label: "Jogadores Conectados", value: jogadores.toLocaleString("pt-BR"), icon: Users },
    { label: "Sessões Realizadas", value: sessoes.toLocaleString("pt-BR"), icon: BookOpen },
  ];

  return (
    <section ref={ref} className="py-20 border-y border-border/30 bg-card/30">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={false}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <Icon className="h-8 w-8 mx-auto text-primary mb-3" />
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Map,
      title: "Descubra Mesas",
      desc: "Encontre mesas de RPG presenciais e online que combinam com seu estilo, sistema e disponibilidade.",
    },
    {
      icon: Crown,
      title: "Para Mestres",
      desc: "Crie suas mesas, gerencie inscrições, construa sua reputação e conecte-se com jogadores dedicados.",
    },
    {
      icon: Users,
      title: "Comunidade",
      desc: "Feed de conteúdo, chat integrado, reviews e sistema de reputação para fortalecer laços na mesa.",
    },
    {
      icon: Sword,
      title: "Ferramentas de Sessão",
      desc: "Fichas de personagem, soundboard, dados virtuais e preparação de sessão tudo em um só lugar.",
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      desc: "Perfis verificados, sistema de reviews e moderação ativa para uma experiência segura para todos.",
    },
    {
      icon: Sparkles,
      title: "Grátis Para Começar",
      desc: "Crie sua conta, encontre mesas e jogue sem custo. Planos premium com recursos exclusivos para mestres.",
    },
  ];

  return (
    <section id="features" ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={false}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              jogar
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para jogadores, mestres e lojas de RPG.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={false}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  async function handleCTA() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/hive");
    } else {
      router.push("/cadastro");
    }
  }

  return (
    <section ref={ref} className="py-24 px-4">
      <motion.div
        initial={false}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        className="max-w-3xl mx-auto text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-600/10 to-primary/10 rounded-3xl blur-2xl" />
        <div className="relative p-12 md:p-16 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Pronto para rolar os dados?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Junte-se a milhares de jogadores e mestres. Sua próxima campanha épica está a um clique de distância.
          </p>
          <button
            onClick={handleCTA}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="h-5 w-5" />
            Criar Conta Grátis
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src={logoImg.src} alt="HIVIUM" className="h-8 w-8 object-contain" />
          <span className="font-display font-bold text-sm gradient-text">HIVIUM</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <a href="/quem-somos" className="hover:text-foreground transition-colors">Quem Somos</a>
          <a href="/contato" className="hover:text-foreground transition-colors">Contato</a>
          <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
          <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} HIVIUM. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg.src} alt="HIVIUM" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-sm gradient-text">HIVIUM</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="/quem-somos" className="hover:text-foreground transition-colors">Quem Somos</a>
            <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Entrar
            </a>
            <a
              href="/cadastro"
              className="text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg px-4 py-2 transition-colors"
            >
              Criar Conta
            </a>
          </div>
        </div>
      </nav>

      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}

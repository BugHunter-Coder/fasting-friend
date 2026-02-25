import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Activity, 
  Zap, 
  Heart, 
  Calendar,
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      title: "Smart Fasting Timer",
      description: "Adaptive schedules that match your lifestyle, from 16:8 to OMAD."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-blue-500" />,
      title: "HealthKit Integration",
      description: "Seamlessly sync steps, weight, and activity from your Apple Health or Google Fit."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
      title: "Data Privacy",
      description: "Your health data is encrypted and secure. You own your data, always."
    },
    {
      icon: <Activity className="h-6 w-6 text-rose-500" />,
      title: "Advanced Insights",
      description: "Visualize your progress with beautiful charts and health trend analysis."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-primary p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">FastFlow</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">How it Works</a>
            <div className="h-4 w-px bg-slate-200" />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-bold">Log in</Button>
            <Button onClick={() => navigate("/auth")} className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">Get Started</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-6 space-y-4 shadow-xl"
          >
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold">Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold">How it Works</a>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" onClick={() => navigate("/auth")} className="w-full h-12 rounded-xl font-bold">Log in</Button>
              <Button onClick={() => navigate("/auth")} className="w-full h-12 rounded-xl font-bold">Get Started</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold tracking-wide uppercase mb-6">
              The Future of Fasting is Here
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Unlock Your <span className="text-primary italic">Health potential</span> with FastFlow
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Master intermittent fasting with smart tracking, deep health insights, and seamless device integration. Simple, effective, and science-backed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => navigate("/auth")} className="w-full sm:w-auto h-14 px-10 rounded-full text-lg font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                Start Free Fasting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg font-bold text-slate-600">
                View Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero App Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="relative z-10 rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[21/9]">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
                alt="App Dashboard" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 text-left text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Live Insights</p>
                <h3 className="text-2xl font-black">Beautiful Health Dashboards</h3>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-10 -right-10 hidden lg:block z-20">
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                <div className="bg-rose-100 p-3 rounded-2xl">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Heart Rate</p>
                  <p className="text-xl font-black text-slate-900">72 BPM</p>
                </div>
              </div>
            </div>
            
            <div className="absolute top-1/2 -left-20 hidden lg:block z-20">
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Active Streak</p>
                  <p className="text-xl font-black text-slate-900">14 Days</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to <span className="text-primary">Succeed</span></h2>
            <p className="text-lg text-slate-500">We've combined the latest science with a world-class user experience to help you achieve your health goals.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl"
              >
                <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Trusted by over 10,000+ health enthusiasts</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
            <h4 className="text-2xl font-black italic">HEALTHLINE</h4>
            <h4 className="text-2xl font-black italic">Wellness.co</h4>
            <h4 className="text-2xl font-black italic">FITNESS</h4>
            <h4 className="text-2xl font-black italic">BioHacker</h4>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Ready to transform your life?</h2>
              <p className="text-primary-foreground/80 text-lg mb-12 max-w-2xl mx-auto">
                Join thousands of others who have already unlocked a healthier, more energetic version of themselves with FastFlow.
              </p>
              <Button onClick={() => navigate("/auth")} className="h-16 px-12 rounded-full bg-white text-primary hover:bg-slate-50 text-xl font-black transition-transform hover:scale-105">
                Join FastFlow Now
              </Button>
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/60 text-sm font-bold">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> No Credit Card Required</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Science Backed</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Native Integrations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">FastFlow</span>
            </div>
            
            <div className="flex gap-8 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
            
            <p className="text-slate-400 text-sm font-medium">© 2026 FastFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

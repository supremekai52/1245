import { Shield, Globe, Lock, Zap, CheckCircle, ArrowRight, GraduationCap, Building2, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCount(Math.floor(progress * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return <div ref={ref}>{count}</div>;
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          particle.x -= dx * 0.01;
          particle.y -= dy * 0.01;
        }

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}


export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const [gradientPosition, setGradientPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setGradientPosition(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <motion.div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(${gradientPosition * 180}deg, rgb(239, 246, 255) 0%, rgb(255, 255, 255) ${50 + gradientPosition * 30}%, rgb(249, 250, 251) 100%)`
        }}
      >
        <ParticleBackground />
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="text-center">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <motion.div
                className="p-4 bg-white rounded-2xl shadow-lg border-2 border-blue-600"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SDhWvIaGwyyoH9wENFZ4EFEqQCr4UXIVjw&s"
                  alt="CredSphere Logo"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </motion.div>
            </motion.div>
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              CredSphere
              <motion.span
                className="block text-blue-600 mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                On the Blockchain
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              A decentralized platform enabling instant verification of academic credentials
              for students pursuing higher education abroad. Built on Ethereum Sepolia with
              soulbound token technology.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-10"
          style={{ y: backgroundY }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </motion.div>
      </motion.div>

      <div id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Revolutionary technology ensuring the authenticity and portability of academic credentials worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Immutable Security</h3>
              <p className="text-gray-600">
                Credentials stored on the blockchain cannot be forged, altered, or deleted,
                ensuring permanent proof of academic achievement.
              </p>
            </motion.div>

            <motion.div
              className="p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Verification</h3>
              <p className="text-gray-600">
                Universities and employers can verify credentials in seconds, eliminating
                lengthy verification processes and reducing fraud.
              </p>
            </motion.div>

            <motion.div
              className="p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Globe className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Global Interoperability</h3>
              <p className="text-gray-600">
                Standards-based solution recognized internationally, enabling seamless
                credential sharing across borders for study abroad programs.
              </p>
            </motion.div>

            <motion.div
              className="p-8 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Lock className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy Protected</h3>
              <p className="text-gray-600">
                Students control who can access their credentials through secure sharing
                mechanisms and privacy-preserving verification.
              </p>
            </motion.div>

            <motion.div
              className="p-8 bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-teal-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Users className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lifelong Ownership</h3>
              <p className="text-gray-600">
                Soulbound tokens ensure students maintain permanent ownership of their
                credentials throughout their academic and professional journey.
              </p>
            </motion.div>

            <motion.div
              className="p-8 bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 backdrop-blur-sm bg-white/70 hover:shadow-2xl transition-all group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tamper-Proof Records</h3>
              <p className="text-gray-600">
                Built-in audit trails and cryptographic proofs ensure that every credential
                is authentic and has not been modified.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to secure, verifiable credentials
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 mb-16">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Issue</h3>
              <p className="text-gray-600">
                Institutions mint credentials as NFTs or soulbound tokens on the Sepolia blockchain,
                storing detailed academic information securely.
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Store</h3>
              <p className="text-gray-600">
                Students receive credentials in their digital wallet, maintaining full control
                and ownership. Transcripts and certificates are stored on IPFS.
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div
                className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Shield className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">3. Verify</h3>
              <p className="text-gray-600">
                Universities and employers instantly verify credentials using blockchain
                technology, with QR codes for quick access.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-green-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="relative rounded-3xl p-12 text-center shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://i.pinimg.com/originals/88/15/63/881563d6444b370fa4ceea0c3183bb4c.gif"
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/60"></div>
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent"></div>
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent"></div>
            </div>
            <div className="relative z-10">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors inline-flex items-center shadow-lg hover:shadow-xl"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="py-12 bg-gray-50 border-t border-gray-200"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <AnimatedCounter target={100} />
                <span>%</span>
              </div>
              <p className="text-gray-600">Blockchain Security</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-3xl font-bold text-green-600 mb-2">
                <AnimatedCounter target={99} />
                <span>%</span>
              </div>
              <p className="text-gray-600">Uptime Guarantee</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-3xl font-bold text-purple-600 mb-2">
                <AnimatedCounter target={0} />
                <span>+</span>
              </div>
              <p className="text-gray-600">Data Breaches</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
 
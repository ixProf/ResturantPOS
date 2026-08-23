import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Languages,
  Sun,
  Moon,
  ExternalLink,
  ArrowRight,
  ArrowDown,
  Send,
  Mail,
  User,
  MessageSquare,
  Grid,
  ShoppingBag,
  UtensilsCrossed,
  Boxes,
  CreditCard,
  Users,
  Activity,
  CheckCircle2,
  Globe,
  Smartphone,
  Code2,
  Briefcase,
  Cpu,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import type { OrderStatus } from '../types/api';

export const AboutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Live Interactive Mockup State (Cycles Order Pipeline)
  const orderPipeline: OrderStatus[] = ['Draft', 'Submitted', 'Preparing', 'Ready', 'Served'];
  const [pipelineIndex, setPipelineIndex] = useState(2); // Starts at 'Preparing'

  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineIndex((prev) => (prev + 1) % orderPipeline.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentStatus = orderPipeline[pipelineIndex];

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Inquiry from ${contactName || 'Website Visitor'}`);
    const body = encodeURIComponent(
      `Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`
    );
    window.location.href = `mailto:contact@alaris.space?subject=${subject}&body=${body}`;
  };

  const capabilities = [
    {
      icon: <Grid className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.tablesTitle'),
      desc: t('about.capabilities.tablesDesc'),
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.posTitle'),
      desc: t('about.capabilities.posDesc'),
    },
    {
      icon: <UtensilsCrossed className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.kdsTitle'),
      desc: t('about.capabilities.kdsDesc'),
    },
    {
      icon: <Boxes className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.inventoryTitle'),
      desc: t('about.capabilities.inventoryDesc'),
    },
    {
      icon: <CreditCard className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.paymentsTitle'),
      desc: t('about.capabilities.paymentsDesc'),
    },
    {
      icon: <Users className="w-5 h-5 text-[var(--primary-color)]" />,
      title: t('about.capabilities.rolesTitle'),
      desc: t('about.capabilities.rolesDesc'),
    },
  ];

  const services = [
    {
      icon: <Globe className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.web'),
    },
    {
      icon: <Smartphone className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.mobile'),
    },
    {
      icon: <Code2 className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.custom'),
    },
    {
      icon: <Briefcase className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.business'),
    },
    {
      icon: <Cpu className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.ai'),
    },
    {
      icon: <Zap className="w-4 h-4 text-[var(--primary-color)]" />,
      label: t('about.services.automation'),
    },
  ];

  const products = [
    {
      key: 'orbit',
      name: t('about.products.orbitName'),
      description: t('about.products.orbitDesc'),
      url: 'https://alarisorbit-one.vercel.app/',
      isExternal: true,
      tag: 'FINANCE & BOOKING',
    },
    {
      key: 'nexus',
      name: t('about.products.nexusName'),
      description: t('about.products.nexusDesc'),
      url: 'https://alaris-nexus-m562tacub-profthorfinns-projects.vercel.app/?_vercel_share=JAXUjLKOnKM7l8rpM3vxlu2SHmfIgfkP',
      isExternal: true,
      tag: 'E-COMMERCE & DASHBOARDS',
    },
    {
      key: 'flowx',
      name: t('about.products.posName'),
      description: t('about.products.posDesc'),
      url: isAuthenticated ? '/tables' : '/login',
      isExternal: false,
      tag: 'RESTAURANT POS & MANAGEMENT',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--fg-color)] flex flex-col justify-between transition-colors">
      {/* Top Header Bar */}
      <header className="w-full border-b border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 gap-3">
            <img
              src={logoImg}
              alt={t('app.logoAlt')}
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-base tracking-tight text-[var(--fg-color)]">
              Alaris FlowX
            </span>
          </Link>

          <div className="flex items-center space-x-2 gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              <Languages className="w-4 h-4" />
              <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="p-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>
            <Link to={isAuthenticated ? '/tables' : '/login'}>
              <Button variant="brand" size="sm">
                {isAuthenticated ? t('about.goToDashboard') : t('about.loginCTA')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-24">
        {/* 1. HERO SECTION - Alaris FlowX Visual Anchor & Live Interactive Terminal Mockup */}
        <section className="text-center space-y-8 py-6 relative">
          {/* Subtle Ambient Brand Glow (Hero Background Only) */}
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--primary-color)]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

          {/* Large Alaris FlowX Hero Logo */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src={logoImg}
              alt={t('app.logoAlt')}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl transition-transform hover:scale-105"
            />
            <div className="inline-flex items-center space-x-2 gap-2 px-3.5 py-1 rounded-full bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] text-xs font-semibold text-[var(--muted-fg)]">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Alaris FlowX Engine v2.0</span>
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--fg-color)]">
              <span className="brand-gradient-text">Alaris FlowX</span>
            </h1>
            <p className="text-base sm:text-xl font-medium text-[var(--muted-fg)] leading-relaxed max-w-2xl mx-auto">
              {t('about.flowxTagline')}
            </p>
          </div>

          {/* Primary CTA Button */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <Button
              variant="brand"
              size="lg"
              onClick={() => navigate(isAuthenticated ? '/tables' : '/login')}
              className="px-8 py-3.5 text-base shadow-xl space-x-2 gap-2"
            >
              <span>{isAuthenticated ? t('about.goToDashboard') : t('about.loginCTA')}</span>
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Subtle Bridge Anchor Link to About Alaris Space Section */}
            <a
              href="#about-alaris-space"
              className="inline-flex items-center space-x-1.5 gap-1.5 text-xs text-[var(--muted-fg)] hover:text-[var(--primary-color)] transition-colors pt-2 group"
            >
              <span>{t('about.developedBy')}</span>
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* LIVE INTERACTIVE PRODUCT MOCKUP - Live POS & KDS Pipeline Simulator */}
          <div className="max-w-4xl mx-auto mt-10 text-start">
            <div className="bg-[var(--card-bg)] border border-[var(--glass-border-color)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Terminal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center space-x-3 gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--fg-color)] tracking-tight">
                      {t('about.livePreviewTitle')}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-fg)] font-mono">
                      SignalR OrderHub • Terminal #01 (Active Floor)
                    </p>
                  </div>
                </div>
                <Badge status="Available">Real-time Sync Active</Badge>
              </div>

              {/* Mockup Grid: Floor Grid & Active Order Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Simulated Table Floor View */}
                <div className="bg-[var(--secondary-bg)]/60 border border-[var(--border-color)] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs text-[var(--muted-fg)] font-semibold uppercase">
                    <span>Floor Overview</span>
                    <span className="font-mono">4 Tables Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-amber-800/40 relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[var(--fg-color)]">Table 04</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-[var(--muted-fg)]">4 Seats • Occupied</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-emerald-800/40 relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[var(--fg-color)]">Table 02</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <p className="text-[10px] text-[var(--muted-fg)]">2 Seats • Available</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-purple-800/40 relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[var(--fg-color)]">Table 07</span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-[var(--muted-fg)]">6 Seats • Preparing</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-blue-800/40 relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[var(--fg-color)]">Table 09</span>
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                      <p className="text-[10px] text-[var(--muted-fg)]">4 Seats • Cleaning</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Order Pipeline Ticket with Live Cycling Badge */}
                <div className="bg-[var(--secondary-bg)]/60 border border-[var(--border-color)] rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono font-bold text-[var(--primary-color)]">
                        Ticket #1042
                      </span>
                      <p className="text-xs font-bold text-[var(--fg-color)]">Table 04 • Waiter Sarah</p>
                    </div>
                    {/* Dynamic Cycling Order Status Badge */}
                    <Badge status={currentStatus}>{currentStatus}</Badge>
                  </div>

                  <div className="space-y-2 border-t border-b border-[var(--border-color)] py-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--fg-color)] font-medium">1x Truffle Mushroom Burger</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-center text-[var(--muted-fg)]">
                      <span>2x Iced Artisan Latte</span>
                      <span className="text-[10px] font-mono">Kitchen Ready</span>
                    </div>
                  </div>

                  {/* Dynamic Pipeline Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[var(--muted-fg)]">
                      <span>Kitchen KDS Progress</span>
                      <span>{Math.round(((pipelineIndex + 1) / orderPipeline.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--card-bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full brand-gradient transition-all duration-700 ease-out"
                        style={{ width: `${((pipelineIndex + 1) / orderPipeline.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. WHAT IS ALARIS FLOWX (Core Capabilities) */}
        <section className="space-y-8 pt-8 border-t border-[var(--border-color)]">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--fg-color)]">
              {t('about.flowxSectionTitle')}
            </h2>
            <p className="text-xs text-[var(--muted-fg)] max-w-lg mx-auto">
              {t('about.flowxSectionDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => (
              <Card
                key={idx}
                className="p-5 space-y-3 border border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--glass-border-color)] transition-colors"
              >
                <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)] w-fit">
                  {cap.icon}
                </div>
                <h3 className="text-base font-bold text-[var(--fg-color)] tracking-tight">
                  {cap.title}
                </h3>
                <p className="text-xs text-[var(--muted-fg)] leading-relaxed">{cap.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 3. ABOUT ALARIS SPACE (Official Company Overview & Services Grid) */}
        <section id="about-alaris-space" className="space-y-10 pt-8 border-t border-[var(--border-color)] scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-fg)] font-mono">
              {t('about.makersEyebrow')}
            </span>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--fg-color)]">
              <span className="brand-gradient-text">{t('about.makersTitle')}</span>
            </h2>

            <p className="text-xs sm:text-sm font-bold text-[var(--primary-color)] uppercase tracking-widest font-mono">
              {t('about.companyTagline')}
            </p>

            <p className="text-sm sm:text-base text-[var(--muted-fg)] leading-relaxed pt-2">
              {t('about.aboutParagraph')}
            </p>
          </div>

          {/* Services Grid (6 Items) */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h3 className="text-sm font-bold text-center uppercase tracking-wider text-[var(--muted-fg)] font-mono">
              {t('about.servicesTitle')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {services.map((srv, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 gap-3 p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs font-semibold text-[var(--fg-color)] hover:border-[var(--glass-border-color)] transition-colors"
                >
                  <div className="p-2 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)] shrink-0">
                    {srv.icon}
                  </div>
                  <span>{srv.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Suite Mini-Grid */}
          <div className="space-y-6 pt-6 border-t border-[var(--border-color)]/60">
            <h3 className="text-lg font-bold text-center text-[var(--fg-color)]">
              {t('about.ourProductsTitle')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((prod) => (
                <Card
                  key={prod.key}
                  className="flex flex-col justify-between p-6 border border-[var(--border-color)] hover:border-[var(--glass-border-color)] transition-all group"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--muted-fg)]">
                      {prod.tag}
                    </span>
                    <h3 className="text-xl font-bold text-[var(--fg-color)] tracking-tight">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-[var(--muted-fg)] leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[var(--border-color)]">
                    {prod.isExternal ? (
                      <a
                        href={prod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-block"
                      >
                        <Button variant="primary" size="sm" className="w-full justify-between">
                          <span>{t('about.openButton')}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(prod.url)}
                        className="w-full justify-between"
                      >
                        <span>{t('about.openButton')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. FOOTER & CONTACT SECTION */}
        <section className="pt-8 border-t border-[var(--border-color)] max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--fg-color)]">
              {t('about.contactTitle')}
            </h2>
            <p className="text-xs text-[var(--muted-fg)]">{t('about.contactDesc')}</p>
            <div className="pt-2">
              <a
                href="mailto:contact@alaris.space"
                className="inline-flex items-center space-x-2 gap-2 text-sm font-mono font-medium text-[var(--fg-color)] hover:text-[var(--primary-color)] transition-colors"
              >
                <Mail className="w-4 h-4 text-[var(--primary-color)]" />
                <span>contact@alaris.space</span>
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSendMail}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-2xl space-y-4 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label={t('about.nameLabel')}
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className="ps-10"
                />
                <User className="w-4 h-4 absolute start-3 top-8 text-[var(--muted-fg)]" />
              </div>

              <div className="relative">
                <Input
                  label={t('about.emailLabel')}
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="ps-10"
                />
                <Mail className="w-4 h-4 absolute start-3 top-8 text-[var(--muted-fg)]" />
              </div>
            </div>

            <div className="w-full space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted-fg)]">
                {t('about.messageLabel')}
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="How can Alaris Space assist your business?"
                  className="w-full px-3.5 py-2 text-sm bg-[var(--card-bg)] text-[var(--fg-color)] border border-[var(--border-color)] rounded-[9px] placeholder:text-[var(--muted-fg)]/60 focus:outline-none focus:border-[var(--primary-color)] transition-colors ps-10"
                />
                <MessageSquare className="w-4 h-4 absolute start-3 top-3 text-[var(--muted-fg)]" />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              <Send className="w-4 h-4" />
              <span>{t('about.sendButton')}</span>
            </Button>
          </form>
        </section>
      </main>

      {/* FOOTER & SOCIAL LINKS */}
      <footer className="border-t border-[var(--border-color)] py-8 bg-[var(--card-bg)]/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-fg)]">
          <div className="flex items-center space-x-3 gap-3">
            <img src={logoImg} alt={t('app.logoAlt')} className="w-6 h-6 object-contain" />
            <span className="font-semibold text-[var(--fg-color)]">Alaris Space</span>
          </div>

          {/* Social Links - Monochrome icons matching palette */}
          <div className="flex items-center space-x-4 gap-4">
            <span className="text-[11px] font-semibold text-[var(--muted-fg)]">
              {t('about.followUs')}:
            </span>
            <a
              href="https://www.facebook.com/profile.php?id=61592858348482"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted-fg)] hover:text-[var(--fg-color)] transition-colors p-1"
              title="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/alaris-space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted-fg)] hover:text-[var(--fg-color)] transition-colors p-1"
              title="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          </div>

          <div>{t('about.copyright')}</div>
        </div>
      </footer>
    </div>
  );
};

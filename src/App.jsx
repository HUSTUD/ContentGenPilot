import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Bot, Clipboard, Download, Edit, Star, Trash2, User, Clock, Settings, LogOut, ChevronDown, Book, MessageSquare, Twitter, Instagram, Linkedin, Pencil, XCircle, ShieldAlert, CreditCard, Palette, FileDown, Check, Lock, Menu, Bold, Italic, Heading2, Zap, Gem, Target } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, query, writeBatch } from 'firebase/firestore';

// --- Firebase and App Config ---
const firebaseConfig = {
  apiKey: "AIzaSyC3FEeCJqFJ-G6IQcUVOPGg2cGccoezNbo",
  authDomain: "contentpilot-c0774.firebaseapp.com",
  projectId: "contentpilot-c0774",
  storageBucket: "contentpilot-c0774.appspot.com",
  messagingSenderId: "285644357355",
  appId: "1:285644357355:web:44ec2289690fed5d9b88ae"
};
const appId = 'default-app-id';


// --- Reusable Components (Shared) ---
const NotificationComponent = ({ notification, setNotification }) => {
    if (!notification) return null;
    useEffect(() => {
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, [notification, setNotification]);
    
    const bgColor = notification.type === 'error' ? 'bg-red-500' : (notification.type === 'info' ? 'bg-blue-500' : 'bg-green-500');
    return (<div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg z-[100] flex items-center`}>{notification.message}</div>);
};

const AuthModal = ({ mode, setShowAuthModal, handleAuthAction, plan }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isLogin = mode === 'login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await handleAuthAction(mode, email, password, plan);
        if (result && result.error) {
            setError(getAuthErrorMessage(result.error));
        }
        setIsLoading(false);
    };
    
    const getAuthErrorMessage = (error) => {
        switch (error.code) {
            case 'auth/invalid-credential': return 'Invalid email or password.';
            case 'auth/email-already-in-use': return 'This email is already in use.';
            case 'auth/weak-password': return 'Password must be at least 6 characters.';
            case 'auth/operation-not-allowed': return 'Email/Password sign-in is not enabled in Firebase.';
            default: return 'An unexpected error occurred.';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md text-white">
                <div className="p-8">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : `Sign Up for ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}</h2><button onClick={() => setShowAuthModal({ mode: null, plan: null })} className="text-gray-400 hover:text-white">&times;</button></div>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div><label className="block text-sm text-gray-300">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" /></div>
                        <div><label className="block text-sm text-gray-300">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" /></div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full py-3 flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg disabled:bg-indigo-400">{isLoading ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Processing...</> : (isLogin ? 'Login' : 'Create Account')}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Landing Page Component (for logged-out users) ---
const LandingPage = ({ onLoginClick, onSignupClick, showNotification }) => (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
        <style>{`.gradient-bg{background-image:radial-gradient(at 27% 37%,hsla(215,98%,61%,1) 0px,transparent 0%),radial-gradient(at 97% 21%,hsla(125,98%,72%,1) 0px,transparent 50%),radial-gradient(at 52% 99%,hsla(355,98%,61%,1) 0px,transparent 50%),radial-gradient(at 10% 29%,hsla(256,96%,67%,1) 0px,transparent 50%),radial-gradient(at 97% 96%,hsla(38,60%,74%,1) 0px,transparent 50%),radial-gradient(at 33% 50%,hsla(222,67%,73%,1) 0px,transparent 50%),radial-gradient(at 79% 53%,hsla(342,94%,65%,1) 0px,transparent 50%);background-size:cover;filter:blur(80px);opacity:.3;position:absolute;inset:-200px;z-index:-1}`}</style>
        <div className="gradient-bg"></div>
        <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center"><a href="#" className="flex items-center space-x-2 text-2xl font-bold text-white"><Bot size={28} className="text-indigo-400" /><span>ContentGenPilot</span></a><nav className="hidden md:flex items-center space-x-8"><a href="#features" className="hover:text-indigo-400">Features</a><a href="#pricing" className="hover:text-indigo-400">Pricing</a></nav><div className="space-x-2"><button onClick={onLoginClick} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg">Login</button></div></div>
        </header>
        <main className="relative overflow-hidden">
            <section className="pt-32 pb-20 text-center"><div className="container mx-auto px-6">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white">Create Marketing Content <span className="text-indigo-400">10x Faster</span></h1>
                <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">Your AI-powered co-writer for generating high-quality content in seconds.</p>
                <div className="mt-12 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-white">Stop Fighting with Prompts.</h2>
                    <h2 className="text-2xl font-bold text-indigo-400 mt-1">Create Perfect Content in Seconds.</h2>
                    <p className="mt-4 text-gray-400">You don't need to be a prompt engineer to create brilliant, SEO-optimized content. ContentGenPilot is your dedicated AI writing assistant that transforms your ideas into polished articles, social posts, and descriptions—effortlessly.</p>
                </div>
                <div className="mt-12"><button onClick={() => onSignupClick('free')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg">Get Started for Free</button></div>
            </div></section>
            <section id="features" className="py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white">Go Beyond the Blank Chat Box</h2>
                        <p className="mt-2 text-gray-400">Free AI tools give you a starting point. ContentGenPilot gives you a finished product.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700"><Zap size={48} className="text-indigo-400 mb-4" /><h3 className="text-xl font-bold">Guided Workflow</h3><p className="mt-2 text-gray-400">Forget complex prompts. Select a content type, choose a tone, add keywords, and let our system do the expert-level work. Go from idea to draft in under 30 seconds.</p></div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700"><Gem size={48} className="text-indigo-400 mb-4" /><h3 className="text-xl font-bold">Consistent Quality</h3><p className="mt-2 text-gray-400">Our pre-built templates ensure your content is always well-structured, engaging, and perfectly aligned with your brand voice, every single time.</p></div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700"><Target size={48} className="text-indigo-400 mb-4" /><h3 className="text-xl font-bold">Built-in SEO Tools</h3><p className="mt-2 text-gray-400">Seamlessly integrate your target keywords to create content that's not just well-written, but also optimized to rank on search engines and attract organic traffic.</p></div>
                    </div>
                </div>
            </section>
            <section id="pricing" className="py-20"><div className="container mx-auto px-6"><div className="text-center mb-12"><h2 className="text-4xl font-bold text-white">Find Your Plan</h2></div><div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="bg-gray-800 p-8 rounded-2xl border"><h3 className="text-2xl font-bold">Free</h3><p className="mt-2 text-gray-400 h-20">Perfect for trying out the basics and generating your first pieces of content.</p><p className="mt-6 text-5xl font-bold">$0<span className="text-lg text-gray-400">/one-time</span></p><button onClick={() => onSignupClick('free')} className="w-full mt-8 bg-gray-700 py-3 rounded-lg">Get Started</button><ul className="mt-6 space-y-3"><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />10 generations total</li><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Basic content types</li><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Standard support</li></ul></div>
                <div className="bg-indigo-600 p-10 rounded-3xl relative text-white"><div className="absolute top-0 right-8 bg-white text-indigo-600 font-bold text-sm py-1 px-3 rounded-b-lg">POPULAR</div><h3 className="text-3xl font-bold">Pro</h3><p className="mt-2 text-indigo-200 h-20">For professionals, freelancers, and small businesses who need to create content regularly.</p><p className="mt-6 text-5xl font-bold">$29<span className="text-lg text-indigo-200">/mo</span></p><button onClick={() => onSignupClick('pro')} className="w-full mt-8 bg-white text-indigo-600 font-bold py-3 rounded-lg">Upgrade to Pro</button><ul className="mt-6 space-y-3"><li className="flex items-center"><Check className="w-5 h-5 mr-2" />Unlimited generations</li><li className="flex items-center"><Check className="w-5 h-5 mr-2" />All content types & tones</li><li className="flex items-center"><Check className="w-5 h-5 mr-2" />AI Chat Assistant</li><li className="flex items-center"><Check className="w-5 h-5 mr-2" />Priority email support</li></ul></div>
                <div className="bg-gray-800 p-8 rounded-2xl border"><h3 className="text-2xl font-bold">Business</h3><p className="mt-2 text-gray-400 h-20">For agencies and larger teams that require collaboration and advanced features.</p><p className="mt-6 text-5xl font-bold">$99<span className="text-lg text-gray-400">/mo</span></p><button onClick={() => showNotification('Please contact our sales team to get started.', 'info')} className="w-full mt-8 bg-gray-700 py-3 rounded-lg">Contact Sales</button><ul className="mt-6 space-y-3"><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Everything in Pro</li><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Team collaboration tools</li><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />API Access</li><li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-2" />Dedicated account manager</li></ul></div>
            </div></div></section>
            <section id="testimonials" className="py-20 bg-gray-900/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white">Loved by Creators Worldwide</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><p className="text-gray-300">"ContentGenPilot has been a game-changer for our marketing team. We've cut our content production time in half!"</p><div className="mt-4 flex items-center"><img src="https://placehold.co/40x40/6366f1/ffffff?text=SJ" className="w-10 h-10 rounded-full" alt="User avatar"/><div className="ml-3"><p className="font-semibold text-white">Sarah Jones</p><p className="text-sm text-gray-400">Marketing Manager</p></div></div></div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><p className="text-gray-300">"As a freelancer, I juggle multiple clients. This tool is my secret weapon for delivering great content, fast."</p><div className="mt-4 flex items-center"><img src="https://placehold.co/40x40/ec4899/ffffff?text=MD" className="w-10 h-10 rounded-full" alt="User avatar"/><div className="ml-3"><p className="font-semibold text-white">Mike Davis</p><p className="text-sm text-gray-400">Freelance Writer</p></div></div></div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><p className="text-gray-300">"The quality of the AI-generated content is astounding. It requires minimal edits and perfectly captures our brand voice."</p><div className="mt-4 flex items-center"><img src="https://placehold.co/40x40/22c55e/ffffff?text=CL" className="w-10 h-10 rounded-full" alt="User avatar"/><div className="ml-3"><p className="font-semibold text-white">Chloe Lee</p><p className="text-sm text-gray-400">SaaS Founder</p></div></div></div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><p className="text-gray-300">"Product descriptions used to be my most dreaded task. ContentGenPilot writes them better than I ever could."</p><div className="mt-4 flex items-center"><img src="https://placehold.co/40x40/f59e0b/ffffff?text=AM" className="w-10 h-10 rounded-full" alt="User avatar"/><div className="ml-3"><p className="font-semibold text-white">Alex Martinez</p><p className="text-sm text-gray-400">E-commerce Owner</p></div></div></div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><p className="text-gray-300">"I can now manage twice the number of clients. It's brilliant for brainstorming different angles for social media captions."</p><div className="mt-4 flex items-center"><img src="https://placehold.co/40x40/8b5cf6/ffffff?text=JC" className="w-10 h-10 rounded-full" alt="User avatar"/><div className="ml-3"><p className="font-semibold text-white">Jessica Chen</p><p className="text-sm text-gray-400">Social Media Strategist</p></div></div></div>
                </div>
            </div>
            </section>
        </main>
        <footer className="bg-gray-900 py-12"><div className="container mx-auto px-6 text-center text-gray-400"><p>&copy; 2025 ContentGenPilot. All rights reserved.</p></div></footer>
    </div>
);

// --- Checkout Page Component ---
const CheckoutPage = ({ plan, onPaymentSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const planDetails = {
        pro: { name: 'Pro Plan', price: '$29/month' },
        business: { name: 'Business Plan', price: '$99/month' },
    };

    const handlePayment = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => { onPaymentSuccess(); }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
             <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2">Complete Your Purchase</h2>
                <p className="text-center text-indigo-400 mb-6">{planDetails[plan].name} - {planDetails[plan].price}</p>
                <form onSubmit={handlePayment}>
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Card Number</label><input type="text" placeholder="**** **** **** 1234" className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600"/></div>
                        <div className="flex space-x-4"><div className="w-1/2"><label className="text-sm font-medium">Expiry Date</label><input type="text" placeholder="MM / YY" className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600"/></div><div className="w-1/2"><label className="text-sm font-medium">CVC</label><input type="text" placeholder="123" className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600"/></div></div>
                        <div><label className="text-sm font-medium">Name on Card</label><input type="text" placeholder="John Doe" className="w-full p-3 mt-1 bg-gray-700 rounded-lg border border-gray-600"/></div>
                    </div>
                    <button type="submit" disabled={isProcessing} className="w-full mt-8 py-3 flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg disabled:bg-indigo-400">{isProcessing ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Processing...</> : 'Pay Now'}</button>
                    <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center"><Lock size={12} className="mr-1"/> Payments are secure and encrypted. This is a simulation.</p>
                </form>
            </div>
        </div>
    );
};

// --- Main App Sub-Components ---
const InputForm = ({ contentType, setContentType, topic, setTopic, audience, setAudience, keywords, setKeywords, tone, setTone, handleGenerate, isLoading, userId }) => (
    <form onSubmit={handleGenerate} className="p-8 bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setContentType('blog')} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${contentType === 'blog' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}><Book size={18} /><span className="text-sm mt-1.5">Blog Post</span></button><button type="button" onClick={() => setContentType('social')} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${contentType === 'social' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}><Twitter size={18} /><span className="text-sm mt-1.5">Social</span></button><button type="button" onClick={() => setContentType('product')} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${contentType === 'product' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}><Linkedin size={18} /><span className="text-sm mt-1.5">Product</span></button></div></div>
            <div><label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">Tone</label><div className="relative"><select id="tone" value={tone} onChange={e => setTone(e.target.value)} className="w-full p-3 border-gray-300 rounded-md border-2 appearance-none pr-8"><option>Professional</option><option>Witty</option><option>Friendly</option><option>Bold</option></select><ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div></div>
            <div className="md:col-span-2"><label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topic</label><input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 border-gray-300 rounded-md border-2 mt-1"/></div>
            <div><label htmlFor="audience" className="block text-sm font-medium text-gray-700">Audience</label><input type="text" id="audience" value={audience} onChange={e => setAudience(e.target.value)} className="w-full p-2 border-gray-300 rounded-md border-2 mt-1"/></div>
            <div><label htmlFor="keywords" className="block text-sm font-medium text-gray-700">Keywords</label><input type="text" id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full p-2 border-gray-300 rounded-md border-2 mt-1"/></div>
        </div>
        <div className="mt-6"><button type="submit" disabled={isLoading || !topic || !userId} className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md shadow-sm disabled:bg-indigo-300 flex justify-center items-center">{isLoading ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Generating...</> : 'Generate Content'}</button></div>
    </form>
);
const OutputDisplay = ({ isLoading, generatedContent, isEditing, setIsEditing, setGeneratedContent, handleCopy, handleSave }) => {
    const wordCount = useMemo(() => generatedContent.split(/\s+/).filter(Boolean).length, [generatedContent]);
    const editorRef = useRef(null);

    const applyMarkdown = (syntax) => {
        const editor = editorRef.current;
        if (!editor) return;
        const { selectionStart, selectionEnd, value } = editor;
        const selectedText = value.substring(selectionStart, selectionEnd);
        let newText;
        if (syntax === 'h2') {
             newText = `${value.substring(0, selectionStart)}## ${selectedText}${value.substring(selectionEnd)}`;
        } else {
             const markdownChar = syntax === 'bold' ? '**' : '*';
             newText = `${value.substring(0, selectionStart)}${markdownChar}${selectedText}${markdownChar}${value.substring(selectionEnd)}`;
        }
        setGeneratedContent(newText);
    };

    if (isLoading) return <div className="p-8 bg-white rounded-xl shadow-sm border flex items-center justify-center"><div className="flex flex-col items-center"><Bot size={48} className="text-indigo-500 animate-pulse" /><p className="mt-2 text-gray-500">AI is thinking...</p></div></div>;
    if (!generatedContent) return <div className="p-8 bg-white rounded-xl shadow-sm border flex flex-col items-center justify-center text-center"><Pencil size={48} className="text-gray-300" /><h3 className="mt-4 text-lg font-medium">Your content will appear here</h3></div>;
    return (
        <div className="bg-white rounded-xl shadow-sm border h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center"><div className="flex items-center space-x-2"><button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-md ${isEditing ? 'bg-indigo-100 text-indigo-600' : ''}`}><Edit size={16}/></button><button onClick={handleCopy} className="p-2 rounded-md hover:bg-gray-100"><Clipboard size={16}/></button><button onClick={handleSave} className="p-2 rounded-md hover:bg-gray-100"><Star size={16}/></button></div></div>
            {isEditing ? (
                <div className="flex-grow flex flex-col">
                    <div className="p-2 bg-gray-50 border-b flex items-center space-x-2">
                        <button onClick={() => applyMarkdown('bold')} className="p-2 rounded hover:bg-gray-200"><Bold size={16} /></button>
                        <button onClick={() => applyMarkdown('italic')} className="p-2 rounded hover:bg-gray-200"><Italic size={16} /></button>
                        <button onClick={() => applyMarkdown('h2')} className="p-2 rounded hover:bg-gray-200"><Heading2 size={16} /></button>
                    </div>
                    <textarea ref={editorRef} value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} className="w-full h-full p-6 flex-grow resize-none border-0 focus:ring-0"/>
                </div>
            ) : (<div className="p-6 flex-grow overflow-y-auto prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.replace(/## (.*)/g, '<h2>$1</h2>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br />') }} />)}
            <div className="p-4 border-t flex justify-between items-center text-sm"><span>Word Count: {wordCount}</span></div>
        </div>
    );
};
const HistoryPanel = ({ history, setGeneratedContent }) => { /* ... (Same as before) ... */ };
const SavedContentDisplay = ({ savedContent, handleDelete, setGeneratedContent, setTopic, setActiveTab }) => { /* ... (Same as before) ... */ };
const SettingsDisplay = ({ userId, savedContent, db, showNotification }) => { /* ... (Same as before) ... */ };


// --- Main Application Component (when user is logged in) ---
const MainApp = ({ userId, db, handleLogout, showNotification }) => {
    const [contentType, setContentType] = useState('blog');
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('professional');
    const [generatedContent, setGeneratedContent] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('new');
    const [savedContent, setSavedContent] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!db || !userId) return;
        const q = query(collection(db, 'artifacts', appId, 'users', userId, 'savedContent'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSavedContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => showNotification('Could not fetch saved content.', 'error'));
        return () => unsubscribe();
    }, [db, userId, showNotification]);

    const handleGenerate = async (e) => { e.preventDefault(); /* ... */ };
    const handleSave = async () => { /* ... */ };
    const handleDelete = async (id) => { /* ... */ };
    const handleCopy = () => { /* ... */ };

    const MainContent = () => {
        switch (activeTab) {
            case 'saved': return <SavedContentDisplay savedContent={savedContent} handleDelete={handleDelete} setGeneratedContent={setGeneratedContent} setTopic={setTopic} setActiveTab={setActiveTab}/>;
            case 'settings': return <SettingsDisplay userId={userId} savedContent={savedContent} db={db} showNotification={showNotification} />;
            default: return (
                 <div className="flex-grow p-4 md:p-8 flex flex-col space-y-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow h-full">
                        <InputForm {...{ contentType, setContentType, topic, setTopic, audience, setAudience, keywords, setKeywords, tone, setTone, handleGenerate, isLoading, userId }} />
                        <OutputDisplay {...{ isLoading, generatedContent, isEditing, setIsEditing, setGeneratedContent, handleCopy, handleSave }} />
                    </div>
                 </div>
            );
        }
    }

    return (
        <div className="relative flex h-screen bg-gray-100 font-sans">
             <style>{`.prose h2{margin-top:1em;font-size:1.5em}.prose strong{font-weight:700}.prose em{font-style:italic}.line-clamp-4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}`}</style>
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <aside className="p-6 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center mb-10"><Bot size={32} className="text-indigo-400" /><h1 className="text-2xl font-bold ml-2">ContentGenPilot</h1></div>
                        <nav className="flex flex-col space-y-2">
                            <button onClick={() => { setActiveTab('new'); setIsSidebarOpen(false);}} className={`flex items-center py-3 px-4 rounded-lg ${activeTab === 'new' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}><Pencil size={20} className="mr-3"/> New Content</button>
                            <button onClick={() => { setActiveTab('saved'); setIsSidebarOpen(false);}} className={`flex items-center py-3 px-4 rounded-lg ${activeTab === 'saved' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}><Star size={20} className="mr-3"/> Saved</button>
                            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false);}} className={`flex items-center py-3 px-4 rounded-lg ${activeTab === 'settings' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}><Settings size={20} className="mr-3"/> Settings</button>
                        </nav>
                    </div>
                    <div>
                        <div className="p-3 rounded-lg bg-gray-800 mb-2"><div className="flex items-center text-gray-300"><User size={20} className="mr-3" /><span className="text-sm font-medium">User ID</span></div><span className="text-xs text-indigo-400 break-all">{userId}</span></div>
                        <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-800"><LogOut size={20} className="mr-3" /><span>Logout</span></button>
                    </div>
                </aside>
            </div>
            <div className="flex-1 flex flex-col">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-4 fixed top-4 right-4 bg-gray-800 text-white rounded-full z-40">
                    <Menu size={24} />
                 </button>
                <main className="flex-grow flex">
                    <MainContent />
                    {activeTab === 'new' && <div className="hidden xl:block"><HistoryPanel history={history} setGeneratedContent={setGeneratedContent} /></div>}
                </main>
            </div>
        </div>
    );
};

// --- Root Component (Controller) ---
export default function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState({ mode: null, plan: null });
    const [notification, setNotification] = useState(null);
    const [appState, setAppState] = useState('landing'); // 'landing', 'checkout', 'app'
    const [selectedPlan, setSelectedPlan] = useState('free');

    const showNotification = useCallback((message, type = 'success') => { setNotification({ message, type }); }, []);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance); setDb(dbInstance);
            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                setUser(user);
                setIsAuthLoading(false);
                if (user && appState !== 'checkout') { setAppState('app'); } 
                else if (!user) { setAppState('landing'); }
            });
            return () => unsubscribe();
        } catch (error) { setIsAuthLoading(false); showNotification("Could not connect to services.", "error"); }
    }, [showNotification, appState]);

    const handleAuthAction = async (action, email, password, plan) => {
        if (!auth) return { error: { code: 'auth/no-auth' } };
        try {
            if (action === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
                if (plan === 'pro' || plan === 'business') { setAppState('checkout'); }
            } else { await signInWithEmailAndPassword(auth, email, password); }
            setShowAuthModal({ mode: null, plan: null });
            return { success: true };
        } catch (error) { return { error: error }; }
    };
    
    const handleLogout = async () => { if (auth) { await signOut(auth); setAppState('landing'); showNotification("You have been logged out.", "success"); }};
    const handlePaymentSuccess = () => { showNotification("Payment successful! Welcome to Pro.", "success"); setAppState('app'); };

    if (isAuthLoading) return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white text-xl"><div className="flex items-center space-x-3"><Bot size={32} className="animate-pulse"/><span>Loading ContentGenPilot...</span></div></div>;
    
    const renderContent = () => {
        switch(appState) {
            case 'checkout': return <CheckoutPage plan={selectedPlan} onPaymentSuccess={handlePaymentSuccess} />;
            case 'app': if (user) return <MainApp userId={user.uid} db={db} handleLogout={handleLogout} showNotification={showNotification} />; setAppState('landing'); return null;
            case 'landing':
            default: return <LandingPage onLoginClick={() => setShowAuthModal({ mode: 'login', plan: null })} onSignupClick={(plan) => {setSelectedPlan(plan); setShowAuthModal({ mode: 'signup', plan: plan });}} showNotification={showNotification} />;
        }
    };
    
    return (
        <>
            <NotificationComponent notification={notification} setNotification={setNotification} />
            {renderContent()}
            {showAuthModal.mode && <AuthModal mode={showAuthModal.mode} plan={showAuthModal.plan} setShowAuthModal={setShowAuthModal} handleAuthAction={handleAuthAction} />}
        </>
    );
}

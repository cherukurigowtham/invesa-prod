import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

const Navbar = () => {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = () => {
            setUser(JSON.parse(localStorage.getItem('user')));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await import('../api').then(module => module.default.post('/auth/logout'));
        } catch (err) {
            console.error("Logout log failed:", err);
        } finally {
            localStorage.removeItem('user');
            window.dispatchEvent(new Event("storage"));
            navigate('/login');
            setIsMenuOpen(false);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="bg-black border-b border-gray-800 fixed top-0 left-0 w-full z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2 cursor-default">
                    <img src="/logo.png" alt="Invesa Logo" className="h-8 w-auto" />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <>
                            <Link to="/post">
                                <Button className="bg-primary hover:bg-primary/90 text-black font-semibold px-4 py-2 rounded-full transition-all text-sm flex items-center gap-2">
                                    <span>+ Post Idea</span>
                                </Button>
                            </Link>
                            <Link to="/chat" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Chat
                            </Link>
                            <Link to="/profile" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                {user.username}
                            </Link>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </>
                    ) : (
                        <Link to="/login">
                            <Button variant="ghost" className="text-gray-300 hover:text-white">Login</Button>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    {user && (
                        <button onClick={toggleMenu} className="text-gray-300 hover:text-white p-2">
                            {isMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && user && (
                <div className="md:hidden bg-black border-b border-gray-800 absolute top-16 left-0 w-full flex flex-col p-4 gap-4 animate-in slide-in-from-top-5">
                    <Link to="/post" onClick={() => setIsMenuOpen(false)} className="w-full">
                        <Button className="w-full bg-primary text-black font-semibold justify-center">
                            + Post Idea
                        </Button>
                    </Link>
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white py-2 border-b border-gray-800">
                        Chat
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white py-2 border-b border-gray-800">
                        Profile ({user.username})
                    </Link>
                    <button onClick={handleLogout} className="text-left text-gray-400 hover:text-red-500 py-2 flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

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

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event("storage"));
        navigate('/login');
    };

    return (
        <nav className="bg-black border-b border-gray-800 fixed top-0 left-0 w-full z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="Invesa Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold text-white">Invesa</span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link to="/profile" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{user.username}</Link>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Navbar = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Removed unused imports if any were left, but useState/useEffect might still be imported unused.
    // Ideally clean those up too.

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.reload();
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

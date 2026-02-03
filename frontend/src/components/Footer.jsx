const Footer = () => {
    return (
        <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 py-4 text-center text-gray-400 text-sm z-50">
            <div className="container mx-auto px-4">
                <p>&copy; {new Date().getFullYear()} Invesa. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;

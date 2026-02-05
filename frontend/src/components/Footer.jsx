const Footer = () => {
    return (
        <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 py-4 text-center text-gray-400 text-sm z-50">
            <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-center md:flex-row">
                <p>&copy; {new Date().getFullYear()} Invesa. All rights reserved.</p>

            </div>
        </footer>
    );
};

export default Footer;

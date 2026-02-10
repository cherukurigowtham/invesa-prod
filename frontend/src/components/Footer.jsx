const Footer = () => {
    return (
        <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 py-4 text-center text-gray-400 text-sm z-50">
            <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-center md:flex-row">
                <p>&copy; {new Date().getFullYear()} Invesa. All rights reserved.</p>
                <div className="flex items-center gap-4">
                    <a href="mailto:invesa.service@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                        Contact: invesa.service@gmail.com
                    </a>
                </div>

            </div>
        </footer>
    );
};

export default Footer;

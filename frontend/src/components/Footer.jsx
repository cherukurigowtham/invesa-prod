const Footer = () => {
    return (
        <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 py-4 text-center text-gray-400 text-sm z-50">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-6 text-center md:text-left">
                <p className="text-gray-500 text-xs">
                    &copy; {new Date().getFullYear()} Invesa. All rights reserved.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-sm text-gray-400">
                    <span>For queries or help, please contact:</span>
                    <a
                        href="mailto:invesa.service@gmail.com"
                        className="text-white hover:text-yellow-500 transition-colors font-medium hover:underline"
                    >
                        invesa.service@gmail.com
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#2463eb",
                "background-light": "#f6f6f8",
                "background-dark": "#111621",
            },
            fontFamily: {
                sans: ["Lexend_400Regular"],
                bold: ["Lexend_700Bold"],
            },
        },
    },
    plugins: [],
};

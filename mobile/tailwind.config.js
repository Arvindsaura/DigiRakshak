/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0066FF",
                danger: "#FF3B30",
                warning: "#FFCC00",
                background: "#0A0A0F",
                safe: "#30D158",
            },
        },
    },
    plugins: [],
};

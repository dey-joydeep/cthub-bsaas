/** @type {import('tailwindcss').Config} */
export default {
    // The 'content' property is essential for Tailwind's Just-in-Time (JIT) engine.
    // It tells Tailwind which files to scan for class names, ensuring that only
    // the necessary CSS is generated. This was not in the original guide's snippet
    // but is required for a functional Tailwind setup.
    content: ['./apps/web/**/*.{html,ts}', './libs/web/**/*.{html,ts}'],
    prefix: 'twc-', // Use a custom prefix for all Tailwind classes
    theme: {
        extend: {
            // Custom theme extensions can be added here.
        },
    },
    plugins: [],
};

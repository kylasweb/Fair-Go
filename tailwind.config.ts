import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				// Neomorphism colors
				'neo': {
					'light': '#f0f0f3',
					'dark': '#0f0f0f', // Pure black base
					'shadow-light': '#d1d9e6',
					'shadow-dark': '#000000', // Pure black shadows
					'highlight-light': '#ffffff',
					'highlight-dark': '#1a1a1a', // Very dark grey highlights
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'neo': '1rem',
				'neo-sm': '0.5rem',
				'neo-lg': '1.5rem',
				'neo-xl': '2rem'
			},
			boxShadow: {
				// Light mode neomorphism
				'neo-inset': 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
				'neo-outset': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
				'neo-pressed': 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
				'neo-raised': '3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff',
				'neo-flat': '2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff',

				// Dark mode neomorphism (true black neomorphism style)
				'neo-dark-inset': 'inset 8px 8px 16px #000000, inset -8px -8px 16px #1a1a1a',
				'neo-dark-outset': '8px 8px 16px #000000, -8px -8px 16px #1a1a1a',
				'neo-dark-pressed': 'inset 4px 4px 8px #000000, inset -4px -4px 8px #1a1a1a',
				'neo-dark-raised': '4px 4px 8px #000000, -4px -4px 8px #1a1a1a',
				'neo-dark-flat': '3px 3px 6px #000000, -3px -3px 6px #1a1a1a',
			},
			animation: {
				'theme-switch': 'theme-switch 0.3s ease-in-out',
				'neo-press': 'neo-press 0.1s ease-in-out',
			},
			keyframes: {
				'theme-switch': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)' }
				},
				'neo-press': {
					'0%': { transform: 'translateY(0px)' },
					'100%': { transform: 'translateY(1px)' }
				}
			}
		}
	},
	plugins: [tailwindcssAnimate],
};

export default config;

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        agent: {
          DEFAULT: "hsl(var(--agent))",
          foreground: "hsl(var(--agent-foreground))",
          border: "hsl(var(--agent-border))",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'hsl(var(--foreground))',
            p: {
              color: 'hsl(var(--foreground))',
              marginTop: '1rem',
              marginBottom: '1rem',
              lineHeight: '1.75',
            },
            h1: {
              color: 'hsl(var(--foreground))',
              fontWeight: '700',
              fontSize: '1.875rem',
              marginBottom: '1rem',
              lineHeight: '1.3',
            },
            h2: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.5rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.4',
            },
            h3: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
              lineHeight: '1.5',
            },
            li: {
              color: 'hsl(var(--foreground))',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'ul > li': {
              position: 'relative',
              paddingLeft: '1.5rem',
              '&::before': {
                display: 'none', // Remove the default bullet
              },
            },
            strong: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            blockquote: {
              color: 'hsl(var(--muted-foreground))',
              borderLeftColor: 'hsl(var(--border))',
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: 'hsl(var(--border))',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            pre: {
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
            },
            code: {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
            },
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
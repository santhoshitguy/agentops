/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts,scss}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ==========================================
            // COLOR PALETTE - AgentOps Lite Theme
            // ==========================================
            colors: {
                // Background Layers (darkest to lightest)
                'bg': {
                    'void': '#000000',
                    'space': '#020408',
                    'deep': '#040810',
                    'primary': '#060c16',
                    'secondary': '#081018',
                    'tertiary': '#0a141e',
                    'elevated': '#0c1824',
                    'surface': '#0e1c2a',
                    'overlay': '#101f30',
                    'card': '#0a1420',
                    'panel': '#081014',
                },

                // Glass/Transparency
                'glass': {
                    'bg': 'rgba(8, 16, 28, 0.9)',
                    'light': 'rgba(14, 24, 38, 0.75)',
                    'border': 'rgba(255, 255, 255, 0.06)',
                    'border-light': 'rgba(255, 255, 255, 0.1)',
                    'border-active': 'rgba(255, 255, 255, 0.15)',
                },

                // Accent Colors - Neon Spectrum
                'cyan': {
                    DEFAULT: '#00e5ff',
                    dim: '#00b8d4',
                    bright: '#4df3ff',
                    glow: 'rgba(0, 229, 255, 0.5)',
                    subtle: 'rgba(0, 229, 255, 0.12)',
                    ring: 'rgba(0, 229, 255, 0.3)',
                },
                'neon-green': {
                    DEFAULT: '#00e676',
                    dim: '#00c853',
                    bright: '#69f0ae',
                    glow: 'rgba(0, 230, 118, 0.5)',
                    subtle: 'rgba(0, 230, 118, 0.12)',
                    ring: 'rgba(0, 230, 118, 0.3)',
                },
                'neon-purple': {
                    DEFAULT: '#b388ff',
                    dim: '#7c4dff',
                    bright: '#d4b8ff',
                    glow: 'rgba(179, 136, 255, 0.5)',
                    subtle: 'rgba(179, 136, 255, 0.12)',
                    ring: 'rgba(179, 136, 255, 0.3)',
                },
                'neon-pink': {
                    DEFAULT: '#ff4081',
                    dim: '#f50057',
                    bright: '#ff80ab',
                    glow: 'rgba(255, 64, 129, 0.5)',
                    subtle: 'rgba(255, 64, 129, 0.12)',
                    ring: 'rgba(255, 64, 129, 0.3)',
                },
                'neon-orange': {
                    DEFAULT: '#ff9100',
                    dim: '#ff6d00',
                    bright: '#ffab40',
                    glow: 'rgba(255, 145, 0, 0.5)',
                    subtle: 'rgba(255, 145, 0, 0.12)',
                    ring: 'rgba(255, 145, 0, 0.3)',
                },
                'neon-lightblue': {
                    DEFAULT: '#40c4ff',
                    dim: '#00b0ff',
                    bright: '#80d8ff',
                    glow: 'rgba(64, 196, 255, 0.5)',
                    subtle: 'rgba(64, 196, 255, 0.12)',
                    ring: 'rgba(64, 196, 255, 0.3)',
                },
                'neon-red': {
                    DEFAULT: '#ff5252',
                    dim: '#ff1744',
                    bright: '#ff8a80',
                    glow: 'rgba(255, 82, 82, 0.5)',
                    subtle: 'rgba(255, 82, 82, 0.12)',
                },
                'neon-yellow': {
                    DEFAULT: '#ffea00',
                    dim: '#ffd600',
                    bright: '#ffff00',
                    glow: 'rgba(255, 234, 0, 0.5)',
                    subtle: 'rgba(255, 234, 0, 0.12)',
                },

                // Terminal Colors
                'terminal': {
                    'bg': '#050a0f',
                    'header': '#0a1018',
                    'text': '#c5d1de',
                    'timestamp': '#546e7a',
                    'function': '#82aaff',
                    'string': '#c3e88d',
                    'number': '#f78c6c',
                    'keyword': '#c792ea',
                    'comment': '#546e7a',
                },

                // Node Type Colors
                'node': {
                    'orchestrator': '#00e5ff',
                    'goal': '#00e676',
                    'uclam': '#b388ff',
                    'researcher': '#ff4081',
                    'scorer': '#ff9100',
                    'writer': '#40c4ff',
                    'coder': '#00e676',
                    'reviewer': '#ffea00',
                },
            },

            // ==========================================
            // TYPOGRAPHY
            // ==========================================
            fontFamily: {
                'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'display': ['Rajdhani', 'Inter', 'sans-serif'],
                'mono': ['Fira Code', 'JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
            },

            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px
                'xs': ['0.6875rem', { lineHeight: '1rem' }],       // 11px
                'sm': ['0.8125rem', { lineHeight: '1.25rem' }],    // 13px
                'base': ['0.875rem', { lineHeight: '1.375rem' }],  // 14px
                'lg': ['1rem', { lineHeight: '1.5rem' }],          // 16px
                'xl': ['1.125rem', { lineHeight: '1.75rem' }],     // 18px
                '2xl': ['1.375rem', { lineHeight: '1.875rem' }],   // 22px
                '3xl': ['1.75rem', { lineHeight: '2.25rem' }],     // 28px
                '4xl': ['2.25rem', { lineHeight: '2.75rem' }],     // 36px
                '5xl': ['3rem', { lineHeight: '3.5rem' }],         // 48px
            },

            // ==========================================
            // SPACING & SIZING
            // ==========================================
            spacing: {
                '0.5': '0.125rem',   // 2px
                '1.5': '0.375rem',   // 6px
                '2.5': '0.625rem',   // 10px
                '3.5': '0.875rem',   // 14px
                '4.5': '1.125rem',   // 18px
                '13': '3.25rem',     // 52px
                '15': '3.75rem',     // 60px
                '18': '4.5rem',      // 72px
                '22': '5.5rem',      // 88px
                '26': '6.5rem',      // 104px
                '30': '7.5rem',      // 120px
                // Layout specific
                'sidebar': '220px',
                'sidebar-collapsed': '56px',
                'header': '44px',
                'bottom-bar': '48px',
                'left-panel': '220px',
                'right-panel': '340px',
            },

            // ==========================================
            // BORDER RADIUS
            // ==========================================
            borderRadius: {
                'sm': '0.1875rem',   // 3px
                'md': '0.375rem',    // 6px
                'lg': '0.5rem',      // 8px
                'xl': '0.75rem',     // 12px
                '2xl': '1rem',       // 16px
                '3xl': '1.5rem',     // 24px
            },

            // ==========================================
            // BOX SHADOWS & GLOWS
            // ==========================================
            boxShadow: {
                'sm': '0 1px 3px rgba(0, 0, 0, 0.5)',
                'md': '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                'lg': '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.4)',
                'xl': '0 24px 48px rgba(0, 0, 0, 0.6)',
                // Glow shadows
                'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.25)',
                'glow-cyan-intense': '0 0 30px rgba(0, 229, 255, 0.5), 0 0 60px rgba(0, 229, 255, 0.35), 0 0 100px rgba(0, 229, 255, 0.2)',
                'glow-green': '0 0 20px rgba(0, 230, 118, 0.5), 0 0 40px rgba(0, 230, 118, 0.25)',
                'glow-green-intense': '0 0 30px rgba(0, 230, 118, 0.5), 0 0 60px rgba(0, 230, 118, 0.35)',
                'glow-purple': '0 0 20px rgba(179, 136, 255, 0.5), 0 0 40px rgba(179, 136, 255, 0.25)',
                'glow-purple-intense': '0 0 30px rgba(179, 136, 255, 0.5), 0 0 60px rgba(179, 136, 255, 0.35)',
                'glow-pink': '0 0 20px rgba(255, 64, 129, 0.5), 0 0 40px rgba(255, 64, 129, 0.25)',
                'glow-pink-intense': '0 0 30px rgba(255, 64, 129, 0.5), 0 0 60px rgba(255, 64, 129, 0.35)',
                'glow-orange': '0 0 20px rgba(255, 145, 0, 0.5), 0 0 40px rgba(255, 145, 0, 0.25)',
                'glow-orange-intense': '0 0 30px rgba(255, 145, 0, 0.5), 0 0 60px rgba(255, 145, 0, 0.35)',
                'glow-red': '0 0 20px rgba(255, 82, 82, 0.5), 0 0 40px rgba(255, 82, 82, 0.25)',
            },

            // ==========================================
            // BACKDROP BLUR
            // ==========================================
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },

            // ==========================================
            // TRANSITIONS
            // ==========================================
            transitionDuration: {
                '50': '50ms',
                '150': '150ms',
                '200': '200ms',
                '250': '250ms',
                '300': '300ms',
                '400': '400ms',
                '500': '500ms',
            },

            transitionTimingFunction: {
                'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // ==========================================
            // Z-INDEX
            // ==========================================
            zIndex: {
                'deep': '-1',
                'base': '0',
                'raised': '10',
                'dropdown': '100',
                'sticky': '200',
                'overlay': '300',
                'modal': '400',
                'popover': '500',
                'toast': '600',
                'tooltip': '700',
                'max': '9999',
            },

            // ==========================================
            // ANIMATIONS
            // ==========================================
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
                'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'typing': 'typing 1.5s steps(3) infinite',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-in-right': 'slideInRight 0.3s ease-out forwards',
                'slide-in-up': 'slideInUp 0.3s ease-out forwards',
                'scale-in': 'scaleIn 0.2s ease-out forwards',
            },

            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'typing': {
                    '0%, 60%, 100%': { opacity: '1' },
                    '30%': { opacity: '0' },
                },
                'fadeIn': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slideInRight': {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'slideInUp': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'scaleIn': {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },

            // ==========================================
            // BACKGROUND IMAGES
            // ==========================================
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #00e5ff 0%, #b388ff 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #b388ff 0%, #ff4081 100%)',
                'gradient-success': 'linear-gradient(135deg, #00e676 0%, #00e5ff 100%)',
                'gradient-warning': 'linear-gradient(135deg, #ff9100 0%, #ffea00 100%)',
                'gradient-danger': 'linear-gradient(135deg, #ff5252 0%, #ff4081 100%)',
                'gradient-mesh': `
          radial-gradient(ellipse at 20% 20%, rgba(0, 229, 255, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(179, 136, 255, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(0, 230, 118, 0.02) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 80%, rgba(255, 64, 129, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(64, 196, 255, 0.03) 0%, transparent 50%)
        `,
                'gradient-radial-cyan': 'radial-gradient(circle, rgba(0, 229, 255, 0.5) 0%, transparent 70%)',
                'gradient-radial-purple': 'radial-gradient(circle, rgba(179, 136, 255, 0.5) 0%, transparent 70%)',
                'gradient-radial-green': 'radial-gradient(circle, rgba(0, 230, 118, 0.5) 0%, transparent 70%)',
            },
        },
    },
    plugins: [
        // Custom plugin for additional utilities
        function ({ addUtilities, addComponents, theme }) {
            // Glass morphism utilities
            addUtilities({
                '.glass': {
                    'background': 'rgba(8, 16, 28, 0.9)',
                    'backdrop-filter': 'blur(12px)',
                    '-webkit-backdrop-filter': 'blur(12px)',
                    'border': '1px solid rgba(255, 255, 255, 0.06)',
                },
                '.glass-light': {
                    'background': 'rgba(14, 24, 38, 0.75)',
                    'backdrop-filter': 'blur(16px)',
                    '-webkit-backdrop-filter': 'blur(16px)',
                    'border': '1px solid rgba(255, 255, 255, 0.1)',
                },
                '.glass-card': {
                    'background': 'rgba(8, 16, 28, 0.9)',
                    'backdrop-filter': 'blur(20px)',
                    '-webkit-backdrop-filter': 'blur(20px)',
                    'border': '1px solid rgba(255, 255, 255, 0.06)',
                    'border-radius': '0.75rem',
                },
            });

            // Text glow utilities
            addUtilities({
                '.text-glow-cyan': {
                    'text-shadow': '0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.3)',
                },
                '.text-glow-green': {
                    'text-shadow': '0 0 10px rgba(0, 230, 118, 0.5), 0 0 20px rgba(0, 230, 118, 0.3)',
                },
                '.text-glow-purple': {
                    'text-shadow': '0 0 10px rgba(179, 136, 255, 0.5), 0 0 20px rgba(179, 136, 255, 0.3)',
                },
                '.text-glow-pink': {
                    'text-shadow': '0 0 10px rgba(255, 64, 129, 0.5), 0 0 20px rgba(255, 64, 129, 0.3)',
                },
                '.text-glow-orange': {
                    'text-shadow': '0 0 10px rgba(255, 145, 0, 0.5), 0 0 20px rgba(255, 145, 0, 0.3)',
                },
            });

            // Gradient text utility
            addUtilities({
                '.text-gradient': {
                    'background': 'linear-gradient(135deg, #00e5ff 0%, #b388ff 100%)',
                    '-webkit-background-clip': 'text',
                    '-webkit-text-fill-color': 'transparent',
                    'background-clip': 'text',
                },
                '.text-gradient-success': {
                    'background': 'linear-gradient(135deg, #00e676 0%, #00e5ff 100%)',
                    '-webkit-background-clip': 'text',
                    '-webkit-text-fill-color': 'transparent',
                    'background-clip': 'text',
                },
            });

            // Scrollbar utilities
            addUtilities({
                '.scrollbar-thin': {
                    'scrollbar-width': 'thin',
                    'scrollbar-color': '#101f30 #040810',
                    '&::-webkit-scrollbar': {
                        'width': '6px',
                        'height': '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        'background': '#040810',
                        'border-radius': '9999px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        'background': '#101f30',
                        'border-radius': '9999px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        'background': '#0e1c2a',
                    },
                },
                '.scrollbar-none': {
                    'scrollbar-width': 'none',
                    '&::-webkit-scrollbar': {
                        'display': 'none',
                    },
                },
            });

            // Status dot component
            addComponents({
                '.status-dot': {
                    'width': '8px',
                    'height': '8px',
                    'border-radius': '9999px',
                    'animation': 'pulse 2s ease-in-out infinite',
                },
                '.status-dot-active': {
                    'background': '#00e676',
                    'box-shadow': '0 0 8px rgba(0, 230, 118, 0.5)',
                },
                '.status-dot-warning': {
                    'background': '#ff9100',
                    'box-shadow': '0 0 8px rgba(255, 145, 0, 0.5)',
                },
                '.status-dot-error': {
                    'background': '#ff5252',
                    'box-shadow': '0 0 8px rgba(255, 82, 82, 0.5)',
                },
                '.status-dot-processing': {
                    'background': '#00e5ff',
                    'box-shadow': '0 0 8px rgba(0, 229, 255, 0.5)',
                },
            });

            // Badge components
            addComponents({
                '.badge': {
                    'display': 'inline-flex',
                    'align-items': 'center',
                    'gap': '0.25rem',
                    'padding': '0.125rem 0.5rem',
                    'font-size': '0.6875rem',
                    'font-weight': '500',
                    'border-radius': '9999px',
                },
                '.badge-cyan': {
                    'background': 'rgba(0, 229, 255, 0.12)',
                    'color': '#00e5ff',
                },
                '.badge-green': {
                    'background': 'rgba(0, 230, 118, 0.12)',
                    'color': '#00e676',
                },
                '.badge-purple': {
                    'background': 'rgba(179, 136, 255, 0.12)',
                    'color': '#b388ff',
                },
                '.badge-pink': {
                    'background': 'rgba(255, 64, 129, 0.12)',
                    'color': '#ff4081',
                },
                '.badge-orange': {
                    'background': 'rgba(255, 145, 0, 0.12)',
                    'color': '#ff9100',
                },
                '.badge-red': {
                    'background': 'rgba(255, 82, 82, 0.12)',
                    'color': '#ff5252',
                },
            });

            // Button components
            addComponents({
                '.btn': {
                    'display': 'inline-flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'gap': '0.5rem',
                    'padding': '0.5rem 1rem',
                    'font-size': '0.8125rem',
                    'font-weight': '500',
                    'border-radius': '0.5rem',
                    'transition': 'all 0.15s ease',
                    'cursor': 'pointer',
                },
                '.btn-primary': {
                    'background': 'linear-gradient(135deg, #00e5ff 0%, #b388ff 100%)',
                    'color': '#0a1420',
                    'border': 'none',
                    '&:hover': {
                        'box-shadow': '0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.25)',
                        'transform': 'translateY(-2px)',
                    },
                },
                '.btn-secondary': {
                    'background': '#0e1c2a',
                    'color': '#f0f4f8',
                    'border': '1px solid rgba(255, 255, 255, 0.08)',
                    '&:hover': {
                        'background': '#101f30',
                        'border-color': '#00e5ff',
                    },
                },
                '.btn-ghost': {
                    'background': 'transparent',
                    'color': '#78909c',
                    'border': '1px solid rgba(255, 255, 255, 0.06)',
                    '&:hover': {
                        'background': '#0e1c2a',
                        'color': '#b0bec5',
                    },
                },
                '.btn-icon': {
                    'width': '2rem',
                    'height': '2rem',
                    'padding': '0',
                    'background': 'transparent',
                    'color': '#78909c',
                    'border': 'none',
                    'border-radius': '0.375rem',
                    '&:hover': {
                        'background': '#0e1c2a',
                        'color': '#f0f4f8',
                    },
                },
            });

            // Card component
            addComponents({
                '.card': {
                    'background': 'rgba(8, 16, 28, 0.9)',
                    'backdrop-filter': 'blur(20px)',
                    '-webkit-backdrop-filter': 'blur(20px)',
                    'border': '1px solid rgba(255, 255, 255, 0.06)',
                    'border-radius': '0.75rem',
                    'padding': '1rem',
                },
                '.card-header': {
                    'display': 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'margin-bottom': '1rem',
                },
                '.card-title': {
                    'font-family': 'Rajdhani, Inter, sans-serif',
                    'font-size': '1rem',
                    'font-weight': '600',
                    'color': '#f0f4f8',
                },
            });

            // Input component
            addComponents({
                '.input': {
                    'width': '100%',
                    'padding': '0.5rem 0.75rem',
                    'background': '#040810',
                    'border': '1px solid rgba(255, 255, 255, 0.05)',
                    'border-radius': '0.375rem',
                    'font-size': '0.8125rem',
                    'color': '#f0f4f8',
                    'transition': 'all 0.15s ease',
                    '&::placeholder': {
                        'color': '#546e7a',
                    },
                    '&:focus': {
                        'outline': 'none',
                        'border-color': '#00e5ff',
                        'box-shadow': '0 0 0 2px rgba(0, 229, 255, 0.1)',
                    },
                },
            });
        },
    ],
};

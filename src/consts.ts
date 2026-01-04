export const INIT_DELAY = 0.3
export const ANIMATION_DELAY = 0.1
export const CARD_SPACING = 36
export const CARD_SPACING_SM = 24
export const BLOG_SLUG_KEY = import.meta.env.BLOG_SLUG_KEY || ''

/**
 * GitHub 仓库配置
 */
export const GITHUB_CONFIG = {
	OWNER: import.meta.env.PUBLIC_GITHUB_OWNER || 'kobaridev',
	REPO: import.meta.env.PUBLIC_GITHUB_REPO || 'RyuChan',
	BRANCH: import.meta.env.PUBLIC_GITHUB_BRANCH || 'main',
	APP_ID: import.meta.env.PUBLIC_GITHUB_APP_ID || '-',
	ENCRYPT_KEY: import.meta.env.PUBLIC_GITHUB_ENCRYPT_KEY || 'wudishiduomejimo',
} as const

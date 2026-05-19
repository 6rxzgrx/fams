import { z } from 'zod';

// Transform empty strings to undefined so .default() kicks in
const optStr = (fallback = '') =>
	z
		.string()
		.transform((v) => v || fallback)
		.pipe(z.string());

const envSchema = z.object({
	NEXTAUTH_SECRET: optStr('dev-secret-change-in-prod'),
	NEXTAUTH_URL: z.string().optional(),
	GOOGLE_CLIENT_ID: optStr(),
	GOOGLE_CLIENT_SECRET: optStr(),
	GOOGLE_SA_EMAIL: optStr(),
	GOOGLE_SA_PRIVATE_KEY: optStr(),
	GOOGLE_SHEETS_ID: optStr(),
	GOOGLE_CALENDAR_ID: optStr(),
	GEMINI_API_KEY: optStr(),
	TELEGRAM_BOT_TOKEN: optStr(),
	TELEGRAM_WEBHOOK_SECRET: optStr(),
	CRON_SECRET: optStr(),
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
});

function parseEnv() {
	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		console.error(
			'Invalid environment variables:',
			result.error.flatten().fieldErrors,
		);
		// Don't throw during build — fall back to empty defaults
		return {
			NEXTAUTH_SECRET: 'dev-secret-change-in-prod',
			NEXTAUTH_URL: undefined,
			GOOGLE_CLIENT_ID: '',
			GOOGLE_CLIENT_SECRET: '',
			GOOGLE_SA_EMAIL: '',
			GOOGLE_SA_PRIVATE_KEY: '',
			GOOGLE_SHEETS_ID: '',
			GOOGLE_CALENDAR_ID: '',
			GEMINI_API_KEY: '',
			TELEGRAM_BOT_TOKEN: '',
			TELEGRAM_WEBHOOK_SECRET: '',
			CRON_SECRET: '',
			NODE_ENV: 'development' as const,
		};
	}
	return result.data;
}

export const env = parseEnv();

export const isSheetsConfigured = () =>
	!!(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY && env.GOOGLE_SHEETS_ID);

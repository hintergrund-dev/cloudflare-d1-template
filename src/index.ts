/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// ── API routes ──────────────────────────────────────────────────────────
		if (url.pathname === '/api/notes') {
			if (request.method === 'GET') {
				const { results } = await env.DB.prepare(
					'SELECT * FROM notes ORDER BY created_at DESC'
				).all();
				return Response.json(results);
			}

			if (request.method === 'POST') {
				const { title, body = '' } = await request.json<{ title: string; body?: string }>();
				if (!title) return new Response('title is required', { status: 400 });

				const { meta } = await env.DB.prepare(
					'INSERT INTO notes (title, body) VALUES (?, ?)'
				)
					.bind(title, body)
					.run();

				return Response.json({ id: meta.last_row_id, title, body }, { status: 201 });
			}

			return new Response('Method Not Allowed', { status: 405 });
		}

		const noteMatch = url.pathname.match(/^\/api\/notes\/(\d+)$/);
		if (noteMatch) {
			const id = Number(noteMatch[1]);

			if (request.method === 'DELETE') {
				const { meta } = await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
				if (meta.changes === 0) return new Response('Not Found', { status: 404 });
				return new Response(null, { status: 204 });
			}

			return new Response('Method Not Allowed', { status: 405 });
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

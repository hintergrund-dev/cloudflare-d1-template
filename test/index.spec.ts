import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, afterEach } from 'vitest';

type Note = { id: number; title: string; body: string; created_at: string };

// Each test gets a clean notes table; migrations are applied once in test/setup.ts
afterEach(async () => {
	await env.DB.prepare('DELETE FROM notes').run();
});

describe('GET /api/notes', () => {
	it('returns an empty array when no notes exist', async () => {
		const res = await SELF.fetch('http://example.com/api/notes');
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});

	it('returns all notes ordered by created_at DESC', async () => {
		await env.DB.prepare("INSERT INTO notes (title, body) VALUES ('First', 'A')").run();
		await env.DB.prepare("INSERT INTO notes (title, body) VALUES ('Second', 'B')").run();

		const res = await SELF.fetch('http://example.com/api/notes');
		const notes = (await res.json()) as Note[];

		expect(notes).toHaveLength(2);
		expect(notes[0].title).toBe('Second');
		expect(notes[1].title).toBe('First');
	});

	it('includes all expected fields on each note', async () => {
		await env.DB.prepare("INSERT INTO notes (title, body) VALUES ('Hello', 'World')").run();

		const res = await SELF.fetch('http://example.com/api/notes');
		const [note] = (await res.json()) as Note[];

		expect(note).toMatchObject({ title: 'Hello', body: 'World' });
		expect(typeof note.id).toBe('number');
		expect(typeof note.created_at).toBe('string');
	});
});

describe('POST /api/notes', () => {
	it('creates a note with title and body, returns 201', async () => {
		const res = await SELF.fetch('http://example.com/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'My note', body: 'Some content' }),
		});

		expect(res.status).toBe(201);
		const note = (await res.json()) as Note;
		expect(note.title).toBe('My note');
		expect(note.body).toBe('Some content');
		expect(typeof note.id).toBe('number');
	});

	it('defaults body to empty string when omitted', async () => {
		const res = await SELF.fetch('http://example.com/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'No body' }),
		});

		expect(res.status).toBe(201);
		const note = (await res.json()) as Note;
		expect(note.body).toBe('');
	});

	it('persists the note in D1', async () => {
		await SELF.fetch('http://example.com/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Persisted', body: 'Check DB' }),
		});

		const { results } = await env.DB.prepare('SELECT * FROM notes').all<Note>();
		expect(results).toHaveLength(1);
		expect(results[0].title).toBe('Persisted');
	});

	it('returns 400 when title is missing', async () => {
		const res = await SELF.fetch('http://example.com/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ body: 'No title here' }),
		});
		expect(res.status).toBe(400);
	});

	it('returns 405 for unsupported methods', async () => {
		const res = await SELF.fetch('http://example.com/api/notes', { method: 'PUT' });
		expect(res.status).toBe(405);
	});
});

describe('DELETE /api/notes/:id', () => {
	it('deletes an existing note and returns 204', async () => {
		const { meta } = await env.DB.prepare(
			"INSERT INTO notes (title, body) VALUES ('Delete me', '')"
		).run();
		const id = meta.last_row_id;

		const res = await SELF.fetch(`http://example.com/api/notes/${id}`, { method: 'DELETE' });
		expect(res.status).toBe(204);

		const { results } = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).all();
		expect(results).toHaveLength(0);
	});

	it('returns 404 when note does not exist', async () => {
		const res = await SELF.fetch('http://example.com/api/notes/99999', { method: 'DELETE' });
		expect(res.status).toBe(404);
	});

	it('returns 405 for unsupported methods on /:id', async () => {
		const res = await SELF.fetch('http://example.com/api/notes/1', { method: 'PATCH' });
		expect(res.status).toBe(405);
	});
});

describe('unknown routes', () => {
	it('returns 404 for unrecognised paths', async () => {
		const res = await SELF.fetch('http://example.com/api/unknown');
		expect(res.status).toBe(404);
	});
});

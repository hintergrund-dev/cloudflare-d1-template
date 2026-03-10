import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

type Note = { id: number; title: string; body: string; created_at: string };

function makeNote(overrides: Partial<Note> = {}): Note {
	return {
		id: 1,
		title: 'Test note',
		body: 'Test body',
		created_at: new Date().toISOString(),
		...overrides,
	};
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
	return vi.stubGlobal('fetch', vi.fn(handler));
}

beforeEach(() => {
	// Default: empty notes list
	mockFetch((url) => {
		if (url === '/api/notes') return Response.json([]);
		return new Response('Not Found', { status: 404 });
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Page', () => {
	it('renders the main heading', async () => {
		render(Page);
		await expect.element(page.getByRole('heading', { level: 1 })).toBeInTheDocument();
		await expect.element(page.getByText('Cloudflare D1 Template')).toBeInTheDocument();
	});

	it('shows an empty state message when there are no notes', async () => {
		render(Page);
		await expect.element(page.getByText('No notes yet. Add one above.')).toBeInTheDocument();
	});

	it('renders notes fetched from /api/notes on mount', async () => {
		const notes = [
			makeNote({ id: 1, title: 'First note', body: 'Hello' }),
			makeNote({ id: 2, title: 'Second note', body: 'World' }),
		];
		mockFetch(() => Response.json(notes));

		render(Page);

		await expect.element(page.getByText('First note')).toBeInTheDocument();
		await expect.element(page.getByText('Second note')).toBeInTheDocument();
	});

	it('shows note body text when present', async () => {
		mockFetch(() => Response.json([makeNote({ body: 'This is the body' })]));

		render(Page);

		await expect.element(page.getByText('This is the body')).toBeInTheDocument();
	});

	it('submits a new note via POST and refreshes the list', async () => {
		const created: Note = makeNote({ id: 10, title: 'New note', body: 'Created!' });
		let callCount = 0;

		mockFetch((url, init) => {
			if (init?.method === 'POST') return Response.json(created, { status: 201 });
			// Second GET (after creation) returns the new note
			callCount++;
			return callCount > 1 ? Response.json([created]) : Response.json([]);
		});

		render(Page);

		await userEvent.fill(page.getByPlaceholder('Title'), 'New note');
		await userEvent.fill(page.getByPlaceholder('Body (optional)'), 'Created!');
		await userEvent.click(page.getByRole('button', { name: 'Add note' }));

		await expect.element(page.getByText('New note')).toBeInTheDocument();
	});

	it('clears the form after successful submission', async () => {
		mockFetch((url, init) => {
			if (init?.method === 'POST') return Response.json(makeNote(), { status: 201 });
			return Response.json([]);
		});

		render(Page);

		const titleInput = page.getByPlaceholder('Title');
		await userEvent.fill(titleInput, 'Will be cleared');
		await userEvent.click(page.getByRole('button', { name: 'Add note' }));

		await expect.element(titleInput).toHaveValue('');
	});

	it('disables the submit button when title is empty', async () => {
		render(Page);

		const btn = page.getByRole('button', { name: 'Add note' });
		await expect.element(btn).toBeDisabled();

		await userEvent.fill(page.getByPlaceholder('Title'), 'something');
		await expect.element(btn).not.toBeDisabled();
	});

	it('deletes a note via DELETE and removes it from the list', async () => {
		const note = makeNote({ id: 42, title: 'Delete me' });
		let deleted = false;

		mockFetch((url, init) => {
			if (init?.method === 'DELETE') {
				deleted = true;
				return new Response(null, { status: 204 });
			}
			return Response.json(deleted ? [] : [note]);
		});

		render(Page);

		await expect.element(page.getByText('Delete me')).toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: 'Delete' }));

		await expect.element(page.getByText('Delete me')).not.toBeInTheDocument();
	});
});

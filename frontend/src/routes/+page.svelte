<script lang="ts">
	import { onMount } from 'svelte';

	type Note = { id: number; title: string; body: string; created_at: string };

	let notes = $state<Note[]>([]);
	let loading = $state(true);
	let error = $state('');

	let title = $state('');
	let body = $state('');
	let submitting = $state(false);

	async function loadNotes() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/notes');
			notes = await res.json();
		} catch {
			error = 'Failed to load notes.';
		} finally {
			loading = false;
		}
	}

	async function addNote(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		submitting = true;
		try {
			const res = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), body: body.trim() }),
			});
			if (!res.ok) throw new Error(await res.text());
			title = '';
			body = '';
			await loadNotes();
		} catch (err: any) {
			error = err.message ?? 'Failed to create note.';
		} finally {
			submitting = false;
		}
	}

	async function deleteNote(id: number) {
		try {
			await fetch(`/api/notes/${id}`, { method: 'DELETE' });
			notes = notes.filter((n) => n.id !== id);
		} catch {
			error = 'Failed to delete note.';
		}
	}

	onMount(loadNotes);
</script>

<main>
	<header>
		<h1>☁️ Cloudflare D1 Template</h1>
		<p class="tagline">
			A minimal, production-ready starter for Cloudflare Workers + D1 SQLite + SvelteKit.<br />
			The notes below are stored in a live <strong>D1 database</strong> at the edge.
		</p>
	</header>

	<section class="demo">
		<h2>Live D1 demo — Notes</h2>

		<form onsubmit={addNote}>
			<input
				type="text"
				placeholder="Title"
				bind:value={title}
				required
				disabled={submitting}
			/>
			<textarea
				placeholder="Body (optional)"
				bind:value={body}
				rows="2"
				disabled={submitting}
			></textarea>
			<button type="submit" disabled={submitting || !title.trim()}>
				{submitting ? 'Adding…' : 'Add note'}
			</button>
		</form>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if loading}
			<p class="muted">Loading…</p>
		{:else if notes.length === 0}
			<p class="muted">No notes yet. Add one above.</p>
		{:else}
			<ul class="notes">
				{#each notes as note (note.id)}
					<li>
						<div class="note-content">
							<strong>{note.title}</strong>
							{#if note.body}<p>{note.body}</p>{/if}
							<time>{new Date(note.created_at).toLocaleString()}</time>
						</div>
						<button class="delete" onclick={() => deleteNote(note.id)} aria-label="Delete">✕</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section>
		<h2>What's included</h2>
		<ul>
			<li><strong>Cloudflare Worker</strong> — <code>src/index.ts</code> serves the API and static assets</li>
			<li><strong>Cloudflare D1</strong> — serverless SQLite bound as <code>env.DB</code></li>
			<li><strong>SvelteKit (adapter-static)</strong> — built to <code>./public</code> and served by the Worker</li>
			<li><strong>@hintergrund/d1-sync</strong> — schema-first migrations from <code>db/schema.sql</code></li>
		</ul>
	</section>

	<section>
		<h2>Getting started</h2>
		<ol>
			<li>Create a D1 database: <code>wrangler d1 create my-db</code></li>
			<li>Paste the database ID into <code>wrangler.jsonc</code></li>
			<li>Apply the schema: <code>npm run d1-sync -- --name init</code></li>
			<li>Build the frontend: <code>cd frontend && npm run build</code></li>
			<li>Deploy: <code>npm run deploy</code></li>
		</ol>
	</section>

	<footer>
		<p>
			Built with <a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener">Cloudflare Workers</a>,
			<a href="https://developers.cloudflare.com/d1/" target="_blank" rel="noopener">D1</a>, and
			<a href="https://svelte.dev/docs/kit" target="_blank" rel="noopener">SvelteKit</a>.
			·
			<a href="https://github.com/hintergrund-dev/cloudflare-d1-template" target="_blank" rel="noopener">GitHub</a>
		</p>
	</footer>
</main>

<style>
	main {
		font-family: system-ui, sans-serif;
		max-width: 720px;
		margin: 4rem auto;
		padding: 0 1.5rem;
		color: #1a1a1a;
		line-height: 1.6;
	}

	header {
		margin-bottom: 2.5rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0 0 0.5rem;
	}

	.tagline {
		font-size: 1.05rem;
		color: #555;
		margin: 0;
	}

	h2 {
		font-size: 1.15rem;
		margin-top: 2rem;
		border-bottom: 1px solid #e5e5e5;
		padding-bottom: 0.25rem;
	}

	/* ── Demo section ── */
	.demo {
		background: #fafafa;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 1.25rem 1.5rem;
	}

	.demo h2 {
		margin-top: 0;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	input, textarea {
		font: inherit;
		border: 1px solid #d5d5d5;
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		background: #fff;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus, textarea:focus {
		outline: 2px solid #f6821f;
		border-color: transparent;
	}

	textarea { resize: vertical; }

	button[type="submit"] {
		align-self: flex-start;
		font: inherit;
		background: #f6821f;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1.25rem;
		cursor: pointer;
		font-weight: 600;
	}

	button[type="submit"]:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.notes {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.notes li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		padding: 0.75rem 1rem;
	}

	.note-content {
		flex: 1;
		min-width: 0;
	}

	.note-content p {
		margin: 0.2rem 0 0.3rem;
		color: #333;
		white-space: pre-wrap;
		word-break: break-word;
	}

	time {
		font-size: 0.78rem;
		color: #999;
	}

	button.delete {
		flex-shrink: 0;
		background: none;
		border: none;
		color: #bbb;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.1rem 0.25rem;
		line-height: 1;
		border-radius: 4px;
	}

	button.delete:hover { color: #e00; }

	.muted { color: #888; font-size: 0.9rem; }
	.error { color: #c00; font-size: 0.9rem; }

	/* ── Info sections ── */
	ul, ol { padding-left: 1.4rem; }
	li { margin-bottom: 0.4rem; }

	code {
		background: #f3f3f3;
		border-radius: 4px;
		padding: 0.1em 0.4em;
		font-size: 0.88em;
	}

	footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e5e5;
		color: #777;
		font-size: 0.88rem;
	}

	a { color: #f6821f; }
</style>

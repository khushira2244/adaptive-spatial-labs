import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  fixture,
  actors,
  projectPayload,
  multipartFile,
  type Fixture,
  type Actor,
} from './fixture.js';
import { projects, stagedUploads } from '../src/shared/database/schema.js';
describe('Complete wizard transaction', () => {
  let f: Fixture;
  let owner: Actor;
  let editor: Actor;
  let outsider: Actor;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
  });
  afterAll(async () => {
    await f.close();
  });
  async function counts() {
    const result = await f.db.execute(
      sql`select (select count(*)::int from projects) as projects, (select count(*)::int from project_editors) as editors, (select count(*)::int from project_structures) as structures, (select count(*)::int from project_layers) as layers, (select count(*)::int from project_sources) as sources`,
    );
    return result.rows[0];
  }
  it('one create command commits project, owner, editors, structure, layers and source metadata', async () => {
    const file = multipartFile('wizard upload');
    const uploaded = await f.app.inject({
      method: 'POST',
      url: '/api/v1/uploads',
      headers: { ...owner.headers, ...file.headers },
      payload: file.payload,
    });
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: {
        ...projectPayload(owner),
        editorUserIds: [editor.id],
        sources: [{ sourceType: 'FILE', name: 'Wizard file', uploadId: uploaded.json().data.id }],
      },
    });
    expect(res.statusCode).toBe(201);
    const count = await counts();
    expect(count).toEqual({ projects: 1, editors: 1, structures: 1, layers: 2, sources: 1 });
    expect(
      (await f.db.select().from(projects).where(eq(projects.id, res.json().data.id)))[0]
        ?.ownerUserId,
    ).toBe(owner.id);
    expect(await f.db.select().from(stagedUploads)).toHaveLength(0);
  });
  it('failure after project and editor insert rolls back everything', async () => {
    const before = await counts();
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: { ...projectPayload(owner), editorUserIds: [editor.id, outsider.id] },
    });
    expect(res.statusCode).toBe(403);
    expect(await counts()).toEqual(before);
  });
  it('failure after structure and layers insert rolls back everything', async () => {
    const before = await counts();
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: {
        ...projectPayload(owner),
        sources: [{ sourceType: 'FILE', name: 'Missing', uploadId: randomUUID() }],
      },
    });
    expect(res.statusCode).toBe(404);
    expect(await counts()).toEqual(before);
  });
  it('duplicate attachment fails after first source and restores consumed upload', async () => {
    const file = multipartFile('rollback bytes');
    const uploaded = await f.app.inject({
      method: 'POST',
      url: '/api/v1/uploads',
      headers: { ...owner.headers, ...file.headers },
      payload: file.payload,
    });
    const uploadId = uploaded.json().data.id;
    const before = await counts();
    const source = { sourceType: 'FILE', name: 'Duplicate', uploadId };
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: { ...projectPayload(owner), sources: [source, source] },
    });
    expect(res.statusCode).toBe(404);
    expect(await counts()).toEqual(before);
    const [restored] = await f.db
      .select()
      .from(stagedUploads)
      .where(eq(stagedUploads.id, uploadId));
    expect(restored).toBeDefined();
    expect((await f.storage.get(restored!.storageKey)).toString()).toBe('rollback bytes');
  });
  it('validation failure never leaves a partial project', async () => {
    const before = await counts();
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: {
        ...projectPayload(owner),
        structure: {
          templateKey: 'CUSTOM',
          layers: [
            { name: 'A', sortOrder: 0 },
            { name: 'B', sortOrder: 0 },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(400);
    expect(await counts()).toEqual(before);
  });
  it('database foreign keys deliberately block destructive user deletion', async () => {
    await expect(f.db.execute(sql`delete from users where id = ${owner.id}`)).rejects.toThrow();
    expect((await counts())?.projects).toBe(1);
  });
});

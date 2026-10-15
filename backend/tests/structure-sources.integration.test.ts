import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  fixture,
  actors,
  createProject,
  multipartFile,
  type Fixture,
  type Actor,
} from './fixture.js';
import { buildApp } from '../src/app/app.js';
describe('Structure, layers, sources, and private storage', () => {
  let f: Fixture;
  let owner: Actor;
  let editor: Actor;
  let outsider: Actor;
  let projectId: string;
  let addedLayerId: string;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    projectId = (await createProject(f, owner, { editorUserIds: [editor.id] })).id;
  });
  afterAll(async () => {
    await f.close();
  });
  it('template selection and explicit layers persist', async () => {
    const structure = await f.app.inject({
      url: `/api/v1/projects/${projectId}/structure`,
      headers: owner.headers,
    });
    expect(structure.json().data.templateKey).toBe('PRODUCT_SYSTEM');
    const layers = await f.app.inject({
      url: `/api/v1/projects/${projectId}/layers`,
      headers: owner.headers,
    });
    expect(
      layers.json().data.map((l: { name: string; sortOrder: number }) => [l.name, l.sortOrder]),
    ).toEqual([
      ['Product', 0],
      ['Service', 1],
    ]);
  });
  it('presets initialize only layers and custom can start empty', async () => {
    const res = await f.app.inject({ url: '/api/v1/project-templates', headers: owner.headers });
    expect(res.json().data).toHaveLength(6);
    const project = await createProject(f, owner, { structure: { templateKey: 'CUSTOM' } });
    expect(
      (
        await f.app.inject({ url: `/api/v1/projects/${project.id}/layers`, headers: owner.headers })
      ).json().data,
    ).toEqual([]);
  });
  it('editor can add a first-class custom layer at explicit position', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/layers`,
      headers: editor.headers,
      payload: { name: 'Compliance', description: 'Custom domain', sortOrder: 1 },
    });
    expect(res.statusCode).toBe(201);
    addedLayerId = res.json().data.id;
    expect(res.json().data.source).toBe('USER_CREATED');
    const layers = await f.app.inject({
      url: `/api/v1/projects/${projectId}/layers`,
      headers: owner.headers,
    });
    expect(layers.json().data.map((l: { name: string }) => l.name)).toEqual([
      'Product',
      'Compliance',
      'Service',
    ]);
  });
  it('layer rename and reorder persist and ordering stays contiguous', async () => {
    const res = await f.app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${projectId}/layers/${addedLayerId}`,
      headers: editor.headers,
      payload: { name: 'Security', sortOrder: 0 },
    });
    expect(res.json().data).toMatchObject({ name: 'Security', sortOrder: 0 });
    const layers = await f.app.inject({
      url: `/api/v1/projects/${projectId}/layers`,
      headers: owner.headers,
    });
    expect(layers.json().data.map((l: { sortOrder: number }) => l.sortOrder)).toEqual([0, 1, 2]);
  });
  it('cross-project layer IDs cannot be modified', async () => {
    const other = await createProject(f, owner);
    const res = await f.app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${other.id}/layers/${addedLayerId}`,
      headers: owner.headers,
      payload: { name: 'Hijacked' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('LAYER_NOT_FOUND');
  });
  it('layer removal persists and reindexes remaining layers', async () => {
    expect(
      (
        await f.app.inject({
          method: 'DELETE',
          url: `/api/v1/projects/${projectId}/layers/${addedLayerId}`,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(200);
    const layers = await f.app.inject({
      url: `/api/v1/projects/${projectId}/layers`,
      headers: owner.headers,
    });
    expect(layers.json().data.map((l: { sortOrder: number }) => l.sortOrder)).toEqual([0, 1]);
  });
  it('structure replacement changes template and layers atomically', async () => {
    const res = await f.app.inject({
      method: 'PUT',
      url: `/api/v1/projects/${projectId}/structure`,
      headers: owner.headers,
      payload: { templateKey: 'CUSTOM', layers: [{ name: 'Custom Layer', sortOrder: 0 }] },
    });
    expect(res.statusCode).toBe(200);
    const layers = await f.app.inject({
      url: `/api/v1/projects/${projectId}/layers`,
      headers: owner.headers,
    });
    expect(layers.json().data).toHaveLength(1);
    expect(layers.json().data[0].name).toBe('Custom Layer');
  });
  it('source metadata belongs to correct project and Miro remains pending', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/sources`,
      headers: editor.headers,
      payload: {
        sourceType: 'MIRO',
        name: 'Board',
        externalReference: 'https://miro.com/app/board/example',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data).toMatchObject({ projectId, status: 'PENDING', hasFile: false });
    expect(res.body).not.toContain('storageKey');
  });
  it('unauthorized source reading and writing are blocked', async () => {
    const url = `/api/v1/projects/${projectId}/sources`;
    expect((await f.app.inject({ url, headers: outsider.headers })).statusCode).toBe(403);
    expect(
      (
        await f.app.inject({
          method: 'POST',
          url,
          headers: outsider.headers,
          payload: { sourceType: 'FILE', name: 'No' },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('LocalStorageProvider saves, retrieves, deletes, and refuses traversal', async () => {
    const key = await f.storage.put(Buffer.from('bytes'));
    expect((await f.storage.get(key)).toString()).toBe('bytes');
    await f.storage.delete(key);
    await expect(f.storage.get(key)).rejects.toThrow();
    await expect(f.storage.get('../secret')).rejects.toThrow('Invalid storage key');
  });
  it('multipart staging attaches to project, downloads privately, and deletes bytes', async () => {
    const file = multipartFile();
    const upload = await f.app.inject({
      method: 'POST',
      url: '/api/v1/uploads',
      headers: { ...owner.headers, ...file.headers },
      payload: file.payload,
    });
    expect(upload.statusCode).toBe(201);
    const source = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/sources`,
      headers: owner.headers,
      payload: {
        sourceType: 'ARCHITECTURE_DOC',
        name: 'Document',
        uploadId: upload.json().data.id,
      },
    });
    expect(source.statusCode).toBe(201);
    const id = source.json().data.id;
    expect(source.json().data).toMatchObject({
      status: 'UPLOADED',
      hasFile: true,
      metadata: { contentType: 'text/plain', byteSize: 28, note: null },
    });
    const url = `/api/v1/projects/${projectId}/sources/${id}/content`;
    const downloaded = await f.app.inject({ url, headers: editor.headers });
    expect(downloaded.body).toBe('sample architecture document');
    expect(downloaded.headers['content-type']).toBe('application/octet-stream');
    expect((await f.app.inject({ url, headers: outsider.headers })).statusCode).toBe(403);
    expect(
      (
        await f.app.inject({
          method: 'DELETE',
          url: `/api/v1/projects/${projectId}/sources/${id}`,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(200);
    expect((await f.app.inject({ url, headers: owner.headers })).statusCode).toBe(404);
  });
  it('another user cannot consume a private upload', async () => {
    const file = multipartFile('private');
    const upload = await f.app.inject({
      method: 'POST',
      url: '/api/v1/uploads',
      headers: { ...owner.headers, ...file.headers },
      payload: file.payload,
    });
    const res = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/sources`,
      headers: editor.headers,
      payload: { sourceType: 'FILE', name: 'Stolen', uploadId: upload.json().data.id },
    });
    expect(res.statusCode).toBe(404);
    expect(
      (
        await f.app.inject({
          method: 'DELETE',
          url: `/api/v1/uploads/${upload.json().data.id}`,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(200);
  });
  it('cross-project source IDs cannot be deleted', async () => {
    const source = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/sources`,
      headers: owner.headers,
      payload: { sourceType: 'FILE', name: 'Metadata' },
    });
    const other = await createProject(f, owner);
    expect(
      (
        await f.app.inject({
          method: 'DELETE',
          url: `/api/v1/projects/${other.id}/sources/${source.json().data.id}`,
          headers: owner.headers,
        })
      ).json().error.code,
    ).toBe('SOURCE_NOT_FOUND');
  });
  it('missing upload and empty file fail safely', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/sources`,
      headers: owner.headers,
      payload: { sourceType: 'FILE', name: 'Missing', uploadId: randomUUID() },
    });
    expect(res.statusCode).toBe(404);
    const file = multipartFile('');
    expect(
      (
        await f.app.inject({
          method: 'POST',
          url: '/api/v1/uploads',
          headers: { ...owner.headers, ...file.headers },
          payload: file.payload,
        })
      ).statusCode,
    ).toBe(400);
  });
  it('oversized multipart files are rejected before staging', async () => {
    const app = await buildApp({
      db: f.db,
      config: { ...f.config, MAX_UPLOAD_BYTES: 8 },
      storage: f.storage,
    });
    try {
      const file = multipartFile('oversized file payload');
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: { ...owner.headers, ...file.headers },
        payload: file.payload,
      });
      expect(res.statusCode).toBe(413);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    } finally {
      await app.close();
    }
  });
});

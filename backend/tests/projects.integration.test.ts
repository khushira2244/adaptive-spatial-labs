import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import {
  fixture,
  actors,
  createProject,
  projectPayload,
  type Fixture,
  type Actor,
} from './fixture.js';
describe('Organizations, project permissions, and editors', () => {
  let f: Fixture;
  let owner: Actor;
  let editor: Actor;
  let outsider: Actor;
  let projectId: string;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    projectId = (await createProject(f, owner)).id;
  });
  afterAll(async () => {
    await f.close();
  });
  it('organization creation also creates owner membership', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: owner.headers,
      payload: { name: 'Another organization' },
    });
    expect(res.statusCode).toBe(201);
    const members = await f.app.inject({
      url: `/api/v1/organizations/${res.json().data.id}/members`,
      headers: owner.headers,
    });
    expect(members.json().data[0]).toMatchObject({ id: owner.id, membershipRole: 'OWNER' });
  });
  it('member lookup supports search and excludes password hashes', async () => {
    const res = await f.app.inject({
      url: `/api/v1/organizations/${owner.orgId}/members?search=editor`,
      headers: owner.headers,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].id).toBe(editor.id);
    expect(res.body).not.toContain('passwordHash');
  });
  it('organization lookup blocks non-members', async () => {
    const res = await f.app.inject({
      url: `/api/v1/organizations/${owner.orgId}/members`,
      headers: outsider.headers,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('ORGANIZATION_FORBIDDEN');
  });
  it('project creator is owner and project appears in Home listing', async () => {
    const res = await f.app.inject({ url: '/api/v1/projects', headers: owner.headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.find((p: { id: string }) => p.id === projectId)).toMatchObject({
      ownerUserId: owner.id,
      status: 'ACTIVE',
      organizationId: owner.orgId,
    });
  });
  it('project GET has stable UUID and ISO timestamp DTO', async () => {
    const res = await f.app.inject({
      url: `/api/v1/projects/${projectId}`,
      headers: owner.headers,
    });
    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.json().data).sort()).toEqual(
      [
        'id',
        'organizationId',
        'name',
        'description',
        'projectType',
        'visibility',
        'ownerUserId',
        'status',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
    expect(res.json().data.createdAt).toMatch(/T.*Z$/);
  });
  it('restricted project blocks unrelated user and org member without editor access', async () => {
    for (const actor of [editor, outsider]) {
      const res = await f.app.inject({
        url: `/api/v1/projects/${projectId}`,
        headers: actor.headers,
      });
      expect(res.statusCode).toBe(403);
      const listed = await f.app.inject({ url: '/api/v1/projects', headers: actor.headers });
      expect(listed.json().data.some((p: { id: string }) => p.id === projectId)).toBe(false);
    }
  });
  it('owner can add editor; duplicate and owner-as-editor are safely rejected', async () => {
    const url = `/api/v1/projects/${projectId}/editors`;
    const res = await f.app.inject({
      method: 'POST',
      url,
      headers: owner.headers,
      payload: { userId: editor.id },
    });
    expect(res.statusCode).toBe(201);
    for (const userId of [editor.id, owner.id]) {
      const duplicate = await f.app.inject({
        method: 'POST',
        url,
        headers: owner.headers,
        payload: { userId },
      });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().error.code).toBe('EDITOR_ALREADY_EXISTS');
    }
  });
  it('editor receives access and appears on editor list', async () => {
    expect(
      (await f.app.inject({ url: `/api/v1/projects/${projectId}`, headers: editor.headers }))
        .statusCode,
    ).toBe(200);
    const list = await f.app.inject({
      url: `/api/v1/projects/${projectId}/editors`,
      headers: editor.headers,
    });
    expect(list.json().data[0].userId).toBe(editor.id);
  });
  it('owner-only settings and editor management block editor', async () => {
    const res = await f.app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${projectId}`,
      headers: editor.headers,
      payload: { visibility: 'ORGANIZATION_OPEN' },
    });
    expect(res.statusCode).toBe(403);
    expect(
      (
        await f.app.inject({
          method: 'DELETE',
          url: `/api/v1/projects/${projectId}/editors/${editor.id}`,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(403);
  });
  it('owner cannot add an editor from another organization', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/editors`,
      headers: owner.headers,
      payload: { userId: outsider.id },
    });
    expect(res.statusCode).toBe(403);
  });
  it('owner removes editor and access is immediately lost', async () => {
    const url = `/api/v1/projects/${projectId}/editors/${editor.id}`;
    expect((await f.app.inject({ method: 'DELETE', url, headers: owner.headers })).statusCode).toBe(
      200,
    );
    expect(
      (await f.app.inject({ url: `/api/v1/projects/${projectId}`, headers: editor.headers }))
        .statusCode,
    ).toBe(403);
    expect(
      (await f.app.inject({ method: 'DELETE', url, headers: owner.headers })).json().error.code,
    ).toBe('EDITOR_NOT_FOUND');
  });
  it('discoverable exposes summaries but not protected project content', async () => {
    const project = await createProject(f, owner, { visibility: 'ORGANIZATION_DISCOVERABLE' });
    const list = await f.app.inject({ url: '/api/v1/projects', headers: editor.headers });
    expect(list.json().data.some((p: { id: string }) => p.id === project.id)).toBe(true);
    expect(
      (
        await f.app.inject({
          url: `/api/v1/projects/${project.id}/layers`,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (await f.app.inject({ url: `/api/v1/projects/${project.id}`, headers: outsider.headers }))
        .statusCode,
    ).toBe(403);
  });
  it('organization-open permits member reading but not authoring', async () => {
    const project = await createProject(f, owner, { visibility: 'ORGANIZATION_OPEN' });
    expect(
      (
        await f.app.inject({
          url: `/api/v1/projects/${project.id}/layers`,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await f.app.inject({
          method: 'POST',
          url: `/api/v1/projects/${project.id}/layers`,
          headers: editor.headers,
          payload: { name: 'Injected', sortOrder: 0 },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('archive preserves data and disables authoring; owner can restore', async () => {
    const url = `/api/v1/projects/${projectId}`;
    expect(
      (
        await f.app.inject({
          method: 'PATCH',
          url,
          headers: owner.headers,
          payload: { status: 'ARCHIVED' },
        })
      ).statusCode,
    ).toBe(200);
    const edit = await f.app.inject({
      method: 'POST',
      url: `${url}/layers`,
      headers: owner.headers,
      payload: { name: 'No', sortOrder: 0 },
    });
    expect(edit.statusCode).toBe(409);
    const archived = await f.app.inject({
      url: '/api/v1/projects?status=ARCHIVED',
      headers: owner.headers,
    });
    expect(archived.json().data.some((p: { id: string }) => p.id === projectId)).toBe(true);
    expect(
      (
        await f.app.inject({
          method: 'PATCH',
          url,
          headers: owner.headers,
          payload: { status: 'ACTIVE', name: 'Restored' },
        })
      ).json().data.name,
    ).toBe('Restored');
  });
  it('project cannot be created under a foreign organization or with client-supplied owner', async () => {
    const foreign = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: outsider.headers,
      payload: projectPayload(owner),
    });
    expect(foreign.statusCode).toBe(403);
    const injection = await f.app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: owner.headers,
      payload: { ...projectPayload(owner), ownerUserId: outsider.id },
    });
    expect(injection.statusCode).toBe(400);
  });
});

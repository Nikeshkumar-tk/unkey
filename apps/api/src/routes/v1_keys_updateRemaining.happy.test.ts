import { afterEach, beforeEach, expect, test } from "vitest";

import { RouteHarness } from "@/pkg/testutil/route-harness";
import { schema } from "@unkey/db";
import { sha256 } from "@unkey/hash";
import { newId } from "@unkey/id";
import { KeyV1 } from "@unkey/keys";
import {
  V1KeysUpdateRemainingRequest,
  V1KeysUpdateRemainingResponse,
  registerV1KeysUpdateRemaining,
} from "./v1_keys_updateRemaining";

let h: RouteHarness;
beforeEach(async () => {
  h = new RouteHarness();
  h.useRoutes(registerV1KeysUpdateRemaining);
  await h.seed();
});
afterEach(async () => {
  await h.teardown();
});
test("increment", async () => {
  const key = {
    id: newId("key"),
    keyAuthId: h.resources.userKeyAuth.id,
    workspaceId: h.resources.userWorkspace.id,
    start: "test",
    name: "test",
    hash: await sha256(new KeyV1({ byteLength: 16 }).toString()),
    remaining: 100,
    createdAt: new Date(),
  };
  await h.db.insert(schema.keys).values(key);

  const root = await h.createRootKey(["api.*.update_key"]);
  const res = await h.post<V1KeysUpdateRemainingRequest, V1KeysUpdateRemainingResponse>({
    url: "/v1/keys.updateRemaining",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${root.key}`,
    },
    body: {
      keyId: key.id,
      op: "increment",
      value: 10,
    },
  });

  expect(res.status).toEqual(200);
  expect(res.body.remaining).toEqual(110);
});

test("decrement", async () => {
  const key = {
    id: newId("key"),
    keyAuthId: h.resources.userKeyAuth.id,
    workspaceId: h.resources.userWorkspace.id,
    start: "test",
    name: "test",
    hash: await sha256(new KeyV1({ byteLength: 16 }).toString()),
    remaining: 100,
    createdAt: new Date(),
  };
  await h.db.insert(schema.keys).values(key);
  const root = await h.createRootKey(["api.*.update_key"]);

  const res = await h.post<V1KeysUpdateRemainingRequest, V1KeysUpdateRemainingResponse>({
    url: "/v1/keys.updateRemaining",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${root.key}`,
    },
    body: {
      keyId: key.id,
      op: "decrement",
      value: 10,
    },
  });

  expect(res.status).toEqual(200);
  expect(res.body.remaining).toEqual(90);
});

test("set", async () => {
  const key = {
    id: newId("key"),
    keyAuthId: h.resources.userKeyAuth.id,
    workspaceId: h.resources.userWorkspace.id,
    start: "test",
    name: "test",
    hash: await sha256(new KeyV1({ byteLength: 16 }).toString()),
    remaining: 100,
    createdAt: new Date(),
  };
  await h.db.insert(schema.keys).values(key);
  const root = await h.createRootKey(["api.*.update_key"]);

  const res = await h.post<V1KeysUpdateRemainingRequest, V1KeysUpdateRemainingResponse>({
    url: "/v1/keys.updateRemaining",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${root.key}`,
    },
    body: {
      keyId: key.id,
      op: "set",
      value: 10,
    },
  });

  expect(res.status).toEqual(200);
  expect(res.body.remaining).toEqual(10);
});

test("invalid operation", async () => {
  const key = {
    id: newId("key"),
    keyAuthId: h.resources.userKeyAuth.id,
    workspaceId: h.resources.userWorkspace.id,
    start: "test",
    name: "test",
    hash: await sha256(new KeyV1({ byteLength: 16 }).toString()),
    remaining: 100,
    createdAt: new Date(),
  };
  await h.db.insert(schema.keys).values(key);
  const root = await h.createRootKey(["api.*.update_key"]);

  const res = await h.post<V1KeysUpdateRemainingRequest, V1KeysUpdateRemainingResponse>({
    url: "/v1/keys.updateRemaining",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${root.key}`,
    },
    body: {
      keyId: key.id,
      // @ts-ignore This is an invalid operation
      op: "XXX",
      value: 10,
    },
  });

  expect(res.status).toEqual(400);
});

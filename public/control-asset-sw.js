//#region src/control-asset-sw.ts
var e = self, t = "infra", n = {
	"ort-wasm-simd-threaded.wasm": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.wasm",
	"ort.wasm.min.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort.wasm.min.mjs",
	"ort-wasm-simd-threaded.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.mjs",
	"piper_phonemize.data": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
	"piper_phonemize.js": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js",
	"piper_phonemize.wasm": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm"
}, r = {
	".wasm": "application/wasm",
	".mjs": "text/javascript",
	".js": "text/javascript",
	".data": "application/octet-stream",
	".onnx": "application/octet-stream"
};
e.addEventListener("install", () => {
	e.skipWaiting();
}), e.addEventListener("activate", (t) => {
	t.waitUntil(e.clients.claim());
}), e.addEventListener("fetch", (t) => {
	let n = new URL(t.request.url);
	if (n.searchParams.has("bypass-sw") || n.origin !== e.location.origin || !n.pathname.startsWith("/assets/")) return;
	let r = n.pathname.slice(8);
	r && t.respondWith(i(r));
});
async function i(e) {
	let t = s(e), r = await a(e);
	if (r) return new Response(r, {
		status: 200,
		headers: {
			"Content-Type": t,
			"x-piper-sw": "intercepted"
		}
	});
	try {
		let n = await fetch(`/assets/${e}`);
		if (n.ok) {
			let r = await n.arrayBuffer();
			return await o(e, r), new Response(r, {
				status: 200,
				headers: {
					"Content-Type": t,
					"x-piper-sw": "intercepted"
				}
			});
		}
	} catch {}
	let i = n[e];
	if (!i) return console.error(`[control-asset-sw] No CDN URL registered for: ${e}`), new Response(`[control-asset-sw] Unknown asset: ${e}`, { status: 404 });
	let c;
	try {
		c = await fetch(i);
	} catch (t) {
		return console.error(`[control-asset-sw] CDN fetch failed for ${e}:`, t), new Response(`[control-asset-sw] CDN unreachable for: ${e}`, { status: 502 });
	}
	if (!c.ok) return new Response(`[control-asset-sw] CDN returned ${c.status} for: ${e}`, { status: 502 });
	let l = await c.arrayBuffer();
	return await o(e, l), new Response(l, {
		status: 200,
		headers: {
			"Content-Type": t,
			"x-piper-sw": "intercepted"
		}
	});
}
async function a(e) {
	try {
		return await (await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(t, { create: !1 })).getFileHandle(e, { create: !1 })).getFile()).arrayBuffer();
	} catch {
		return null;
	}
}
async function o(e, n) {
	try {
		let r = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(t, { create: !0 })).getFileHandle(e, { create: !0 })).createWritable();
		await r.write(n), await r.close();
	} catch (e) {
		console.warn("[control-asset-sw] OPFS write failed, continuing without cache:", e);
	}
}
function s(e) {
	return r[e.substring(e.lastIndexOf("."))] ?? "application/octet-stream";
}
//#endregion

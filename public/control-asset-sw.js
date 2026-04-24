import { downloadFile as e } from "@huggingface/hub";
//#region src/control-asset-sw.ts
var t = self;
async function n(e) {
	let t = await crypto.subtle.digest("SHA-256", e);
	return Array.from(new Uint8Array(t)).map((e) => e.toString(16).padStart(2, "0")).join("");
}
async function r(e, t) {
	return (await n(e)).toLowerCase() === t.toLowerCase();
}
var i = "infra", a = "voices", o = {
	"ort-wasm-simd-threaded.wasm": "be0e129949062ad50290ef94683fac8be5bb6156f709e030b7a5f1661a2f6c17",
	"ort.wasm.min.mjs": "d5a6d7bc8ee587648fb3742dde8c0094d17cbd3822a68bbec8ddfcd4f2adb88e",
	"ort-wasm-simd-threaded.mjs": "5687566b1bc1c8cf628d76c2ddb16b2a3b81a7997273d4666564880495088e57",
	"piper_phonemize.data": "29f1025eb23a5b5c192cd14a6efbce4509402ff265405072ee6f7d1a09b78f8c",
	"piper_phonemize.js": "fef0c2fc442d24fdef5c7c7cc37d5da2314407640fe11ab1bfe347c723dff19b",
	"piper_phonemize.wasm": "b777cd107a91d2bcc6a1ea46f2c26a662a7407394fe84589198aeaa83dd7a9d6",
	"piper-callback.js": ""
}, s = {
	"ort-wasm-simd-threaded.wasm": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.wasm",
	"ort.wasm.min.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort.wasm.min.mjs",
	"ort-wasm-simd-threaded.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.mjs",
	"piper_phonemize.data": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
	"piper_phonemize.js": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js",
	"piper_phonemize.wasm": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm"
}, c = {
	"en_US-bryce-medium": {
		onnx: "330c232c12b8a08eb241599190f2ee8ccd6072dce323d10e06684fb0cde8a241",
		config: "7ceb1bc4af6d4e41b6d1edbb86c67e91e01eaa71f66db4cd0ae92ac704d415be"
	},
	"en_US-ljspeech-high": {
		onnx: "16e472d4e0b95134c67ebbc7fcb06c92b242adf3ea41f4f2630aaf172349227c",
		config: "7e1f4634af596d83cca997fb7a931ba80b70f8a316a2655ee69c55365e0ace14"
	},
	"en_US-kristin-medium": {
		onnx: "f6f2c0e13b186ca0ceae53c4bf0e0dcd4533a8af496c3ee851272275538fb874",
		config: "5681426d4aead22195de70531eeeeddb46493cfaffc5764b2ea3db73428b651c"
	},
	"en_US-arctic-medium": {
		onnx: "87057d77bee2a3104a65655adf2d7a1c70ab93b50c8d37c690dbf5660391e4ff",
		config: "db2ca1a55db01cdd3ce28ae63037ac525133e9e00ca557430dec572643235efe"
	},
	"en_GB-cori-medium": {
		onnx: "30b6781fbf12ea790f67bb8f2aca550fbc83ab63178d62d181b6aa8369172d29",
		config: "e262c16d7f192f69d4edd6b4ef8a5915379e67495fcc402f1ab15eeb33da3d36"
	},
	"en_US-libritts-high": {
		onnx: "5478bb7603d3b7f6e6fc94a3df720647217bc73e4059a6caa7d2bf3f34840376",
		config: "2efdc6d7f954588b8180132cbd9b8001933fdd00932c92bc92fd0d2028a9eb3d"
	},
	"nl_NL-alex-medium": {
		onnx: "a0a8607801723803898cacc2c0708fc9e7a05ee96bcd4fa2a9464a5102bfb79e",
		config: "9ea643871742c038511b6aaf20e6fc098a78a11968122d2f6ca3e50403423f95"
	},
	"nl_BE-rdh-medium": {
		onnx: "71fbf84e2601f41727b59032e224f676b2c5bae24ad0b4ae52fdb9267d08c741",
		config: "65deb256664d22099b0db5bb36d96237a3e32e43885c6ce4ee6811e6c04a8d79"
	},
	"sv_SE-alma-medium": {
		onnx: "748ea1721d9399bffdab7120fddc66bf444127d3ac8d79e7d50aa73bc3a6991d",
		config: "6924380892f769afa92fc6b28ff91d558690d7fb4e3ef8cbf821cefadc8f38fe"
	},
	"sv_SE-nst-medium": {
		onnx: "99ed2539d568c01598f15d1c175c0795f0cee61588baa77dc663edaab30dd9ce",
		config: "d45dd74cbb4eca58694bf04a97e243044092476f28a55ae26424f0653086980a"
	},
	"uk_UA-ukrainian_tts-medium": {
		onnx: "3d9412227941720605876329ca2be7b9bcce6d8265779b483d6050b7c497045a",
		config: "4e96e72917ca9b94edc77d6ccfee03a73f450ba2fc1ca93c2e562bc014e5aa55"
	}
}, l = {
	"en_US-bryce-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/male/Bryce/en_US-bryce-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/male/Bryce/en_US-bryce-medium.onnx.json"
	},
	"en_US-ljspeech-high": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Ljspeech/en_US-ljspeech-high.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Ljspeech/en_US-ljspeech-high.onnx.json"
	},
	"en_US-kristin-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Kristin/en_US-kristin-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Kristin/en_US-kristin-medium.onnx.json"
	},
	"en_US-arctic-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Arctic/en_US-arctic-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Arctic/en_US-arctic-medium.onnx.json"
	},
	"en_GB-cori-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/UK/female/Cori/en_GB-cori-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/UK/female/Cori/en_GB-cori-medium.onnx.json"
	},
	"en_US-libritts-high": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/multi/Libritts/en_US-libritts-high.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/multi/Libritts/en_US-libritts-high.onnx.json"
	},
	"nl_NL-alex-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/NL/male/Alex/nl_NL-alex-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/NL/male/Alex/nl_NL-alex-medium.onnx.json"
	},
	"nl_BE-rdh-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/BE/male/Rdh/nl_BE-rdh-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/BE/male/Rdh/nl_BE-rdh-medium.onnx.json"
	},
	"sv_SE-alma-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/female/Alma/sv_SE-alma-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/female/Alma/sv_SE-alma-medium.onnx.json"
	},
	"sv_SE-nst-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/male/Nst/sv_SE-nst-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/male/Nst/sv_SE-nst-medium.onnx.json"
	},
	"uk_UA-ukrainian_tts-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/ukrainian/multi/UkrainianTts/uk_UA-ukrainian_tts-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/ukrainian/multi/UkrainianTts/uk_UA-ukrainian_tts-medium.onnx.json"
	}
}, u = {
	".wasm": "application/wasm",
	".mjs": "text/javascript",
	".js": "text/javascript",
	".data": "application/octet-stream",
	".onnx": "application/octet-stream",
	".json": "application/json"
}, d = new BroadcastChannel("piper-download-progress");
function f(e, t) {
	let n = t instanceof Error;
	d.postMessage({
		type: "error",
		filename: e,
		message: n ? t.message : String(t),
		stack: n ? t.stack : void 0,
		code: n ? t.name : "UNKNOWN_ERROR"
	});
}
t.addEventListener("install", () => {
	t.skipWaiting();
}), t.addEventListener("activate", (e) => {
	e.waitUntil(t.clients.claim());
}), t.addEventListener("fetch", (e) => {
	let n = new URL(e.request.url);
	if (n.searchParams.has("bypass-sw") || n.origin !== t.location.origin || !n.pathname.startsWith("/piper-gate/")) return;
	let r = n.pathname.slice(12);
	if (r) {
		if (e.request.method === "DELETE") {
			e.respondWith(S(r));
			return;
		}
		e.respondWith(p(r, e.request));
	}
});
async function p(e, t) {
	try {
		let n = C(e), r = e.split("/");
		if (r.length !== 2) return new Response(`[piper-gate] Invalid path format: ${e}`, { status: 400 });
		let [i, a] = r;
		return e === "piper-callback.js" || a === "piper-callback.js" ? await h() : i === "infra" ? await m(a, n) : i === "voices" ? await g(a, n, t) : new Response(`[piper-gate] Unknown directory: ${i}`, { status: 400 });
	} catch (t) {
		return f(e, t), new Response(t instanceof Error ? t.message : String(t), {
			status: 500,
			statusText: "Piper Gateway Resolver Error"
		});
	}
}
async function m(e, t) {
	let n = o[e];
	if (!n) return new Response(`[piper-gate] Unknown infra asset: ${e}`, { status: 404 });
	let a = await y(i, e);
	if (a) {
		if (await r(a, n)) return console.log(`[piper-gate] Infra asset verified from OPFS: ${e}`), new Response(a, {
			status: 200,
			headers: {
				"Content-Type": t,
				"x-piper-sw": "verified"
			}
		});
		console.warn(`[piper-gate] Corrupted infra asset detected, deleting: ${e}`), await x(i, e);
	}
	try {
		let a = await fetch(`/piper-gate/infra/${e}`);
		if (a.ok) {
			let o = await a.arrayBuffer();
			if (await r(o, n)) return await b(i, e, o), console.log(`[piper-gate] Infra asset downloaded and verified: ${e}`), new Response(o, {
				status: 200,
				headers: {
					"Content-Type": t,
					"x-piper-sw": "verified"
				}
			});
			console.error(`[piper-gate] Local infra asset integrity mismatch: ${e}`);
		}
	} catch {}
	let c = s[e];
	if (!c) return new Response(`[piper-gate] No CDN URL for infra asset: ${e}`, { status: 404 });
	try {
		let a = await fetch(c);
		if (!a.ok) return new Response(`[piper-gate] CDN returned ${a.status} for: ${e}`, { status: 502 });
		let o = await a.arrayBuffer();
		return await r(o, n) ? (await b(i, e, o), console.log(`[piper-gate] Infra asset from CDN verified: ${e}`), new Response(o, {
			status: 200,
			headers: {
				"Content-Type": t,
				"x-piper-sw": "verified"
			}
		})) : new Response(`[piper-gate] CDN asset integrity mismatch: ${e}`, { status: 403 });
	} catch (t) {
		return console.error(`[piper-gate] CDN fetch failed for ${e}:`, t), new Response(`[piper-gate] CDN unreachable for: ${e}`, { status: 502 });
	}
}
async function h() {
	let e = o["piper-callback.js"];
	if (!e) return new Response("[piper-gate] Integrity Hash Missing: The 'piper-callback.js' hash must be explicitly set in the INFRA_SHA256_REGISTRY.", { status: 404 });
	try {
		let t = await fetch("/piper-callback.js");
		if (!t.ok) return new Response("[piper-gate] File Missing: 'piper-callback.js' could not be found at the origin root.", { status: 404 });
		let n = await t.arrayBuffer();
		return await r(n, e) ? (console.log("[piper-gate] Sovereign Callback verified successfully."), new Response(n, {
			status: 200,
			headers: {
				"Content-Type": "text/javascript",
				"x-piper-sw": "verified"
			}
		})) : (console.error("[piper-gate] Integrity Violation: 'piper-callback.js' hash mismatch."), new Response("[piper-gate] Integrity Violation: The fetched 'piper-callback.js' does not match the expected SHA-256 hash.", { status: 403 }));
	} catch (e) {
		return console.error("[piper-gate] Sovereign Callback fetch failed:", e), new Response("[piper-gate] Internal Server Error: Failed to resolve callback.", { status: 500 });
	}
}
async function g(t, n, i) {
	let o = t.endsWith(".onnx.json"), s = o ? t.slice(0, -10) : t.slice(0, -5), u = o ? "config" : "onnx", f = i.headers.get("x-piper-cache-download") === "true", p = null, m = c[s];
	if (m && (p = u === "onnx" ? m.onnx ?? null : m.config ?? null), !p) {
		let e = i.headers.get(`x-piper-sha256-${u}`);
		e && (p = e);
	}
	if (!p) {
		let e = i.headers.get(`x-piper-url-${u}`);
		e && (p = await v(e));
	}
	if (!p) return console.error(`[piper-gate] No SHA-256 available for voice: ${t}`), new Response(`[piper-gate] SHA-256 required for voice asset: ${t}. Provide via x-piper-sha256-${u} header or use a registered model.`, { status: 403 });
	let h = await y(a, t);
	if (h) {
		if (await r(h, p)) return console.log(`[piper-gate] Voice asset verified from OPFS: ${t}`), new Response(h, {
			status: 200,
			headers: {
				"Content-Type": n,
				"x-piper-sw": "verified"
			}
		});
		console.warn(`[piper-gate] Corrupted voice asset detected, deleting: ${t}`), await x(a, t);
	}
	let g = null;
	if (m && l[s]) {
		let e = l[s];
		g = u === "onnx" ? e.onnx : e.config;
	}
	if (!g) {
		let e = i.headers.get(`x-piper-url-${u}`);
		e && (g = e);
	}
	if (!g) return new Response(`[piper-gate] No source URL for voice: ${t}`, { status: 404 });
	try {
		let o = _(g), s, c = 0;
		if (o) {
			console.log(`[piper-gate] Using HF Hub download for: ${t}`);
			let n = await e({
				repo: o.repo,
				revision: o.revision,
				path: o.path,
				fetch: (e, t) => fetch(e, {
					...t,
					signal: i.signal
				})
			});
			if (!n) return new Response(`[piper-gate] HF Hub failed to resolve: ${t}`, { status: 502 });
			c = n.size, d.postMessage({
				type: "progress",
				filename: t,
				downloaded: c,
				total: c
			}), s = await n.arrayBuffer();
		} else {
			let e = await fetch(g, { signal: i.signal });
			if (!e.ok) return new Response(`[piper-gate] Source returned ${e.status} for: ${t}`, { status: 502 });
			c = Number(e.headers.get("Content-Length")) || 0;
			let n = e.body?.getReader();
			if (!n) return new Response(`[piper-gate] No response body for: ${t}`, { status: 502 });
			let r = [], a = 0, o = 0;
			try {
				for (;;) {
					let { done: e, value: i } = await n.read();
					if (e) break;
					r.push(i), a += i.length;
					let s = Date.now();
					s - o > 100 && (d.postMessage({
						type: "progress",
						filename: t,
						downloaded: a,
						total: c || a
					}), o = s);
				}
			} finally {
				n.releaseLock();
			}
			s = await new Blob(r).arrayBuffer();
		}
		return await r(s, p) ? (await b(a, t, s), console.log(`[piper-gate] Voice asset downloaded and verified: ${t}`), f ? new Response(null, {
			status: 204,
			headers: {
				"x-piper-sw": "verified",
				"x-piper-sha256": p
			}
		}) : new Response(s, {
			status: 200,
			headers: {
				"Content-Type": n,
				"x-piper-sw": "verified"
			}
		})) : (console.error(`[piper-gate] Voice asset integrity mismatch: ${t}`), new Response(`[piper-gate] Integrity mismatch for: ${t}`, { status: 403 }));
	} catch (e) {
		return e instanceof Error && e.name === "AbortError" ? new Response(`[piper-gate] Download aborted: ${t}`, { status: 499 }) : (console.error(`[piper-gate] Download failed for ${t}:`, e), new Response(`[piper-gate] Download failed for: ${t}`, { status: 502 }));
	}
}
function _(e) {
	let t = e.match(/^https:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\/([^/]+)\/(.+)$/);
	return t ? {
		repo: t[1],
		revision: t[2],
		path: t[3]
	} : null;
}
async function v(e) {
	let t = _(e);
	if (!t) return null;
	try {
		let e = t.path.split("/"), n = e.pop() || "", r = e.join("/"), i = `https://huggingface.co/api/models/${t.repo}/tree/${t.revision}/${r}`, a = await fetch(i);
		return a.ok && (await a.json()).find((e) => e.path === t.path || e.path.endsWith(n))?.lfs?.oid || null;
	} catch {
		return null;
	}
}
async function y(e, t) {
	try {
		return await (await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !1 })).getFileHandle(t, { create: !1 })).getFile()).arrayBuffer();
	} catch {
		return null;
	}
}
async function b(e, t, n) {
	try {
		let r = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !0 })).getFileHandle(t, { create: !0 })).createWritable();
		await r.write(n), await r.close();
	} catch (n) {
		console.warn(`[piper-gate] OPFS write failed for ${e}/${t}:`, n);
	}
}
async function x(e, t) {
	try {
		await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !1 })).removeEntry(t);
	} catch {}
}
async function S(e) {
	try {
		let t = await navigator.storage.getDirectory();
		if (e === "voices/" || e === "voices") {
			try {
				await t.removeEntry("voices", { recursive: !0 }), console.log("[piper-gate] Voice cache cleared (recursive)");
			} catch (e) {
				if (!(e instanceof Error && (e.name === "NotFoundError" || e.message.toLowerCase().includes("not found")))) throw e;
			}
			return new Response(null, { status: 204 });
		}
		if (e.startsWith("voices/")) {
			let n = e.slice(7);
			if (!n) return new Response("[piper-gate] Missing modelId for deletion", { status: 400 });
			let r = await t.getDirectoryHandle("voices", { create: !1 }).catch(() => null);
			if (r) {
				for (let e of [".onnx", ".onnx.json"]) try {
					await r.removeEntry(`${n}${e}`);
				} catch (e) {
					if (!(e instanceof Error && (e.name === "NotFoundError" || e.message.toLowerCase().includes("not found")))) throw e;
				}
				console.log(`[piper-gate] Model assets purged: ${n}`);
			}
			return new Response(null, { status: 204 });
		}
		return new Response(`[piper-gate] Unsupported deletion path: ${e}`, { status: 400 });
	} catch (t) {
		return console.error(`[piper-gate] Deletion failed for ${e}:`, t), new Response("[piper-gate] Internal OPFS Error", { status: 500 });
	}
}
function C(e) {
	return u[e.substring(e.lastIndexOf("."))] ?? "application/octet-stream";
}
//#endregion
